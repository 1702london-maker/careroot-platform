import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { client_id, period_start, period_end, organisation_id } = await req.json();
    const supabase = await createClient();

    const [
      { data: notes },
      { data: meals },
      { data: incidents },
      { data: medRefusals },
      { data: visits },
      { data: client },
    ] = await Promise.all([
      supabase.from("visit_notes").select("content, ai_structured, sentiment, created_at")
        .eq("client_id", client_id).eq("is_family_visible", true).eq("is_internal", false)
        .gte("created_at", period_start).lte("created_at", period_end),
      supabase.from("meal_records").select("meal_name, consumption_level, recorded_at")
        .eq("client_id", client_id)
        .gte("recorded_at", period_start).lte("recorded_at", period_end),
      supabase.from("incidents").select("severity, category, description, is_family_visible")
        .eq("client_id", client_id).eq("is_family_visible", true)
        .in("severity", ["high", "critical"])
        .gte("reported_at", period_start),
      supabase.from("medication_records").select("status, created_at")
        .eq("client_id", client_id).eq("status", "refused")
        .gte("created_at", period_start),
      supabase.from("visits").select("status").eq("client_id", client_id)
        .gte("scheduled_start", period_start).lte("scheduled_start", period_end),
      supabase.from("clients").select("first_name, last_name").eq("id", client_id).single(),
    ]);

    const completedVisits = visits?.filter(v => v.status === "completed").length ?? 0;
    const totalVisits = visits?.length ?? 0;

    const prompt = `You are writing a weekly care update for the family of a care client. Audience: concerned family member, not a healthcare professional. Write in warm, clear, plain English.

CLIENT: ${client?.first_name} ${client?.last_name}
PERIOD: ${period_start} to ${period_end}

VISIT DATA: ${completedVisits} of ${totalVisits} visits completed
VISIT NOTES: ${JSON.stringify(notes)}
MEALS: ${JSON.stringify(meals)}
INCIDENTS: ${JSON.stringify(incidents)}
MEDICATION REFUSALS: ${medRefusals?.length ?? 0} this week

Cover: overall how they've been, visits completed, positive moments, meals enjoyed and appetite, anything family genuinely needs to know. Under 250 words. No clinical jargon. No headers or bullet points. Plain text only. If serious concerns exist, include them clearly but compassionately.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const briefingText = textContent.text;

    // Save to database
    const { data: briefing } = await supabase.from("family_briefings").insert({
      client_id,
      organisation_id,
      content: briefingText,
      ai_generated: true,
      period_start,
      period_end,
    }).select().single();

    // Send to family members with standard/full access
    const { data: familyMembers } = await supabase
      .from("family_access")
      .select("users(email, first_name)")
      .eq("client_id", client_id)
      .eq("is_active", true)
      .in("access_level", ["standard", "full"]);

    const sentTo = [];
    for (const member of familyMembers || []) {
      const familyUser = member.users as unknown as Record<string, string> | null;
      if (familyUser?.email) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: familyUser.email,
          subject: `Weekly update for ${client?.first_name} ${client?.last_name}`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1A3C2E; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; font-size: 20px; margin: 0;">Weekly Care Update</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0;">For ${client?.first_name} ${client?.last_name}</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <p style="color: #1C1C1E; line-height: 1.6;">${briefingText.replace(/\n/g, "<br>")}</p>
            </div>
          </div>`,
        });
        sentTo.push(familyUser.email);
      }
    }

    // Update sent_at
    if (briefing?.id) {
      await supabase.from("family_briefings").update({
        sent_at: new Date().toISOString(),
        sent_to: sentTo,
      }).eq("id", briefing.id);
    }

    return NextResponse.json({ briefing: briefingText, sent_to: sentTo });
  } catch (error) {
    console.error("family-brief error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
