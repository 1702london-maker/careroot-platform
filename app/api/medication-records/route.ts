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
    authorisation_method,
    witness_staff_id,
    witness_name,
    manager_remote_auth_id,
    manager_remote_auth_name,
    manager_remote_auth_image_url,
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

  const hasControlledAuthorisation = Boolean(witness_staff_id) || Boolean(manager_remote_auth_id);

  if (schedule?.is_controlled && outcome === "administered" && !hasControlledAuthorisation) {
    return NextResponse.json(
      { error: "Controlled drug: select a registered second-worker witness or manager remote authorisation before this can be recorded as administered." },
      { status: 422 }
    );
  }

  let witnessNameFromRecord: string | null = null;
  let managerNameFromRecord: string | null = null;
  if (schedule?.is_controlled && witness_staff_id) {
    if (witness_staff_id === user.id) {
      return NextResponse.json({ error: "Controlled drug witness must be another registered staff member." }, { status: 422 });
    }
    const { data: witness } = await supabase
      .from("users")
      .select("id, first_name, last_name, organisation_id, is_active")
      .eq("id", witness_staff_id)
      .single();
    if (!witness || witness.organisation_id !== access.organisationId || witness.is_active === false) {
      return NextResponse.json({ error: "Selected witness is not an active staff member in this organisation." }, { status: 422 });
    }
    witnessNameFromRecord = `${witness.first_name} ${witness.last_name}`;
  }
  if (schedule?.is_controlled && manager_remote_auth_id) {
    const { data: manager } = await supabase
      .from("users")
      .select("id, first_name, last_name, organisation_id, role, is_active")
      .eq("id", manager_remote_auth_id)
      .single();
    if (!manager || manager.organisation_id !== access.organisationId || manager.is_active === false || !["manager", "org_admin", "superadmin"].includes(manager.role)) {
      return NextResponse.json({ error: "Selected authorising manager is not valid for this organisation." }, { status: 422 });
    }
    managerNameFromRecord = `${manager.first_name} ${manager.last_name}`;
  }

  const liveStatus =
    outcome === "administered" ? "given" :
    outcome === "omitted" ? "unavailable" :
    outcome;

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

  const notesParts = [outcome_notes].filter((part) => String(part || "").trim());
  if (schedule?.is_controlled && witnessNameFromRecord) notesParts.push(`Witness: ${witnessNameFromRecord}`);
  if (schedule?.is_controlled && managerNameFromRecord) notesParts.push(`Manager authorisation: ${managerNameFromRecord}`);
  if (stockDiscrepancyDetected) notesParts.push(`Stock discrepancy: expected ${expectedStockAfter}, recorded ${normalisedStockAfter}`);

  const stockDiscrepancyAmount =
    stockDiscrepancyDetected && expectedStockAfter !== null && normalisedStockAfter !== null
      ? Math.abs(normalisedStockAfter - expectedStockAfter)
      : null;

  const record: Record<string, unknown> = {
    shift_id, client_id, medication_schedule_id,
    administered_by: user.id,
    status: liveStatus,
    refusal_reason: refusal_reason || null,
    prn_reason: prn_reason || null,
    stock_before: normalisedStockBefore,
    stock_after: normalisedStockAfter,
    outcome_notes: notesParts.length > 0 ? notesParts.join("\n") : null,
    administered_at: liveStatus === "given" ? now : null,
    server_timestamp: now,
    // Migration 059 columns
    authorisation_method: schedule?.is_controlled && outcome === "administered" ? (authorisation_method || null) : null,
    witness_name: schedule?.is_controlled ? witnessNameFromRecord : null,
    manager_remote_auth_name: schedule?.is_controlled ? managerNameFromRecord : null,
    stock_discrepancy_detected: stockDiscrepancyDetected || false,
    stock_discrepancy_amount: stockDiscrepancyAmount,
    stock_discrepancy_note: stockDiscrepancyDetected
      ? `Expected ${expectedStockAfter}, recorded ${normalisedStockAfter}`
      : null,
  };
  // Only attach FK witness fields when present (IDs, not plain-text names).
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
