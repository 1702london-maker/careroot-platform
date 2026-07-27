import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, perpetrator, description, gps_lat, gps_lng, imei } = await req.json();
  if (!shift_id || !client_id || !perpetrator || !description) {
    return NextResponse.json({ error: "shift_id, client_id, perpetrator, description required" }, { status: 400 });
  }

  const access = await verifyActiveShiftAccess(supabase, {
    userId: user.id,
    shiftId: shift_id,
    clientId: client_id,
    imei,
    gpsLat: gps_lat ?? null,
    gpsLng: gps_lng ?? null,
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const now = new Date().toISOString();

  const { data, error } = await supabase.from("verbal_abuse_reports").insert({
    shift_id, client_id, staff_id: user.id,
    perpetrator, description,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    server_timestamp: now,
    notification_sent_at: now,
    resolved: false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Tri-party notification: manager + HR lead + compliance lead (B10).
  const { data: me } = await supabase
    .from("users").select("first_name, last_name").eq("id", user.id).single();
  if (access.organisationId) {
    const staffName = me ? `${me.first_name} ${me.last_name}` : "A worker";
    await notify(supabase, {
      organisationId: access.organisationId,
      recipientGroups: ["manager", "hr_lead", "compliance_lead"],
      message: messages.verbalAbuse(staffName, perpetrator, access.clientName),
    });
  }

  return NextResponse.json({ report: data });
}
