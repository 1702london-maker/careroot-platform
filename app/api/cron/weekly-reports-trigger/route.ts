import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";

// Runs every Monday — generates weekly reports for all active clients
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();

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

  const { data: clients } = await supabase.from("clients").select("id, first_name, last_name, organisation_id, service_line_id").eq("is_active", true);
  if (!clients?.length) return NextResponse.json({ generated: 0 });

  let generated = 0;
  const errors: string[] = [];

  for (const client of clients) {
    try {
      // Skip if report already exists for this week
      const { data: existing } = await supabase.from("weekly_reports")
        .select("id").eq("client_id", client.id).gte("week_start", weekStart).maybeSingle();
      if (existing) continue;

      const [{ data: logs }, { data: incidents }, { data: medRecords }, { data: moodRecords }, { data: nutritionRecords }, { data: shifts }] = await Promise.all([
        supabase.from("shift_logs").select("log_type, content, triggers_detected, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart).lte("server_timestamp", weekEnd),
        supabase.from("incidents").select("incident_type, physical_intervention_occurred, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("medication_records").select("outcome, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("mood_records").select("mood_term, mood_category, triggers_activated, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("nutrition_records").select("meal_type, offered, consumed, concerns, server_timestamp").eq("client_id", client.id).gte("server_timestamp", weekStart),
        supabase.from("shifts").select("status, scheduled_start").contains("client_ids", [client.id]).gte("scheduled_start", weekStart).lte("scheduled_start", weekEnd),
      ]);

      const totalLogs = (logs?.length || 0) + (incidents?.length || 0);
      if (totalLogs === 0) continue; // No activity — skip

      const context = `CLIENT: ${client.first_name} ${client.last_name}
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
        max_tokens: 1024,
        system: `You are a care record analyst. Generate a weekly care report as a JSON object with: executive_summary, wellbeing_overview, nutrition_summary, medication_summary, mood_summary, incidents_summary, key_concerns (array), positive_highlights (array), actions_required (array). Return ONLY valid JSON.`,
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
        report_format: "json_structured",
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
