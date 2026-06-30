import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, current_status, key_events, nutrition_summary, medication_summary, actions_for_incoming_worker, triggers_activated_this_shift } = body;

  if (!shift_id || !client_id || !current_status) {
    return NextResponse.json({ error: "shift_id, client_id, current_status required" }, { status: 400 });
  }

  const { data: shift } = await supabase.from("shifts").select("staff_id").eq("id", shift_id).single();
  if (!shift || shift.staff_id !== user.id) {
    return NextResponse.json({ error: "You are not assigned to this shift" }, { status: 403 });
  }

  const { data, error } = await supabase.from("handover_notes").insert({
    shift_id, client_id,
    outgoing_staff_id: user.id,
    current_status,
    key_events: key_events || null,
    nutrition_summary: nutrition_summary || null,
    medication_summary: medication_summary || null,
    actions_for_incoming_worker: actions_for_incoming_worker || null,
    triggers_activated_this_shift: triggers_activated_this_shift || null,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ handover: data });
}
