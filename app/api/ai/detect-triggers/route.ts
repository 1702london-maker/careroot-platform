import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";

const SYSTEM = `You are a behaviour support specialist for a UK care service. You will be given a shift log entry and the client's known trigger vocabulary. Identify if any known triggers or concerning patterns are present in the log.

Return a JSON object with:
- triggers_detected: array of strings (trigger terms from the vocabulary that are present or implied in the log)
- confidence: "low", "medium", "high"
- notes: 1 sentence explanation, or null if no triggers detected

Return ONLY valid JSON.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { log_id, shift_log_content, client_id } = await req.json();
  if (!log_id || !shift_log_content || !client_id) {
    return NextResponse.json({ error: "log_id, shift_log_content, client_id required" }, { status: 400 });
  }

  const { data: carePlan } = await supabase.from("care_plans")
    .select("trigger_vocabulary, mood_vocabulary")
    .eq("client_id", client_id)
    .eq("is_current", true)
    .maybeSingle();

  const triggerVocab: string[] = (carePlan?.trigger_vocabulary as string[]) || [];

  if (triggerVocab.length === 0) {
    return NextResponse.json({ triggers_detected: [], confidence: "low", notes: "No trigger vocabulary defined for this client" });
  }

  const context = `SHIFT LOG: ${shift_log_content}
KNOWN TRIGGERS: ${triggerVocab.join(", ")}`;

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM,
      messages: [{ role: "user", content: context }],
    });

    const text = message.content.find(c => c.type === "text")?.text || "{}";
    const result = JSON.parse(text.trim());

    // Update the shift log with detected triggers
    if (result.triggers_detected?.length > 0) {
      await supabase.from("shift_logs").update({
        triggers_detected: result,
      }).eq("id", log_id);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Trigger detection error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
