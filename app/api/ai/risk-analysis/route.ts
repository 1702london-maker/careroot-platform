import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { Resend } from "resend";

const SYSTEM_PROMPT = `You are a clinical risk assessment AI for a UK domiciliary care agency under CQC regulation. You will receive visit notes, medication records, meal consumption records, and incident reports for a care client spanning the last 30 days. Identify patterns that may indicate health deterioration, safeguarding concerns, nutritional decline, medication non-compliance, or care quality issues. Return a JSON object with exactly these fields: risk_level (one of exactly: low, medium, high, critical), flags (array of objects each with fields: type string, severity string one of low/medium/high/critical, description string, evidence string citing specific data from what was provided), recommended_actions (array of strings), and summary (plain English paragraph for the care manager under 150 words). Base every flag strictly on evidence from the data provided. Do not flag concerns without evidence from the provided data. Return only valid JSON with no markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { client_id, organisation_id } = await req.json();
    if (!client_id || !organisation_id) {
      return NextResponse.json({ error: "client_id and organisation_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: notes },
      { data: medRecords },
      { data: meals },
      { data: incidents },
      { data: client },
    ] = await Promise.all([
      supabase.from("visit_notes").select("body, ai_structured, sentiment, created_at")
        .eq("client_id", client_id).gte("created_at", thirtyDaysAgo),
      supabase.from("medication_records").select("status, medication_id, created_at")
        .eq("client_id", client_id).gte("created_at", thirtyDaysAgo),
      supabase.from("meal_records").select("consumption_level, meal_name, meal_type, fluid_intake_ml, fluid_ml, recorded_at")
        .eq("client_id", client_id).gte("recorded_at", thirtyDaysAgo),
      supabase.from("incidents").select("severity, incident_type, category, description, reported_at, date_time")
        .eq("client_id", client_id).gte("created_at", thirtyDaysAgo),
      supabase.from("clients").select("first_name, last_name").eq("id", client_id).single(),
    ]);

    const context = `VISIT NOTES (${notes?.length ?? 0} records): ${JSON.stringify(notes ?? [])}

MEDICATION RECORDS (${medRecords?.length ?? 0} records): ${JSON.stringify(medRecords ?? [])}

MEAL CONSUMPTION (${meals?.length ?? 0} records): ${JSON.stringify(meals ?? [])}

INCIDENTS (${incidents?.length ?? 0} records): ${JSON.stringify(incidents ?? [])}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    let analysis: Record<string, unknown>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    const flags = (analysis.flags as Array<Record<string, string>>) ?? [];

    // Store all flags
    for (const flag of flags) {
      await supabase.from("ai_risk_flags").insert({
        organisation_id,
        client_id,
        flag_type: flag.type,
        severity: flag.severity,
        title: flag.description?.slice(0, 100) ?? flag.type,
        description: flag.description,
        evidence: [{ text: flag.evidence }],
        recommended_action: (analysis.recommended_actions as string[])?.join("; "),
        status: "open",
      });
    }

    // Alert on high/critical
    const riskLevel = analysis.risk_level as string;
    if (riskLevel === "high" || riskLevel === "critical") {
      const { data: org } = await supabase.from("organisations")
        .select("on_call_phone, name").eq("id", organisation_id).single();

      const clientName = `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim();

      if (org?.on_call_phone) {
        await sendSMS(
          org.on_call_phone,
          `RISK ALERT: AI has flagged ${clientName} as ${riskLevel} risk. Log in to Careroot to review immediately. — ${org.name}`
        );
      }

      const { data: managers } = await supabase.from("users")
        .select("email").eq("organisation_id", organisation_id)
        .in("role", ["owner", "manager"]).eq("is_active", true);

      if (process.env.RESEND_API_KEY && managers?.length) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        for (const mgr of managers) {
          if (!mgr.email) continue;
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care",
            to: mgr.email,
            subject: `⚠️ Risk flag raised for ${clientName}`,
            html: `<div style="font-family:sans-serif;max-width:600px">
              <div style="background:#1A3C2E;padding:20px;border-radius:8px 8px 0 0">
                <h2 style="color:white;margin:0">Risk Alert — ${riskLevel.toUpperCase()}</h2>
              </div>
              <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                <p><strong>${clientName}</strong> has been flagged as <strong>${riskLevel}</strong> risk.</p>
                <p>${analysis.summary}</p>
                <p><strong>Recommended actions:</strong></p>
                <ul>${(analysis.recommended_actions as string[]).map(a => `<li>${a}</li>`).join("")}</ul>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care"}/ai/risk-flags">View in Careroot →</a></p>
              </div>
            </div>`,
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
