import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const {
    shift_id,
    client_id,
    medication_schedule_id,
    outcome,
    refusal_reason,
    prn_reason,
    stock_before,
    stock_after,
    outcome_notes,
    witness_staff_id,
    witness_name,
    manager_remote_auth_id,
    manager_remote_auth_name,
    manager_remote_auth_image_url,
    authorisation_method,
    imei,
    gps_lat,
    gps_lng,
  } = body;
  if (!shift_id || !client_id || !medication_schedule_id || !outcome) {
    return NextResponse.json({ error: "shift_id, client_id, medication_schedule_id, outcome required" }, { status: 400 });
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

  // Controlled-drug double-check (BUILD_SPEC B11): an administered controlled
  // drug must have either a second-worker witness OR manager remote auth.
  const { data: schedule } = await supabase
    .from("medication_schedules")
    .select("is_controlled, is_prn, current_stock")
    .eq("id", medication_schedule_id)
    .single();

  if (schedule?.is_prn && outcome === "administered" && !String(prn_reason || "").trim()) {
    return NextResponse.json(
      { error: "PRN medication requires a reason before it can be recorded as administered." },
      { status: 422 }
    );
  }

  const hasControlledAuthorisation =
    Boolean(witness_staff_id) ||
    Boolean(manager_remote_auth_id) ||
    Boolean(String(witness_name || "").trim()) ||
    Boolean(String(manager_remote_auth_name || "").trim());

  if (schedule?.is_controlled && outcome === "administered" && !hasControlledAuthorisation) {
    return NextResponse.json(
      { error: "Controlled drug: a second-worker witness or manager remote authorisation is required before this can be recorded as administered." },
      { status: 422 }
    );
  }

  const normalisedStockBefore = stock_before === null || stock_before === undefined || stock_before === "" ? null : Number(stock_before);
  const normalisedStockAfter = stock_after === null || stock_after === undefined || stock_after === "" ? null : Number(stock_after);
  if (
    schedule?.is_controlled &&
    (normalisedStockBefore === null ||
      normalisedStockAfter === null ||
      Number.isNaN(normalisedStockBefore) ||
      Number.isNaN(normalisedStockAfter))
  ) {
    return NextResponse.json(
      { error: "Controlled drug stock before and stock after are required." },
      { status: 422 }
    );
  }

  const expectedStockAfter =
    schedule?.is_controlled && normalisedStockBefore !== null
      ? outcome === "administered"
        ? normalisedStockBefore - 1
        : normalisedStockBefore
      : null;
  const stockDiscrepancyDetected =
    expectedStockAfter !== null && normalisedStockAfter !== null && normalisedStockAfter !== expectedStockAfter;

  const record: Record<string, unknown> = {
    shift_id, client_id, medication_schedule_id,
    staff_id: user.id,
    status: outcome, // live column is `status` (API keeps `outcome` as the field name)
    refusal_reason: refusal_reason || null,
    prn_reason: prn_reason || null,
    stock_before: normalisedStockBefore,
    stock_after: normalisedStockAfter,
    outcome_notes: outcome_notes || null,
    administered_at: outcome === "administered" ? now : null,
    server_timestamp: now,
    authorisation_method: authorisation_method || null,
    witness_name: witness_name || null,
    manager_remote_auth_name: manager_remote_auth_name || null,
    stock_discrepancy_detected: stockDiscrepancyDetected,
    stock_discrepancy_amount: stockDiscrepancyDetected && expectedStockAfter !== null && normalisedStockAfter !== null ? normalisedStockAfter - expectedStockAfter : null,
    stock_discrepancy_note: stockDiscrepancyDetected ? `Expected ${expectedStockAfter}, recorded ${normalisedStockAfter}` : null,
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

  if (schedule?.is_controlled && normalisedStockAfter !== null) {
    await supabase
      .from("medication_schedules")
      .update({ current_stock: normalisedStockAfter })
      .eq("id", medication_schedule_id);
  }

  return NextResponse.json({ record: data });
}
