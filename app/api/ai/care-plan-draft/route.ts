import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a senior UK care plan author with over 20 years' experience writing person-centred care plans that fully comply with the CQC 2026 Single Assessment Framework, the Health and Social Care Act 2008, and Ofsted standards for supported accommodation. Your plans are used directly by frontline carers to deliver safe, dignified, and effective care. Every section must be detailed enough that a carer reading it for the first time could deliver excellent care without needing to ask anyone.

Draft a comprehensive care plan based on the assessment information provided. The plan must include these exact sections as JSON keys:

- personal_background: Who this person is — their life history, what brought them joy, their personality, preferences, routines, cultural and religious background, things that are important to them. Written in a warm, dignified way that helps carers see the person behind the care needs.
- communication_needs: How this person communicates, their preferred language, any speech or hearing difficulties, tools or aids they use (e.g. Makaton, picture boards), and how carers should adapt their communication style.
- personal_care: Detailed support needed for washing, dressing, grooming, oral hygiene, continence, skin care, and personal hygiene. Include the level of assistance (prompting, guiding, full support), preferred routines, times, and any products used.
- mobility: Full detail on movement, transfers, walking aids, positioning, falls risk, how many carers required, manual handling instructions, and any equipment in use (hoist, wheelchair, walking frame etc).
- nutrition_and_hydration: Full food and fluid plan — specific preferred meals with preparation notes where given, texture requirements (IDDSI level if applicable), fluid targets, assistance needed at mealtimes, cultural and religious food considerations, foods they enjoy, foods to avoid, allergies, intolerances, and any weight monitoring requirements.
- medication_administration: For EACH medication listed — name, dosage, exact time(s) to administer, route, specific rules (e.g. must be taken with food, do not crush, separate from other medications by 2 hours), signs of missed dose or adverse reaction, prescribing doctor, dispensing pharmacy and contact number, and when/how to reorder. Also include general MAR chart completion instructions and what to do if a dose is refused or vomited.
- health_monitoring: Ongoing health monitoring requirements — observations, vital signs if applicable, skin integrity checks, pressure area care, bowel and bladder monitoring, any specialist appointments or reviews due.
- social_and_emotional_wellbeing: Social needs, hobbies, activities the person enjoys, emotional wellbeing support, mental health considerations, family contact, companionship, and how carers should support positive engagement and prevent isolation.
- mental_capacity_and_consent: Summary of the person's capacity under the Mental Capacity Act 2005, any Lasting Power of Attorney in place (name, type, contact), any best-interest decisions that have been made, Deprivation of Liberty Safeguards (DoLS) status if applicable.
- safety_and_risk_management: Each identified risk listed separately with the level of risk (low/medium/high), the specific concern, and the agreed management strategy. Include environmental risks, personal safety, safeguarding considerations, self-neglect, and any known history.
- goals_and_outcomes: What this person wants to achieve in the next 3–6 months. Written with the person at the centre — "Margaret would like to..." — with measurable outcomes and how progress will be evidenced.
- review_schedule: When the plan will be formally reviewed (minimum 3-monthly for dom care, monthly for supported living), who will conduct the review, how the person and family will be involved, and the date of next review.

Return ONLY a valid JSON object with these exact keys. Use plain, dignified, professional language. Do not use infantilising language. Do not use unnecessary medical jargon — explain terms where used. Do not mention any software, platform, or system by name. Do not include any introductory text, markdown, or code fences — return the raw JSON object only.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
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

ACTIVE MEDICATIONS (full detail for MAR chart and care plan):
${(medications ?? []).map((m: Record<string, unknown>, idx: number) => `
Medication ${idx + 1}:
  Name: ${m.name ?? ""}
  Dosage: ${m.dosage ?? ""}
  Frequency: ${m.frequency ?? ""}
  Time(s) to administer: ${m.time_to_take ?? ""}
  Route: ${m.route ?? ""}
  Specific rules: ${m.specific_rules ?? "None"}
  Prescriber: ${m.prescriber ?? ""} ${m.prescriber_contact ? `| Contact: ${m.prescriber_contact}` : ""}
  Reorder when: ${m.refill_threshold ?? ""}
  Dispensing pharmacy: ${m.pharmacy_name ?? ""} ${m.pharmacy_phone ? `| Phone: ${m.pharmacy_phone}` : ""}
`).join("\n")}

CARE PLAN RECIPIENT (send completed plan to):
${JSON.stringify(client.care_plan_recipient ?? "Not specified")}

POWER OF ATTORNEY:
${JSON.stringify(client.power_of_attorney ?? "None recorded")}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response received" }, { status: 500 });
    }

    let analysis: Record<string, unknown>;
    let draft: Record<string, string>;
    try {
      const raw = textContent.text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(raw);
      draft = analysis as unknown as Record<string, string>;
    } catch {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    // Save care plan record
    const { data: carePlan, error: cpError } = await supabase.from("care_plans").insert({
      client_id,
      organisation_id,
      title: `${clientName} — Care Plan ${today}`,
      status: "draft",
      content: draft,
      version: 1,
    }).select().single();

    if (cpError) {
      console.error("care_plans insert error:", cpError);
      return NextResponse.json({ error: "Failed to save care plan" }, { status: 500 });
    }

    // Send care plan to designated recipient if email configured
    const recipient = client.care_plan_recipient as { name?: string; email?: string; relationship?: string } | null;
    if (recipient?.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const sectionsList = Object.entries(draft)
          .map(([key, val]) => `<h3 style="color:#1A3C2E;margin-top:24px;margin-bottom:6px;font-size:15px;text-transform:capitalize">${key.replace(/_/g, " ")}</h3><p style="margin:0;font-size:14px;line-height:1.7;color:#374151;white-space:pre-line">${val}</p>`)
          .join("");

        await resend.emails.send({
          from: "Careroot <noreply@careroot.co.uk>",
          to: recipient.email,
          subject: `Care Plan — ${clientName} (Awaiting Manager Approval)`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#f9fafb;padding:24px">
              <div style="background:#1A3C2E;padding:24px 28px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:20px">Careroot</h1>
                <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">Care Plan — ${clientName}</p>
              </div>
              <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
                <p style="color:#374151;font-size:14px">Dear ${recipient.name ?? ""},</p>
                <p style="color:#374151;font-size:14px">Please find below the draft care plan for <strong>${clientName}</strong>. This plan is currently awaiting approval from the care manager — you will receive a further notification once it has been approved and activated.</p>
                <p style="color:#374151;font-size:14px">If you have any concerns or additional information to add, please contact the care team directly.</p>
                <div style="border-top:2px solid #E8F0EC;margin-top:24px;padding-top:16px">
                  ${sectionsList}
                </div>
                <p style="font-size:12px;color:#9CA3AF;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:32px">This document is confidential and intended solely for ${recipient.name ?? "the named recipient"}. If you have received this in error, please contact us immediately. Careroot © ${new Date().getFullYear()}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("care plan email send error:", emailErr);
        // Non-fatal — care plan is saved, email failure should not block response
      }
    }

    return NextResponse.json({ care_plan: carePlan, sections: draft });
  } catch (error) {
    console.error("care-plan-draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
