import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, medication_schedule_id, outcome, refusal_reason, prn_reason, stock_before, stock_after, outcome_notes, witness_staff_id, manager_remote_auth_id, manager_remote_auth_image_url } = body;
  if (!shift_id || !client_id || !medication_schedule_id || !outcome) {
    return NextResponse.json({ error: "shift_id, client_id, medication_schedule_id, outcome required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Controlled-drug double-check (BUILD_SPEC B11): an administered controlled
  // drug must have either a second-worker witness OR manager remote auth.
  const { data: schedule } = await supabase
    .from("medication_schedules")
    .select("is_controlled")
    .eq("id", medication_schedule_id)
    .single();

  if (schedule?.is_controlled && outcome === "administered" && !witness_staff_id && !manager_remote_auth_id) {
    return NextResponse.json(
      { error: "Controlled drug: a second-worker witness or manager remote authorisation is required before this can be recorded as administered." },
      { status: 422 }
    );
  }

  const { data, error } = await supabase.from("medication_records").insert({
    shift_id, client_id, medication_schedule_id,
    staff_id: user.id,
    outcome: outcome,
    refusal_reason: refusal_reason || null,
    prn_reason: prn_reason || null,
    stock_before: stock_before ?? null,
    stock_after: stock_after ?? null,
    outcome_notes: outcome_notes || null,
    witness_staff_id: witness_staff_id || null,
    witness_confirmed_at: witness_staff_id ? now : null,
    manager_remote_auth_id: manager_remote_auth_id || null,
    manager_remote_auth_image_url: manager_remote_auth_image_url || null,
    manager_remote_auth_at: manager_remote_auth_id ? now : null,
    administered_at: outcome === "administered" ? now : null,
    server_timestamp: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
