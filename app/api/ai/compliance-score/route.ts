import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a CQC compliance specialist assessing a UK care agency against the 2026 Single Assessment Framework. You will receive compliance evidence records and operational metrics. Score readiness across the 5 CQC key questions. Safe covers: medication management, incidents, risk assessments, DBS checks, emergency procedures. Effective covers: care plan quality and reviews, staff training, outcomes measurement. Caring covers: person-centred care evidence, dignity, family involvement, nutrition and food planning. Responsive covers: complaint handling within 28 days, care plan personalisation, family communication. Well-led covers: governance, compliance monitoring, staff wellbeing, audit trails. Score each key question 0 to 100. Return JSON with exactly these fields: overall_score (number 0-100), scores_by_category (object with keys: safe, effective, caring, responsive, well_led each a number 0-100), rag_status (object with same keys each one of exactly: green, amber, red — green is 80 or above, amber is 60 to 79, red is below 60), gaps (array of objects each with: category string, issue string, priority one of high/medium/low), quick_wins (array of strings describing easy improvements), and summary (one paragraph under 100 words for the registered manager). Return only valid JSON with no markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { organisation_id } = await req.json();
    if (!organisation_id) {
      return NextResponse.json({ error: "organisation_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: evidence },
      { data: overduePlans },
      { data: expiredDbs },
      { data: unresolvedIncidents },
      { data: overdueComplaints },
      { data: recentViews },
      { data: recentVisits },
      { data: recentMeds },
    ] = await Promise.all([
      supabase.from("compliance_evidence").select("category, title, status, evidence_date, expiry_date").eq("organisation_id", organisation_id),
      supabase.from("care_plans").select("id").eq("organisation_id", organisation_id).eq("status", "active").lt("review_date", now.toISOString().split("T")[0]),
      supabase.from("users").select("id").eq("organisation_id", organisation_id).lt("dbs_expiry", now.toISOString().split("T")[0]).in("role", ["carer", "coordinator", "manager"]),
      supabase.from("incidents").select("id").eq("organisation_id", organisation_id).in("investigation_status", ["open", "under_investigation"]).in("severity", ["serious", "critical"]),
      supabase.from("complaints").select("id").eq("organisation_id", organisation_id).lt("created_at", twentyEightDaysAgo).in("status", ["received", "acknowledged", "investigating"]),
      supabase.from("care_plan_views").select("id").gte("viewed_at", thirtyDaysAgo),
      supabase.from("visits").select("status").eq("organisation_id", organisation_id).gte("scheduled_start", thirtyDaysAgo),
      supabase.from("medication_records").select("status").gte("created_at", thirtyDaysAgo),
    ]);

    const completedVisits = recentVisits?.filter(v => v.status === "completed").length ?? 0;
    const totalVisits = recentVisits?.length ?? 1;
    const givenMeds = recentMeds?.filter(m => m.status === "given").length ?? 0;
    const totalMeds = recentMeds?.length ?? 1;

    const metrics = {
      compliance_evidence_count: evidence?.length ?? 0,
      evidence_by_category: evidence?.reduce((acc: Record<string, number>, e) => {
        acc[e.category ?? "other"] = (acc[e.category ?? "other"] ?? 0) + 1;
        return acc;
      }, {}),
      overdue_care_plan_reviews: overduePlans?.length ?? 0,
      expired_dbs_checks: expiredDbs?.length ?? 0,
      unresolved_serious_incidents: unresolvedIncidents?.length ?? 0,
      overdue_complaints: overdueComplaints?.length ?? 0,
      care_plan_reads_last_30_days: recentViews?.length ?? 0,
      visit_completion_rate_pct: Math.round((completedVisits / totalVisits) * 100),
      medication_adherence_rate_pct: Math.round((givenMeds / totalMeds) * 100),
    };

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `COMPLIANCE EVIDENCE:\n${JSON.stringify(evidence ?? [], null, 2)}\n\nOPERATIONAL METRICS:\n${JSON.stringify(metrics, null, 2)}`,
      }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    let assessment: Record<string, unknown>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      assessment = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ ...assessment, metrics });
  } catch (error) {
    console.error("compliance-score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
