import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const onboardingData = await req.json();

    const prompt = `You are an experienced UK care planner writing person-centred care plans that comply with the CQC 2026 Single Assessment Framework.

ASSESSMENT DATA:
${JSON.stringify(onboardingData, null, 2)}

Draft a comprehensive care plan. Return as JSON with these exact keys:
- personal_background: Personal background and what matters to this person
- communication_needs: Communication and information needs
- personal_care: Personal care and hygiene support
- mobility: Mobility and moving support
- nutrition: Nutrition and hydration (use detailed food plan data — meal preferences, texture requirements, fluid needs, eating assistance)
- medication: Medication support
- social_emotional: Social and emotional wellbeing
- safety_risk: Safety and risk management
- goals: Goals and desired outcomes
- review_schedule: Review schedule and responsibilities

Use plain, dignified language. Respect the person. Never use infantilising language or unnecessary clinical jargon. Return only valid JSON.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const draft = JSON.parse(textContent.text);
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("care-plan-draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
