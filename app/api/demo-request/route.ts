import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const supabase = createServiceClientSync();

    await supabase.from("demo_requests").insert({
      name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
      email: data.email,
      phone: data.phone,
      organisation_name: data.organisation_name,
      role: data.role,
      client_count: data.staff_count ?? data.client_count,
      message: data.message ?? data.care_type,
    });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

      await Promise.all([
        resend.emails.send({
          from,
          to: data.email,
          subject: "We've received your Careroot demo request — we'll be in touch within 24 hours",
          html: `<div style="font-family:sans-serif;max-width:600px">
            <div style="background:#1A3C2E;padding:24px;border-radius:8px 8px 0 0">
              <h2 style="color:white;margin:0">Careroot</h2>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px">Demo request received</p>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p>Hi ${data.first_name ?? "there"},</p>
              <p>Thank you for requesting a Careroot demo. We'll be in touch within 24 hours to confirm a time that works for you.</p>
              <p>What to expect: a 30-minute live walkthrough of the platform, tailored to your care service — AI care planning, CQC compliance tools, the carer mobile app, and the emergency response system.</p>
              <p>In the meantime you can <a href="${appUrl}/signup" style="color:#1A3C2E">start your free 30-day trial</a> with no credit card required.</p>
              <p>The Careroot team</p>
            </div>
          </div>`,
        }),
        resend.emails.send({
          from,
          to: "booking@careroot.care",
          subject: `New demo request — ${data.organisation_name} — ${data.staff_count ?? data.client_count ?? "unknown"} staff`,
          html: `<p><strong>New demo request</strong></p>
            <p>Name: ${data.first_name} ${data.last_name}</p>
            <p>Organisation: ${data.organisation_name}</p>
            <p>Email: ${data.email}</p>
            <p>Phone: ${data.phone ?? "not provided"}</p>
            <p>Staff count: ${data.staff_count ?? "not provided"}</p>
            <p>Care type: ${data.care_type ?? "not provided"}</p>
            <p>Role: ${data.role ?? "not provided"}</p>`,
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("demo-request error:", error);
    return NextResponse.json({ error: "Failed to submit demo request" }, { status: 500 });
  }
}
