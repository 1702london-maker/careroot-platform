import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, mood_term, mood_category, context_notes, triggers_activated } = await req.json();
  if (!shift_id || !client_id || !mood_term) {
    return NextResponse.json({ error: "shift_id, client_id, mood_term required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("mood_records").insert({
    shift_id, client_id, staff_id: user.id,
    mood_term, mood_category: mood_category || null,
    context_notes: context_notes || null,
    triggers_activated: triggers_activated ?? false,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Baseline calculation (BUILD_SPEC B15): once 4 weeks of mood data exist and
  // no baseline is set on the current care plan, compute and store it.
  try {
    const { data: plan } = await supabase
      .from("care_plans")
      .select("id, mood_baseline")
      .eq("client_id", client_id)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (plan && !plan.mood_baseline) {
      const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();
      const { data: history } = await supabase
        .from("mood_records")
        .select("mood_term, mood_category, server_timestamp")
        .eq("client_id", client_id)
        .gte("server_timestamp", fourWeeksAgo);

      const records = history ?? [];
      const earliest = records.reduce<string | null>((min, r) =>
        !min || r.server_timestamp < min ? r.server_timestamp : min, null);

      // Need ≥4 weeks of span and a meaningful sample.
      const spanDays = earliest ? (Date.now() - new Date(earliest).getTime()) / 86400000 : 0;
      if (spanDays >= 28 && records.length >= 14) {
        const termCounts: Record<string, number> = {};
        const catCounts: Record<string, number> = {};
        for (const r of records) {
          termCounts[r.mood_term] = (termCounts[r.mood_term] ?? 0) + 1;
          if (r.mood_category) catCounts[r.mood_category] = (catCounts[r.mood_category] ?? 0) + 1;
        }
        const dominant = Object.entries(termCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
        await supabase.from("care_plans").update({
          mood_baseline: {
            calculated_at: new Date().toISOString(),
            sample_size: records.length,
            dominant_terms: dominant,
            category_distribution: catCounts,
          },
        }).eq("id", plan.id);
      }
    }
  } catch (e) {
    console.error("[mood-records] baseline calc failed:", e);
  }

  return NextResponse.json({ record: data });
}
