import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are an experienced UK care planner writing person-centred care plans that comply with the CQC 2026 Single Assessment Framework. Draft a comprehensive care plan based on the assessment information provided. The plan must include these exact sections as JSON keys: personal_background (what matters to this person, their history, personality, preferences), communication_needs (how they communicate, language needs, preferred formats), personal_care (washing dressing grooming continence oral hygiene support needed), mobility (movement support walking aids transfers positioning), nutrition_and_hydration (use all food plan data provided — include specific meal preferences with steps where provided, texture requirements, fluid targets, eating assistance, cultural food significance, foods they love and foods to avoid), medication_support (medication administration support monitoring), social_and_emotional (social needs emotional wellbeing companionship mental health), safety_and_risk (identified risks and how to mitigate each one), goals_and_outcomes (what the person wants to achieve measurable outcomes), and review_schedule (when and how the plan will be reviewed and by whom). Return as a JSON object with these exact keys. Use plain dignified language. Never use infantilising language. Never use unnecessary clinical jargon. Return only valid JSON with no markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { client_id, organisation_id, onboarding_data } = await req.json();
    if (!client_id || !organisation_id) {
      return NextResponse.json({ error: "client_id and organisation_id required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Pull all supplementary data in parallel
    const [
      { data: client },
      { data: nutritionProfile },
      { data: mealPreferences },
      { data: medications },
    ] = await Promise.all([
      supabase.from("clients").select("*").eq("id", client_id).eq("organisation_id", organisation_id).single(),
      supabase.from("nutrition_profiles").select("*").eq("client_id", client_id).single(),
      supabase.from("meal_preferences").select("*").eq("client_id", client_id),
      supabase.from("medications").select("*").eq("client_id", client_id).eq("is_active", true),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientName = `${client.first_name} ${client.last_name}`;
    const today = new Date().toISOString().split("T")[0];

    const context = `CLIENT: ${clientName}
DOB: ${client.date_of_birth ?? "Not recorded"}
NHS Number: ${client.nhs_number ?? "Not recorded"}
Primary Diagnosis: ${client.primary_diagnosis ?? "Not recorded"}
Cultural Background: ${client.cultural_background ?? "Not recorded"}
Language: ${client.language_preferences ?? "English"}
Religious Preferences: ${client.religious_preferences ?? "Not recorded"}
Communication Needs: ${client.communication_needs ?? "Not recorded"}
Mobility: ${client.mobility_level ?? "Not recorded"}
Cognitive Status: ${client.cognitive_status ?? "Not recorded"}

ONBOARDING ASSESSMENT DATA:
${JSON.stringify(onboarding_data ?? {}, null, 2)}

NUTRITION PROFILE:
${JSON.stringify(nutritionProfile ?? {}, null, 2)}

MEAL PREFERENCES:
${JSON.stringify(mealPreferences ?? [], null, 2)}

ACTIVE MEDICATIONS:
${JSON.stringify(medications ?? [], null, 2)}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    let draft: Record<string, string>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      draft = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Save care plan record
    const { data: carePlan, error: cpError } = await supabase.from("care_plans").insert({
      client_id,
      organisation_id,
      title: `${clientName} — Care Plan ${today}`,
      status: "draft",
      care_needs: draft,
      ai_generated: true,
      ai_prompt_used: "care-plan-draft-v1",
    }).select().single();

    if (cpError) {
      console.error("care_plans insert error:", cpError);
      return NextResponse.json({ error: "Failed to save care plan" }, { status: 500 });
    }

    return NextResponse.json({ care_plan: carePlan, draft });
  } catch (error) {
    console.error("care-plan-draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
