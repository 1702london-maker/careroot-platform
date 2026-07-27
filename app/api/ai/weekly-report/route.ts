import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { pickWeeklyReportTemplate } from "@/lib/weekly-report-templates";
import { NextResponse } from "next/server";

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

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name, risk_level, service_line_id, commissioner, placing_authority, organisation_id")
    .eq("id", client_id)
    .single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (caller.role !== "superadmin" && client.organisation_id !== caller.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const template = pickWeeklyReportTemplate(serviceLine?.regulatory_body);

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
