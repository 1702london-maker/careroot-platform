import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, organisation, clients, notes, source } = body;

  if (!email) return Response.json({ error: "Email required" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "Email service not configured" }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    await supabase.from("gp_connect_requests").insert({
      status: "coming_soon",
      notes: JSON.stringify({ name, email, organisation, clients, notes, source }),
    });

    await resend.emails.send({
      from: "Careroot <onboarding@careroot.co.uk>",
      to: ["onboarding@careroot.co.uk"],
      subject: `GP Connect Interest: ${name ?? email} — ${organisation ?? "No org"}`,
      html: `<p><strong>Name:</strong> ${name ?? "—"}</p><p><strong>Email:</strong> ${email}</p><p><strong>Organisation:</strong> ${organisation ?? "—"}</p><p><strong>Clients:</strong> ${clients ?? "—"}</p><p><strong>Notes:</strong> ${notes ?? "—"}</p><p><strong>Source:</strong> ${source ?? "marketing"}</p>`,
    });

    if (email) {
      await resend.emails.send({
        from: "Careroot <onboarding@careroot.co.uk>",
        to: [email],
        subject: "You're on the GP Connect waitlist — Careroot",
        html: `<p>Hi ${name ?? "there"},</p><p>Thank you for registering your interest in GP Connect. We'll notify you as soon as it's available for your organisation.</p><p>Estimated launch: <strong>Q4 2026</strong>.</p><p>The Careroot team</p>`,
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("GP Connect API error:", err);
    return Response.json({ error: "Failed to save interest" }, { status: 500 });
  }
}
