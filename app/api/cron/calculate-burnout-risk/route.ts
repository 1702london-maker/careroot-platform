import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all active carers
  const { data: carers } = await supabase
    .from("users")
    .select("id, organisation_id, first_name, last_name, email")
    .eq("role", "carer")
    .eq("is_active", true);

  if (!carers?.length) return NextResponse.json({ processed: 0 });

  let processed = 0;

  for (const carer of carers) {
    const weekStart = sevenDaysAgo;
    const weekEnd = now.toISOString();

    // Visits in the past 7 days
    const { data: visits } = await supabase
      .from("visits")
      .select("id, scheduled_start, scheduled_end, actual_start, actual_end, status")
      .eq("carer_id", carer.id)
      .eq("organisation_id", carer.organisation_id)
      .gte("scheduled_start", weekStart)
      .lte("scheduled_start", weekEnd);

    // Incidents reported by this carer in 7 days
    const { count: incidentCount } = await supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("reported_by", carer.id)
      .eq("organisation_id", carer.organisation_id)
      .gte("created_at", weekStart);

    // Visit notes in 7 days
    const { count: noteCount } = await supabase
      .from("visit_notes")
      .select("*", { count: "exact", head: true })
      .eq("carer_id", carer.id)
      .eq("organisation_id", carer.organisation_id)
      .gte("created_at", weekStart);

    const totalVisits = visits?.length ?? 0;
    const completedVisits = visits?.filter((v) => v.status === "completed").length ?? 0;
    const missedVisits = visits?.filter((v) => v.status === "missed").length ?? 0;

    // Calculate total hours worked
    let totalMinutesWorked = 0;
    for (const v of visits ?? []) {
      if (v.actual_start && v.actual_end) {
        const ms = new Date(v.actual_end).getTime() - new Date(v.actual_start).getTime();
        totalMinutesWorked += ms / 60000;
      }
    }
    const hoursWorked = totalMinutesWorked / 60;

    // Burnout scoring (0–100, higher = more risk)
    let score = 0;

    // Hours worked this week (>40h = elevated)
    if (hoursWorked > 50) score += 35;
    else if (hoursWorked > 40) score += 20;
    else if (hoursWorked > 35) score += 10;

    // High visit load (>15 visits/week)
    if (totalVisits > 20) score += 25;
    else if (totalVisits > 15) score += 15;
    else if (totalVisits > 10) score += 5;

    // Missed visits (suggests overwhelm or unreliability)
    score += Math.min(missedVisits * 10, 20);

    // Low completion rate
    if (totalVisits > 0) {
      const completionRate = completedVisits / totalVisits;
      if (completionRate < 0.7) score += 15;
      else if (completionRate < 0.85) score += 5;
    }

    // High incident reporting (stress indicator)
    if ((incidentCount ?? 0) > 3) score += 10;

    // Low note-taking (disengagement signal)
    if (totalVisits > 0 && (noteCount ?? 0) / totalVisits < 0.3) score += 5;

    const clampedScore = Math.min(score, 100);
    const wellbeingScore = 100 - clampedScore;
    const burnoutRisk: "low" | "medium" | "high" =
      clampedScore >= 60 ? "high" : clampedScore >= 35 ? "medium" : "low";

    // Upsert into staff_records
    const { data: existing } = await supabase
      .from("staff_records")
      .select("id")
      .eq("user_id", carer.id)
      .eq("organisation_id", carer.organisation_id)
      .single();

    if (existing) {
      await supabase
        .from("staff_records")
        .update({ burnout_risk: burnoutRisk, wellbeing_score: wellbeingScore, updated_at: now.toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("staff_records").insert({
        user_id: carer.id,
        organisation_id: carer.organisation_id,
        burnout_risk: burnoutRisk,
        wellbeing_score: wellbeingScore,
      });
    }

    processed++;
  }

  return NextResponse.json({ processed, at: now.toISOString() });
}
