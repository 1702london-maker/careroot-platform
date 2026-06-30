import { NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";

/**
 * Keeps the CQC evidence pack LIVE (BUILD_SPEC B18): regenerates every
 * organisation's pack daily from the last 30 days of operational data, so the
 * inspection score is always current rather than only when a manager clicks.
 */
const SYSTEM = `You are a CQC compliance specialist for a UK domiciliary care service. Score the service against the CQC Single Assessment Framework's 5 key questions from the 30-day data provided.
Return ONLY valid JSON: { safe_score, effective_score, caring_score, responsive_score, well_led_score, overall_compliance_score (weighted avg), inspection_ready (bool: overall>=70 and no critical gaps), evidence_by_standard: { SAFE/EFFECTIVE/CARING/RESPONSIVE/WELL_LED: { score, strengths:[], gaps:[], evidence_count } }, gaps: [top 5], narrative }`;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: orgs } = await supabase.from("organisations").select("id");
  if (!orgs?.length) return NextResponse.json({ refreshed: 0 });

  let refreshed = 0;
  const errors: string[] = [];

  for (const org of orgs) {
    try {
      const orgClientsRes = await supabase.from("clients").select("id").eq("organisation_id", org.id);
      const clientIds = (orgClientsRes.data ?? []).map((c) => c.id);
      if (!clientIds.length) continue;

      const [
        { data: shifts }, { data: incidents }, { data: safeguarding },
        { data: medRecords }, { data: staffCompliance }, { data: supervisions },
        { data: handovers }, { data: roleBoundary }, { data: wellbeing },
      ] = await Promise.all([
        supabase.from("shifts").select("status").eq("organisation_id", org.id).gte("scheduled_start", since),
        supabase.from("incidents").select("physical_intervention_occurred, pi_debrief_scheduled").in("client_id", clientIds).gte("server_timestamp", since),
        supabase.from("safeguarding_concerns").select("status").in("client_id", clientIds).gte("server_timestamp", since),
        supabase.from("medication_records").select("status").in("client_id", clientIds).gte("server_timestamp", since),
        supabase.from("staff_compliance").select("status, valid_until"),
        supabase.from("supervision_records").select("next_supervision_due").gte("supervision_date", since),
        supabase.from("handover_notes").select("outgoing_approved_at").in("client_id", clientIds).gte("server_timestamp", since),
        supabase.from("role_boundary_violations").select("id").in("client_id", clientIds).gte("server_timestamp", since),
        supabase.from("staff_wellbeing_checks").select("flagged_for_manager, manager_acknowledged_at").gte("server_timestamp", since),
      ]);

      const piNoDebrief = incidents?.filter((i) => i.physical_intervention_occurred && !i.pi_debrief_scheduled).length || 0;
      const medAdmin = medRecords?.filter((m) => m.status === "administered").length || 0;
      const expiredComp = staffCompliance?.filter((s) => s.status === "expired" || (s.valid_until && new Date(s.valid_until) < new Date())).length || 0;
      const overdueSup = supervisions?.filter((s) => s.next_supervision_due && new Date(s.next_supervision_due) < new Date()).length || 0;

      const context = `ORG SUMMARY (30 days)
Clients: ${clientIds.length}
Shifts: ${shifts?.length || 0} (missed: ${shifts?.filter((s) => s.status === "missed").length || 0})
Incidents: ${incidents?.length || 0} | PI without debrief: ${piNoDebrief}
Safeguarding: ${safeguarding?.length || 0} (open: ${safeguarding?.filter((s) => s.status === "open").length || 0})
Medication administered: ${medAdmin} | refused: ${medRecords?.filter((m) => m.status === "refused").length || 0}
Staff compliance expired: ${expiredComp}
Supervisions overdue: ${overdueSup}
Handovers approved: ${handovers?.filter((h) => h.outgoing_approved_at).length || 0}/${handovers?.length || 0}
Role boundary violations: ${roleBoundary?.length || 0}
Wellbeing flags unacknowledged: ${wellbeing?.filter((w) => w.flagged_for_manager && !w.manager_acknowledged_at).length || 0}`;

      const anthropic = getAnthropic();
      const message = await anthropic.messages.create({
        model: MODEL, max_tokens: 2048, system: SYSTEM,
        messages: [{ role: "user", content: context }],
      });
      const text = message.content.find((c) => c.type === "text")?.text || "{}";
      const scores = JSON.parse(text.trim());

      const packData = {
        organisation_id: org.id,
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

      const { data: existing } = await supabase.from("cqc_evidence_packs")
        .select("id").eq("organisation_id", org.id).maybeSingle();
      if (existing?.id) {
        await supabase.from("cqc_evidence_packs").update(packData).eq("id", existing.id);
      } else {
        await supabase.from("cqc_evidence_packs").insert(packData);
      }

      refreshed++;
      await new Promise((r) => setTimeout(r, 400)); // gentle on the API
    } catch (e) {
      errors.push(`${org.id}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ refreshed, errors });
}
