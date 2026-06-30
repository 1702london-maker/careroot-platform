import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a nutrition monitoring specialist for a UK domiciliary care agency. You will receive meal consumption records for a care client over the past 14 days. Each record shows: date, meal name, consumption level (all/most/half/little/refused), and fluid intake in ml where recorded. Identify patterns of reduced appetite, consistent meal refusal, inadequate fluid intake, or sudden changes in eating behaviour that may indicate health deterioration, depression, pain, infection, or other clinical concerns. Return JSON with exactly these fields: concern_level (one of exactly: none, low, medium, high), pattern_description (string describing the specific pattern identified with dates and evidence from the records provided), recommended_actions (array of strings for the care manager), should_flag (boolean — true if concern_level is medium or high), and flag_message (string — message for the risk flag if should_flag is true, empty string otherwise). Return only valid JSON with no markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  try {
    const { client_id, organisation_id } = await req.json();
    if (!client_id || !organisation_id) {
      return NextResponse.json({ error: "client_id and organisation_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: meals } = await supabase
      .from("meal_records")
      .select("meal_name, meal_type, consumption_level, fluid_intake_ml, fluid_ml, recorded_at")
      .eq("client_id", client_id)
      .gte("recorded_at", fourteenDaysAgo)
      .order("recorded_at", { ascending: true });

    if (!meals || meals.length < 3) {
      return NextResponse.json({
        concern_level: "none",
        pattern_description: "Insufficient data for analysis — fewer than 3 meal records in the last 14 days.",
        recommended_actions: ["Ensure carers are recording meals consistently during each visit."],
        should_flag: false,
        flag_message: "",
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `MEAL RECORDS (last 14 days, ${meals.length} records):\n${JSON.stringify(meals, null, 2)}`,
      }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response received" }, { status: 500 });
    }

    let analysis: Record<string, unknown>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    // Create risk flag if warranted
    if (analysis.should_flag) {
      const severity = analysis.concern_level === "high" ? "high" : "medium";
      await supabase.from("ai_risk_flags").insert({
        client_id,
        organisation_id,
        flag_type: "appetite_concern",
        severity,
        description: analysis.flag_message as string,
        evidence: [{ source: "meal_records", summary: analysis.pattern_description }],
        status: "open",
      });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("appetite-analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
