import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";

// Fixed statutory templates by regulatory body. Each enforces a consistent
// section structure (not free-form prose) so reports are inspection-ready.
const TEMPLATES: Record<string, { format: string; system: string }> = {
  LOCAL_AUTHORITY: {
    format: "local_authority",
    system: `You are a support worker report writer for a UK local-authority-commissioned Support Outreach service for young people (14-17), aligned to Working Together to Safeguard Children 2023.
Generate the statutory weekly report in this EXACT fixed JSON structure (every key required, use "None this week" where empty):
{
  "report_type": "Local Authority Weekly Support Report",
  "executive_summary": "2-3 sentences",
  "support_delivered": "paragraph: hours and nature of support provided this week",
  "safeguarding": "paragraph: any safeguarding concerns raised, escalations, or 'No safeguarding concerns this week'",
  "behaviour_and_incidents": "paragraph using Antecedent-Behaviour-Consequence framing for any incidents",
  "risk_and_triggers": "paragraph on risk indicators and any trigger vocabulary activated (county lines / contextual safeguarding aware)",
  "engagement_and_activities": "paragraph on the young person's engagement, education, and activities",
  "outcomes_and_progress": "paragraph on progress against placement goals",
  "key_concerns": ["up to 3"],
  "positive_highlights": ["up to 3"],
  "actions_for_placing_authority": ["specific actions the LA/social worker must take"]
}
Return ONLY valid JSON. No markdown.`,
  },
  OFSTED: {
    format: "ofsted_sccif",
    system: `You are a report writer for a UK Ofsted-regulated children's service, aligned to the Social Care Common Inspection Framework (SCCIF).
Generate the weekly report in this EXACT fixed JSON structure (every key required):
{
  "report_type": "Ofsted SCCIF Weekly Report",
  "executive_summary": "2-3 sentences",
  "quality_of_support": "paragraph mapped to SCCIF Quality of Support",
  "behaviour_and_attitudes": "paragraph mapped to Behaviour and Attitudes, ABC framing for incidents",
  "personal_development": "paragraph on the child/young person's development, education, activities",
  "positive_behaviour_support": "paragraph on PBS strategies and de-escalation used",
  "safeguarding": "paragraph on safeguarding, or 'No safeguarding concerns this week'",
  "key_concerns": ["up to 3"],
  "positive_highlights": ["up to 3"],
  "actions_required": ["specific actions for the registered manager"]
}
Return ONLY valid JSON. No markdown.`,
  },
  CQC: {
    format: "cqc_saf",
    system: `You are a care record analyst for a UK CQC-regulated domiciliary care service.
Generate the weekly client report in this EXACT fixed JSON structure (every key required):
{
  "report_type": "CQC Weekly Care Report",
  "executive_summary": "2-3 sentences",
  "shifts_summary": { "total_scheduled": 0, "total_completed": 0, "total_missed": 0 },
  "wellbeing_overview": "paragraph",
  "nutrition_summary": "paragraph on nutrition and hydration",
  "medication_summary": "paragraph on administration, refusals, concerns",
  "mood_summary": "paragraph on mood patterns and triggers",
  "incidents_summary": "paragraph or 'No incidents this week'",
  "key_concerns": ["up to 3"],
  "positive_highlights": ["up to 3"],
  "actions_required": ["specific actions for the manager"]
}
Return ONLY valid JSON. No markdown.`,
  },
};

function pickTemplate(regulatoryBody?: string | null) {
  return TEMPLATES[regulatoryBody ?? "CQC"] ?? TEMPLATES.CQC;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { client_id, week_start, week_end } = await req.json();
  if (!client_id || !week_start || !week_end) {
    return NextResponse.json({ error: "client_id, week_start, week_end required" }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("first_name, last_name, risk_level, service_line_id, commissioner, placing_authority").eq("id", client_id).single();

  const [
    { data: shifts },
    { data: logs },
    { data: incidents },
    { data: medRecords },
    { data: moodRecords },
    { data: nutritionRecords },
    { data: serviceLine },
  ] = await Promise.all([
    supabase.from("shifts").select("status, scheduled_start, actual_start, actual_end").contains("client_ids", [client_id]).gte("scheduled_start", week_start).lte("scheduled_start", week_end),
    supabase.from("shift_logs").select("log_type, content, triggers_detected, server_timestamp").eq("client_id", client_id).gte("server_timestamp", week_start).lte("server_timestamp", week_end),
    supabase.from("incidents").select("incident_type, behaviour_description, physical_intervention_occurred, antecedent, consequence_description, server_timestamp").eq("client_id", client_id).gte("server_timestamp", week_start).lte("server_timestamp", week_end),
    supabase.from("medication_records").select("status, refusal_reason, medication_schedule_id, server_timestamp").eq("client_id", client_id).gte("server_timestamp", week_start).lte("server_timestamp", week_end),
    supabase.from("mood_records").select("mood_term, mood_category, triggers_activated, context_notes, server_timestamp").eq("client_id", client_id).gte("server_timestamp", week_start).lte("server_timestamp", week_end),
    supabase.from("nutrition_records").select("meal_type, offered, consumed, concerns, fluid_intake_ml, server_timestamp").eq("client_id", client_id).gte("server_timestamp", week_start).lte("server_timestamp", week_end),
    supabase.from("service_lines").select("name, regulatory_body").eq("id", client?.service_line_id ?? "").maybeSingle(),
  ]);

  const context = `CLIENT: ${client?.first_name} ${client?.last_name}
SERVICE LINE: ${serviceLine?.name || "Unknown"} (${serviceLine?.regulatory_body || ""})
COMMISSIONER: ${client?.commissioner || "Unknown"}
WEEK: ${week_start} to ${week_end}

SHIFTS: ${JSON.stringify(shifts || [])}
SHIFT LOGS: ${JSON.stringify(logs || [])}
INCIDENTS: ${JSON.stringify(incidents || [])}
MEDICATION RECORDS: ${JSON.stringify(medRecords || [])}
MOOD RECORDS: ${JSON.stringify(moodRecords || [])}
NUTRITION RECORDS: ${JSON.stringify(nutritionRecords || [])}`;

  const template = pickTemplate(serviceLine?.regulatory_body);

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: template.system,
      messages: [{ role: "user", content: context }],
    });

    const text = message.content.find(c => c.type === "text")?.text || "{}";
    const reportContent = JSON.parse(text.trim());

    const { data: report, error } = await supabase.from("weekly_reports").insert({
      client_id,
      service_line_id: client?.service_line_id || null,
      week_start,
      week_end,
      generated_from_log_count: (logs?.length || 0) + (incidents?.length || 0),
      report_format: template.format,
      content: reportContent,
      status: "draft",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ report });
  } catch (err) {
    console.error("Weekly report error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
