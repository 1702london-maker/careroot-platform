import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, concern_description, bypass_line_manager, gps_lat, gps_lng, imei } = await req.json();
  if (!shift_id || !client_id || !concern_description) {
    return NextResponse.json({ error: "shift_id, client_id, concern_description required" }, { status: 400 });
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
  const bypass = bypass_line_manager ?? false;

  const { data, error } = await supabase.from("safeguarding_concerns").insert({
    shift_id, client_id, staff_id: user.id,
    concern_description,
    bypass_line_manager: bypass,
    notified_safeguarding_lead_at: now,
    notified_manager_at: bypass ? null : now,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    server_timestamp: now,
    status: "open",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire the actual alert. Bypass routes to the safeguarding lead ONLY
  // (line manager is excluded — they may be the subject of the concern).
  const { data: me } = await supabase
    .from("users").select("first_name, last_name").eq("id", user.id).single();
  if (access.organisationId) {
    const staffName = me ? `${me.first_name} ${me.last_name}` : "A worker";
    await notify(supabase, {
      organisationId: access.organisationId,
      recipientGroups: bypass ? ["safeguarding_lead"] : ["safeguarding_lead", "manager"],
      message: bypass
        ? messages.safeguardingBypass(staffName, access.clientName)
        : messages.safeguardingStandard(staffName, access.clientName, now),
    });
  }

  return NextResponse.json({ concern: data });
}
