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

  const record: Record<string, unknown> = {
    shift_id, client_id, medication_schedule_id,
    staff_id: user.id,
    status: outcome, // live column is `status` (API keeps `outcome` as the field name)
    refusal_reason: refusal_reason || null,
    prn_reason: prn_reason || null,
    stock_before: stock_before ?? null,
    stock_after: stock_after ?? null,
    outcome_notes: outcome_notes || null,
    administered_at: outcome === "administered" ? now : null,
    server_timestamp: now,
  };
  // Only attach controlled-drug witness fields when actually used, so normal
  // medication recording never depends on those columns being present.
  if (witness_staff_id) {
    record.witness_staff_id = witness_staff_id;
    record.witness_confirmed_at = now;
  }
  if (manager_remote_auth_id) {
    record.manager_remote_auth_id = manager_remote_auth_id;
    record.manager_remote_auth_image_url = manager_remote_auth_image_url || null;
    record.manager_remote_auth_at = now;
  }

  const { data, error } = await supabase.from("medication_records").insert(record).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
