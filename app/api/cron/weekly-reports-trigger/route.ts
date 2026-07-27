import { createServiceClientSync } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { pickWeeklyReportTemplate } from "@/lib/weekly-report-templates";
import { NextResponse } from "next/server";

// Runs every Monday — generates weekly reports for all active clients
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClientSync();

  // Last week window
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStart = monday.toISOString();
  const weekEnd = sunday.toISOString();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name, organisation_id, service_line_id, commissioner, placing_authority, service_line:service_lines(name, regulatory_body)")
    .eq("status", "active");
  if (!clients?.length) return NextResponse.json({ generated: 0 });

  let generated = 0;
  const errors: string[] = [];

  for (const client of clients) {
    try {
      // Skip if report already exists for this week
      const { data: existing } = await supabase.from("weekly_reports")
        .select("id")
        .eq("client_id", client.id)
        .eq("week_start", weekStart)
        .eq("week_end", weekEnd)
        .limit(1)
        .maybeSingle();
      if (existing) continue;

      const [{ data: logs }, { data: incidents }, { data: medRecords }, { data: moodRecords }, { data: nutritionRecords }, { data: shifts }] = await Promise.all([
        supabase.from("shift_logs").select("log_type, content, triggers_detected, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart).lte("server_timestamp", weekEnd),
        supabase.from("incidents").select("incident_type, physical_intervention_occurred, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("medication_records").select("status, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("mood_records").select("mood_term, mood_category, triggers_activated, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("nutrition_records").select("meal_type, offered, consumed, concerns, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("shifts").select("status, scheduled_start").contains("client_ids", [client.id]).gte("scheduled_start", weekStart).lte("scheduled_start", weekEnd),
      ]);

      const totalLogs = (logs?.length || 0) + (incidents?.length || 0);
      if (totalLogs === 0) continue; // No activity — skip

      const serviceLine = Array.isArray(client.service_line) ? client.service_line[0] : client.service_line;
      const template = pickWeeklyReportTemplate(serviceLine?.regulatory_body);

      const context = `CLIENT: ${client.first_name} ${client.last_name}
SERVICE LINE: ${serviceLine?.name || "Unknown"} (${serviceLine?.regulatory_body || ""})
COMMISSIONER: ${client.commissioner || "Unknown"}
WEEK: ${weekStart} to ${weekEnd}
SHIFTS: ${JSON.stringify(shifts || [])}
SHIFT LOGS: ${JSON.stringify(logs?.slice(-15) || [])}
INCIDENTS: ${JSON.stringify(incidents || [])}
MEDICATION RECORDS: ${JSON.stringify(medRecords || [])}
MOOD RECORDS: ${JSON.stringify(moodRecords || [])}
NUTRITION RECORDS: ${JSON.stringify(nutritionRecords || [])}`;

      const anthropic = getAnthropic();
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: template.system,
        messages: [{ role: "user", content: context }],
      });

      const text = message.content.find(c => c.type === "text")?.text || "{}";
      const content = JSON.parse(text.trim());

      await supabase.from("weekly_reports").insert({
        client_id: client.id,
        service_line_id: client.service_line_id || null,
        week_start: weekStart,
        week_end: weekEnd,
        generated_from_log_count: totalLogs,
        report_format: template.format,
        content,
        status: "draft",
        generated_at: new Date().toISOString(),
      });

      generated++;
      // Small delay to avoid API rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      errors.push(`${client.id}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ generated, errors, week: `${weekStart} → ${weekEnd}` });
}
