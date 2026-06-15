import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { Resend } from "resend";
import { demoRequestConfirmEmail, demoRequestInternalEmail } from "@/lib/emails";

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
      const confirmTpl = demoRequestConfirmEmail(data.first_name ?? "there");
      const internalTpl = demoRequestInternalEmail({
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        orgName: data.organisation_name ?? "",
        email: data.email,
        phone: data.phone,
        staffCount: data.staff_count ?? data.client_count,
        careType: data.care_type,
        role: data.role,
      });
      await Promise.all([
        resend.emails.send({ from, to: data.email, ...confirmTpl }),
        resend.emails.send({ from, to: "booking@careroot.care", ...internalTpl }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("demo-request error:", error);
    return NextResponse.json({ error: "Failed to submit demo request" }, { status: 500 });
  }
}
