import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { applicationReceivedEmail } from "@/lib/emails";

const schema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  cqcProviderId: z.string().optional(),
  message: z.string().optional(),
});

const INTERNAL_NOTIFY = process.env.INTERNAL_NOTIFY_EMAIL ?? "onboarding@careroot.co.uk";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all required fields correctly." }, { status: 400 });
  }

  const { orgName, orgType, firstName, lastName, email, phone, cqcProviderId, message } = parsed.data;

  // Service client — anon RLS allows insert, but we use service to also dedupe cleanly.
  const supabase = createServiceClientSync();

  // Reject duplicate pending applications for the same email.
  const { data: existing } = await supabase
    .from("signup_applications")
    .select("id, status")
    .eq("email", email)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    const msg = existing.status === "approved"
      ? "An account already exists for this email. Try signing in instead."
      : "We've already received an application for this email and it's under review.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("signup_applications").insert({
    org_name: orgName,
    org_type: orgType,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    cqc_provider_id: cqcProviderId || null,
    message: message || null,
    status: "pending",
  });

  if (insertError) {
    console.error("[applications] insert error:", insertError.message);
    return NextResponse.json({ error: "Could not submit your application. Please try again." }, { status: 500 });
  }

  // Acknowledge the applicant + notify the team (best-effort, don't block the response).
  try {
    const tpl = applicationReceivedEmail(firstName, orgName);
    await getResend().emails.send({ from: FROM_EMAIL, to: email, ...tpl });
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: INTERNAL_NOTIFY,
      subject: `New Careroot application — ${orgName}`,
      html: `<p><strong>${firstName} ${lastName}</strong> (${email}${phone ? ", " + phone : ""}) applied for <strong>${orgName}</strong> (${orgType}).</p>
             <p>CQC provider ID: ${cqcProviderId || "—"}</p>
             <p>Message: ${message || "—"}</p>
             <p>Review and approve in the superadmin panel: https://careroot.co.uk/superadmin/applications</p>`,
    });
  } catch (e) {
    console.error("[applications] email error:", e);
  }

  return NextResponse.json({ success: true });
}
