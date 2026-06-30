import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";

const SYSTEM = `You are a care quality analyst for a UK regulated care service. You will be given shift logs, incidents, medication records, mood records, and nutrition records for a care client over a recent period. Your job is to identify risk patterns that a manager needs to know about.

Identify up to 5 distinct risk flags. For each flag output a JSON object with:
- flag_type: one of "medication_refusal_pattern", "mood_deterioration", "nutrition_concern", "behaviour_escalation", "safeguarding_indicator", "unexplained_absence", "physical_health_decline", "carer_concern"
- severity: "low", "medium", "high", "critical"
- description: 1-2 sentences explaining what the pattern is and why it matters
- evidence: 1 sentence citing specific data that supports this flag
- recommended_action: 1 sentence on what the manager should do

Return ONLY a JSON array of flag objects. No markdown, no explanation outside the JSON.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: client }, { data: logs }, { data: incidents }, { data: medRecords }, { data: moodRecords }, { data: nutritionRecords }, { data: safeguarding }] = await Promise.all([
    supabase.from("clients").select("first_name, last_name, risk_level").eq("id", client_id).single(),
    supabase.from("shift_logs").select("log_type, content, triggers_detected, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since).order("server_timestamp"),
    supabase.from("incidents").select("incident_type, behaviour_description, physical_intervention_occurred, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since),
    supabase.from("medication_records").select("outcome, refusal_reason, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since),
    supabase.from("mood_records").select("mood_term, mood_category, triggers_activated, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since),
    supabase.from("nutrition_records").select("meal_type, offered, consumed, concerns, fluid_intake_ml, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since),
    supabase.from("safeguarding_concerns").select("status, server_timestamp").eq("client_id", client_id).gte("server_timestamp", since),
  ]);

  const context = `CLIENT: ${client?.first_name} ${client?.last_name} (risk level: ${client?.risk_level || "unknown"})
PERIOD: last 7 days

SHIFT LOGS (${logs?.length || 0}):
${JSON.stringify(logs?.slice(-20) || [])}

INCIDENTS (${incidents?.length || 0}):
${JSON.stringify(incidents || [])}

MEDICATION RECORDS (${medRecords?.length || 0}):
${JSON.stringify(medRecords || [])}

MOOD RECORDS (${moodRecords?.length || 0}):
${JSON.stringify(moodRecords || [])}

NUTRITION RECORDS (${nutritionRecords?.length || 0}):
${JSON.stringify(nutritionRecords || [])}

OPEN SAFEGUARDING CONCERNS: ${safeguarding?.length || 0}`;

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: context }],
    });

    const text = message.content.find(c => c.type === "text")?.text || "[]";
    const flags: Array<Record<string, string>> = JSON.parse(text.trim());

    // Save flags to ai_risk_flags table
    const inserts = flags.map(flag => ({
      client_id,
      organisation_id: caller.organisation_id,
      flag_type: flag.flag_type,
      severity: flag.severity,
      description: flag.description,
      evidence: flag.evidence,
      recommended_action: flag.recommended_action,
      status: "open",
      generated_by: "ai",
    }));

    const { data: saved } = await supabase.from("ai_risk_flags").insert(inserts).select();

    return NextResponse.json({ flags: saved, count: saved?.length || 0 });
  } catch (err) {
    console.error("Risk flag generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
