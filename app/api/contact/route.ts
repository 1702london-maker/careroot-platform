import { NextRequest } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, organisation, email, phone, subject, message } = body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: "Email service not configured" }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Careroot <noreply@careroot.care>",
      to: "onboarding@careroot.co.uk",
      subject: `New contact: ${subject} — ${firstName} ${lastName}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Organisation:</strong> ${organisation || "Not provided"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    await resend.emails.send({
      from: "Careroot <noreply@careroot.care>",
      to: email,
      subject: "We received your message — Careroot",
      html: `
        <h2>Hi ${firstName},</h2>
        <p>Thanks for getting in touch. We will reply within 2 business hours.</p>
        <p>If your enquiry is urgent you can:</p>
        <ul>
          <li>Email us directly: onboarding@careroot.co.uk</li>
          <li>WhatsApp or call: +44 7493 099125</li>
          <li>Book a demo: careroot.care/demo</li>
        </ul>
        <p>The Careroot team</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
