import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auto-synthesise a handover note from a shift's structured data (BUILD_SPEC B14).
 * Raw shift_logs are summarised — never passed through verbatim to the incoming
 * worker. Returns a draft the outgoing worker reviews and signs off.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id } = await req.json();
  if (!shift_id || !client_id) {
    return NextResponse.json({ error: "shift_id and client_id required" }, { status: 400 });
  }

  // Only the worker who held the shift may generate its handover.
  const { data: shift } = await supabase
    .from("shifts").select("staff_id").eq("id", shift_id).single();
  if (!shift || shift.staff_id !== user.id) {
    return NextResponse.json({ error: "You are not assigned to this shift" }, { status: 403 });
  }

  const [{ data: logs }, { data: meds }, { data: nutrition }, { data: incidents }] = await Promise.all([
    supabase.from("shift_logs").select("log_type, content, triggers_detected").eq("shift_id", shift_id).order("server_timestamp"),
    supabase.from("medication_records").select("outcome, refusal_reason").eq("shift_id", shift_id),
    supabase.from("nutrition_records").select("meal_type, consumed, fluid_intake_ml").eq("shift_id", shift_id),
    supabase.from("incidents").select("incident_type, behaviour_description").eq("shift_id", shift_id),
  ]);

  // --- Synthesise (summaries, not raw logs) ---
  const keyEventLogs = (logs ?? []).filter((l) => ["behaviour", "handover", "general", "task_completion"].includes(l.log_type));
  const keyEvents = keyEventLogs.length
    ? `${keyEventLogs.length} significant entries logged this shift. ${keyEventLogs.slice(0, 3).map((l) => String(l.content).slice(0, 120)).join(" · ")}`
    : "No significant events logged.";

  const medAdministered = (meds ?? []).filter((m) => m.outcome === "administered").length;
  const medRefused = (meds ?? []).filter((m) => m.outcome === "refused").length;
  const medMissed = (meds ?? []).filter((m) => m.outcome === "missed").length;
  const medicationSummary = (meds ?? []).length
    ? `${medAdministered} administered, ${medRefused} refused, ${medMissed} missed.`
    : "No medication due this shift.";

  const totalFluids = (nutrition ?? []).reduce((s, n) => s + (n.fluid_intake_ml ?? 0), 0);
  const poorIntake = (nutrition ?? []).filter((n) => ["little", "none"].includes(String(n.consumed))).length;
  const nutritionSummary = (nutrition ?? []).length
    ? `${(nutrition ?? []).length} meals/fluids recorded, ${totalFluids}ml fluids total${poorIntake ? `, ${poorIntake} with poor intake` : ""}.`
    : "No nutrition recorded.";

  const triggers = Array.from(new Set((logs ?? []).flatMap((l) => (l.triggers_detected as string[] | null) ?? [])));
  const triggersText = triggers.length ? triggers.join(", ") : "None detected.";

  const incidentText = (incidents ?? []).length
    ? `${(incidents ?? []).length} incident(s): ${(incidents ?? []).map((i) => i.incident_type).join(", ")}.`
    : "";

  const actionsForIncoming = [
    medMissed ? "Follow up on missed medication." : "",
    poorIntake ? "Monitor food/fluid intake." : "",
    triggers.length ? "Review triggers activated this shift." : "",
    incidentText ? "Read incident records before contact." : "",
  ].filter(Boolean).join(" ") || "Continue care plan as normal.";

  const draft = {
    shift_id, client_id,
    outgoing_staff_id: user.id,
    current_status: incidentText ? "Requires attention — see incidents" : "Stable",
    key_events: keyEvents,
    nutrition_summary: nutritionSummary,
    medication_summary: medicationSummary,
    actions_for_incoming_worker: actionsForIncoming,
    triggers_activated_this_shift: triggersText,
    server_timestamp: new Date().toISOString(),
  };

  // Upsert: replace any existing unsigned draft for this shift.
  await supabase.from("handover_notes").delete().eq("shift_id", shift_id).is("outgoing_approved_at", null);
  const { data, error } = await supabase.from("handover_notes").insert(draft).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ handover: data });
}
