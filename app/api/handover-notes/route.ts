import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, current_status, key_events, nutrition_summary, medication_summary, actions_for_incoming_worker, triggers_activated_this_shift, imei, gps_lat, gps_lng } = body;

  if (!shift_id || !client_id || !current_status) {
    return NextResponse.json({ error: "shift_id, client_id, current_status required" }, { status: 400 });
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

  const { data, error } = await supabase.from("handover_notes").insert({
    shift_id, client_id,
    outgoing_staff_id: user.id,
    current_status,
    key_events: key_events || null,
    nutrition_summary: nutrition_summary || null,
    medication_summary: medication_summary || null,
    actions_for_incoming_worker: actions_for_incoming_worker || null,
    triggers_activated_this_shift: triggers_activated_this_shift || null,
    outgoing_approved_at: new Date().toISOString(),
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ handover: data });
}
