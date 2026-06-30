import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";

const SYSTEM = `You are a CQC compliance specialist AI for a UK domiciliary care service. You will be given operational data from the past 30 days. Score the service against the CQC Single Assessment Framework's 5 key questions and provide evidence.

Return a JSON object with:
- safe_score: number 0-100
- effective_score: number 0-100
- caring_score: number 0-100
- responsive_score: number 0-100
- well_led_score: number 0-100
- overall_compliance_score: number 0-100 (weighted average)
- inspection_ready: boolean (true if overall >= 70 and no critical gaps)
- evidence_by_standard: object with keys "SAFE", "EFFECTIVE", "CARING", "RESPONSIVE", "WELL_LED", each containing:
  - score: number 0-100
  - strengths: array of strings (what the data shows is working well)
  - gaps: array of strings (what is missing or concerning)
  - evidence_count: number of data points supporting this score
- gaps: array of strings (top 5 overall gaps requiring immediate attention)
- narrative: 2-3 sentence overall assessment

Return ONLY valid JSON.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: shifts },
    { data: incidents },
    { data: safeguarding },
    { data: medRecords },
    { data: staffCompliance },
    { data: supervisions },
    { data: handovers },
    { data: roleBoundary },
    { data: wellbeing },
    { count: totalClients },
  ] = await Promise.all([
    supabase.from("shifts").select("status, actual_start, actual_end").eq("organisation_id", caller.organisation_id).gte("scheduled_start", since),
    supabase.from("incidents").select("incident_type, physical_intervention_occurred, pi_debrief_scheduled, staff_wellbeing_checked").gte("server_timestamp", since),
    supabase.from("safeguarding_concerns").select("status, bypass_line_manager, escalated_to_local_authority").gte("server_timestamp", since),
    supabase.from("medication_records").select("outcome").gte("server_timestamp", since),
    supabase.from("staff_compliance").select("status, valid_until, compliance_item").in("staff_id", supabase.from("users").select("id").eq("organisation_id", caller.organisation_id)),
    supabase.from("supervision_records").select("supervision_date, next_supervision_due").gte("supervision_date", since),
    supabase.from("handover_notes").select("outgoing_approved_at, incoming_read_confirmed_at").gte("server_timestamp", since),
    supabase.from("role_boundary_violations").select("id").gte("server_timestamp", since),
    supabase.from("staff_wellbeing_checks").select("wellbeing_status, flagged_for_manager, manager_acknowledged_at").gte("server_timestamp", since),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organisation_id", caller.organisation_id),
  ]);

  const shiftsCompleted = shifts?.filter(s => s.status === "completed").length || 0;
  const shiftsMissed = shifts?.filter(s => s.status === "missed").length || 0;
  const medAdministered = medRecords?.filter(m => m.outcome === "administered").length || 0;
  const medRefused = medRecords?.filter(m => m.outcome === "refused").length || 0;
  const piWithoutDebrief = incidents?.filter(i => i.physical_intervention_occurred && !i.pi_debrief_scheduled).length || 0;
  const expiredCompliance = staffCompliance?.filter(s => s.status === "expired" || (s.valid_until && new Date(s.valid_until) < new Date())).length || 0;
  const overdueSupervisions = supervisions?.filter(s => s.next_supervision_due && new Date(s.next_supervision_due) < new Date()).length || 0;

  const context = `ORGANISATION SUMMARY (last 30 days)
Total clients: ${totalClients || 0}
Shifts completed: ${shiftsCompleted} | missed: ${shiftsMissed}
Incidents: ${incidents?.length || 0} | PI without debrief: ${piWithoutDebrief}
Safeguarding concerns: ${safeguarding?.length || 0} | open: ${safeguarding?.filter(s => s.status === "open").length || 0}
Medication administered: ${medAdministered} | refused: ${medRefused}
Staff compliance items expired: ${expiredCompliance}
Supervisions overdue: ${overdueSupervisions}
Handovers submitted: ${handovers?.length || 0} | approved: ${handovers?.filter(h => h.outgoing_approved_at).length || 0}
Role boundary violations: ${roleBoundary?.length || 0}
Staff wellbeing checks: ${wellbeing?.length || 0} | flagged: ${wellbeing?.filter(w => w.flagged_for_manager).length || 0} | unacknowledged: ${wellbeing?.filter(w => w.flagged_for_manager && !w.manager_acknowledged_at).length || 0}`;

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: context }],
    });

    const text = message.content.find(c => c.type === "text")?.text || "{}";
    const scores = JSON.parse(text.trim());

    // Get or create evidence pack
    const { data: existing } = await supabase.from("cqc_evidence_packs")
      .select("id").eq("organisation_id", caller.organisation_id)
      .maybeSingle();

    const packData = {
      organisation_id: caller.organisation_id,
      service_line_id: null,
      last_updated_at: new Date().toISOString(),
      safe_score: scores.safe_score,
      effective_score: scores.effective_score,
      caring_score: scores.caring_score,
      responsive_score: scores.responsive_score,
      well_led_score: scores.well_led_score,
      overall_compliance_score: scores.overall_compliance_score,
      gaps: scores.gaps,
      evidence_by_standard: scores.evidence_by_standard,
      inspection_ready: scores.inspection_ready,
    };

    if (existing?.id) {
      await supabase.from("cqc_evidence_packs").update(packData).eq("id", existing.id);
    } else {
      await supabase.from("cqc_evidence_packs").insert(packData);
    }

    return NextResponse.json({ scores, narrative: scores.narrative });
  } catch (err) {
    console.error("CQC evidence pack error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
