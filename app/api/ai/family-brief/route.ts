import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const SYSTEM_PROMPT = `You are writing a weekly care update for the family of a care client. Your audience is a concerned family member who is not a healthcare professional. Write in warm clear plain English that is easy to read. Cover: how their loved one has been overall this week, how many visits took place and whether all happened as planned, any positive moments activities or things worth sharing, what meals they enjoyed and any appetite notes, anything the family genuinely needs to know about their care. Keep it under 250 words. Never use clinical jargon or medical abbreviations. If there are serious concerns the family must know about include them clearly but compassionately — do not omit important information. Do not start with 'Dear Family'. Return plain text only with no headers bullet points or markdown.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { client_id, organisation_id, period_start, period_end } = await req.json();
    if (!client_id || !organisation_id || !period_start || !period_end) {
      return NextResponse.json({ error: "client_id, organisation_id, period_start, period_end required" }, { status: 400 });
    }

    const supabase = await createClient();

    const [
      { data: notes },
      { data: meals },
      { data: incidents },
      { data: medRefusals },
      { data: visits },
      { data: client },
    ] = await Promise.all([
      supabase.from("visit_notes")
        .select("body, sentiment, created_at")
        .eq("client_id", client_id)
        .eq("is_family_visible", true)
        .eq("is_internal", false)
        .gte("created_at", period_start)
        .lte("created_at", period_end),
      supabase.from("meal_records")
        .select("meal_name, meal_type, consumption_level, recorded_at")
        .eq("client_id", client_id)
        .gte("recorded_at", period_start)
        .lte("recorded_at", period_end),
      supabase.from("incidents")
        .select("severity, incident_type, description")
        .eq("client_id", client_id)
        .eq("is_family_visible", true)
        .in("severity", ["serious", "critical"])
        .gte("created_at", period_start),
      supabase.from("medication_records")
        .select("status, created_at")
        .eq("client_id", client_id)
        .eq("status", "refused")
        .gte("created_at", period_start),
      supabase.from("visits")
        .select("status")
        .eq("client_id", client_id)
        .gte("scheduled_start", period_start)
        .lte("scheduled_start", period_end),
      supabase.from("clients").select("first_name, last_name").eq("id", client_id).single(),
    ]);

    const completed = visits?.filter(v => v.status === "completed").length ?? 0;
    const total = visits?.length ?? 0;
    const clientName = `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim();

    const context = `CLIENT: ${clientName}
PERIOD: ${period_start} to ${period_end}
VISITS: ${completed} of ${total} completed
NOTES: ${JSON.stringify(notes ?? [])}
MEALS: ${JSON.stringify(meals ?? [])}
SERIOUS INCIDENTS: ${JSON.stringify(incidents ?? [])}
MEDICATION REFUSALS THIS PERIOD: ${medRefusals?.length ?? 0}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const briefingText = textContent.text.trim();

    // Save to database
    const { data: briefing } = await supabase.from("family_briefings").insert({
      client_id,
      organisation_id,
      briefing_text: briefingText,
      content: briefingText,
      ai_generated: true,
      period_start,
      period_end,
    }).select().single();

    // Send to active family members
    const { data: familyAccess } = await supabase
      .from("family_access")
      .select("invited_email, user_id, access_level")
      .eq("client_id", client_id)
      .eq("is_active", true);

    const sentTo: string[] = [];

    if (process.env.RESEND_API_KEY && familyAccess?.length) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";

      for (const member of familyAccess) {
        const email = member.invited_email;
        if (!email) continue;

        await resend.emails.send({
          from,
          to: email,
          subject: `Weekly care update for ${client?.first_name}`,
          html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1A3C2E;padding:24px 28px;border-radius:8px 8px 0 0">
              <p style="color:white;font-size:20px;font-weight:600;margin:0">Careroot</p>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px">Weekly Care Update — ${clientName}</p>
            </div>
            <div style="background:white;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="color:#1C1C1E;line-height:1.7;font-size:15px">${briefingText.replace(/\n\n/g, "</p><p style='color:#1C1C1E;line-height:1.7;font-size:15px'>").replace(/\n/g, "<br>")}</p>
            </div>
            <p style="text-align:center;color:#9CA3AF;font-size:12px;margin-top:16px">Careroot · careroot.care</p>
          </div>`,
        });
        sentTo.push(email);
      }
    }

    // Update sent_at
    if (briefing?.id) {
      await supabase.from("family_briefings").update({
        sent_at: new Date().toISOString(),
        sent_to: sentTo,
      }).eq("id", briefing.id);
    }

    return NextResponse.json({ briefing: briefingText, id: briefing?.id, sent_to: sentTo });
  } catch (error) {
    console.error("family-brief error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
