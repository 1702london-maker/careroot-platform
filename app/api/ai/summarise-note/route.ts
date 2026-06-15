import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { note_text, client_id, visit_id } = await req.json();

    if (!note_text) {
      return NextResponse.json({ error: "note_text required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Structure this care visit note into a JSON object with exactly these fields: observations (string), mood (string), physical_condition (string), concerns (string — empty string if none), actions_taken (string), sentiment (one of exactly: positive, neutral, concerning, urgent). Return only valid JSON, no markdown.\n\nNote: ${note_text}`,
        },
      ],
      system:
        "You are a clinical documentation assistant for a UK care agency. Structure visit notes into structured data. Return only valid JSON with the exact fields requested. Never add information not present in the note.",
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let structured;
    try {
      structured = JSON.parse(textContent.text);
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    // Save to visit_notes if visit_id provided
    if (visit_id) {
      const supabase = await createClient();
      await supabase
        .from("visit_notes")
        .update({ ai_structured: structured, sentiment: structured.sentiment })
        .eq("visit_id", visit_id)
        .eq("client_id", client_id);
    }

    return NextResponse.json({ structured, sentiment: structured.sentiment });
  } catch (error) {
    console.error("summarise-note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
