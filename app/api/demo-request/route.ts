import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const supabase = await createServiceClient();

    await supabase.from("demo_requests").insert(data);

    // Confirmation to requester
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "We've received your Careroot demo request",
      html: `<div style="font-family: sans-serif; max-width: 600px;">
        <div style="background: #1A3C2E; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; font-size: 22px; margin: 0;">Your demo is booked</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.first_name},</p>
          <p>Thank you for booking a Careroot demo. We'll be in touch within one business day to confirm a time that works for you.</p>
          <p>What to expect:</p>
          <ul>
            <li>30-minute live walkthrough tailored to your care service</li>
            <li>See AI care planning, CQC compliance, and emergency response in action</li>
            <li>Q&A with a care technology specialist</li>
          </ul>
          <p>In the meantime, you can <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup" style="color: #1A3C2E;">start your free 30-day trial</a> now.</p>
          <p>The Careroot team</p>
        </div>
      </div>`,
    });

    // Notification to Careroot team
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "booking@careroot.care",
      subject: `New Careroot demo request from ${data.organisation_name}`,
      html: `<p><strong>New demo request</strong></p>
        <p>Name: ${data.first_name} ${data.last_name}</p>
        <p>Organisation: ${data.organisation_name}</p>
        <p>Email: ${data.email}</p>
        <p>Phone: ${data.phone}</p>
        <p>Staff count: ${data.staff_count}</p>
        <p>Care type: ${data.care_type}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("demo-request error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
