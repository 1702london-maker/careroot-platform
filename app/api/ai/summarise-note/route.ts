import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a UK care agency. Structure the following care visit note into a JSON object with exactly these fields: observations (string — what was seen or heard during the visit), mood (string — client's emotional state and demeanour), physical_condition (string — any physical observations including appearance, mobility, comfort), concerns (string — anything that requires follow-up or monitoring, empty string if none), actions_taken (string — what the carer did during the visit), and sentiment (one of exactly: positive, neutral, concerning, urgent). Be precise and clinical. Never add information not present in the note. Return only valid JSON with no markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { note_text, client_id, visit_id, author_id, organisation_id } = body;

    if (!note_text || !client_id || !visit_id || !author_id || !organisation_id) {
      return NextResponse.json({ error: "Missing required fields: note_text, client_id, visit_id, author_id, organisation_id" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Structure this note:\n\n${note_text}` }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    let structured: Record<string, string>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      structured = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    const supabase = await createClient();

    // Update the visit_notes record with structured data
    await supabase
      .from("visit_notes")
      .update({
        ai_structured: structured,
        sentiment: structured.sentiment,
      })
      .eq("visit_id", visit_id)
      .eq("client_id", client_id);

    // Create AI risk flag if sentiment warrants it
    if (structured.sentiment === "concerning" || structured.sentiment === "urgent") {
      const severity = structured.sentiment === "urgent" ? "high" : "medium";
      await supabase.from("ai_risk_flags").insert({
        client_id,
        organisation_id,
        flag_type: "visit_note_concern",
        severity,
        title: `${structured.sentiment === "urgent" ? "Urgent" : "Concern"} flagged in visit note`,
        description: structured.concerns || structured.observations,
        evidence: [{ source: "visit_note", text: note_text.slice(0, 500) }],
        recommended_action: structured.concerns ? `Follow up on: ${structured.concerns}` : "Review visit note",
        status: "open",
      });
    }

    return NextResponse.json({ structured, sentiment: structured.sentiment });
  } catch (error) {
    console.error("summarise-note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
