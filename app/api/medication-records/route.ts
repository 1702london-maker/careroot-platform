import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, medication_schedule_id, outcome, refusal_reason, prn_reason, stock_before, stock_after, outcome_notes } = body;
  if (!shift_id || !client_id || !medication_schedule_id || !outcome) {
    return NextResponse.json({ error: "shift_id, client_id, medication_schedule_id, outcome required" }, { status: 400 });
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
    administered_at: outcome === "administered" ? new Date().toISOString() : null,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
