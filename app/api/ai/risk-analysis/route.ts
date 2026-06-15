import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { client_id, organisation_id } = await req.json();

    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: notes },
      { data: medRecords },
      { data: meals },
      { data: incidents },
      { data: client },
    ] = await Promise.all([
      supabase.from("visit_notes").select("content, ai_structured, sentiment, created_at")
        .eq("client_id", client_id).gte("created_at", thirtyDaysAgo),
      supabase.from("medication_records").select("status, medication_id, created_at")
        .eq("client_id", client_id).gte("created_at", thirtyDaysAgo),
      supabase.from("meal_records").select("consumption_level, meal_name, fluid_intake_ml, recorded_at")
        .eq("client_id", client_id).gte("recorded_at", thirtyDaysAgo),
      supabase.from("incidents").select("severity, category, description, reported_at")
        .eq("client_id", client_id).gte("reported_at", thirtyDaysAgo),
      supabase.from("clients").select("first_name, last_name")
        .eq("id", client_id).single(),
    ]);

    const prompt = `You are a clinical risk assessment AI for a UK domiciliary care agency under CQC regulation.

VISIT NOTES (last 30 days): ${JSON.stringify(notes)}
MEDICATION RECORDS: ${JSON.stringify(medRecords)}
MEAL CONSUMPTION: ${JSON.stringify(meals)}
INCIDENTS: ${JSON.stringify(incidents)}

Identify patterns indicating health deterioration, safeguarding concerns, nutritional decline, medication non-compliance, or care quality issues.

Return JSON with exactly: risk_level (low|medium|high|critical), flags (array of {type, severity, description, evidence}), recommended_actions (array of strings), summary (plain English under 150 words).

Base every flag on specific evidence from the data. Do not flag without evidence. Return only valid JSON.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const analysis = JSON.parse(textContent.text);

    // Store flags
    if (analysis.flags?.length > 0) {
      for (const flag of analysis.flags) {
        await supabase.from("ai_risk_flags").insert({
          organisation_id,
          client_id,
          flag_type: flag.type,
          severity: flag.severity,
          description: flag.description,
          evidence: { evidence: flag.evidence },
          status: "open",
        });
      }
    }

    // Alert if high/critical
    if (analysis.risk_level === "high" || analysis.risk_level === "critical") {
      const { data: org } = await supabase.from("organisations")
        .select("on_call_phone, name").eq("id", organisation_id).single();

      const clientName = `${client?.first_name} ${client?.last_name}`;
      const msg = `RISK ALERT: AI has flagged ${clientName} as ${analysis.risk_level} risk. Log in to Careroot to review. — ${org?.name || "Careroot"}`;

      if (org?.on_call_phone) {
        await sendSMS(org.on_call_phone, msg);
      }

      // Email all managers
      const { data: managers } = await supabase.from("users")
        .select("email").eq("organisation_id", organisation_id)
        .in("role", ["org_admin", "manager"]).eq("is_active", true);

      for (const manager of managers || []) {
        if (manager.email) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: manager.email,
            subject: `⚠️ Risk flag raised for ${clientName}`,
            html: `<p>An AI risk flag has been raised for <strong>${clientName}</strong>.</p><p>Risk level: <strong>${analysis.risk_level}</strong></p><p>${analysis.summary}</p><p>Please log in to Careroot to review and take action.</p>`,
          });
        }
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("risk-analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
