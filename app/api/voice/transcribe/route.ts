import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription not configured" }, { status: 503 });
  }

  // Forward to OpenAI Whisper
  const whisperForm = new FormData();
  whisperForm.append("file", audio, "voice-note.webm");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "en");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    const err = await whisperRes.text();
    console.error("Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  const result = await whisperRes.json();
  return NextResponse.json({ text: result.text ?? "" });
}
