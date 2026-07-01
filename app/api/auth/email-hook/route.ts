import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createHmac } from "crypto";

const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@careroot.co.uk";

type HookPayload = {
  user?: { email?: string; user_metadata?: Record<string, string> };
  email_data?: { token?: string; token_hash?: string; token_type?: string; redirect_to?: string };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Supabase hook signature if secret is set
  const secret = process.env.SUPABASE_HOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-supabase-signature") ?? "";
    const b64 = secret.replace("v1,whsec_", "");
    const key = Buffer.from(b64, "base64");
    const expected = "v1," + createHmac("sha256", key).update(rawBody).digest("base64");
    if (signature !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload: HookPayload = JSON.parse(rawBody);
  const { user, email_data } = payload;
  const email = user?.email;
  const firstName = user?.user_metadata?.first_name || "there";

  if (!email || !email_data?.token_hash) {
    return NextResponse.json({ error: "Missing email or token" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const confirmUrl = `https://ayorrmtdpfvubgdxthro.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.token_type || "signup"}&redirect_to=${email_data.redirect_to || "https://careroot.co.uk/auth/callback"}`;

  let subject = "";
  let html = "";

  if (email_data.token_type === "signup" || email_data.token_type === "email_confirmation") {
    subject = "Confirm your Careroot account";
    html = `<div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A3C2E;padding:24px 32px"><p style="color:#fff;font-size:20px;font-weight:600;margin:0">Careroot</p></div>
      <div style="padding:32px">
        <h2 style="color:#1C1C1E;font-size:22px;margin:0 0 12px">Welcome, ${firstName}!</h2>
        <p style="color:#4B5563;font-size:15px;line-height:1.6">Thanks for signing up. Click below to confirm your email and access your account.</p>
        <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;background:#1A3C2E;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Confirm my account</a>
        <p style="color:#9CA3AF;font-size:13px">This link expires in 24 hours. If you didn't create a Careroot account, ignore this email.</p>
      </div>
    </div>`;
  } else if (email_data.token_type === "recovery") {
    subject = "Reset your Careroot password";
    html = `<div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A3C2E;padding:24px 32px"><p style="color:#fff;font-size:20px;font-weight:600;margin:0">Careroot</p></div>
      <div style="padding:32px">
        <h2 style="color:#1C1C1E;font-size:22px;margin:0 0 12px">Password reset</h2>
        <p style="color:#4B5563;font-size:15px;line-height:1.6">Hi ${firstName}, click below to reset your password.</p>
        <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;background:#1A3C2E;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Reset password</a>
        <p style="color:#9CA3AF;font-size:13px">This link expires in 1 hour.</p>
      </div>
    </div>`;
  } else if (email_data.token_type === "invite") {
    subject = "You've been invited to Careroot";
    html = `<div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A3C2E;padding:24px 32px"><p style="color:#fff;font-size:20px;font-weight:600;margin:0">Careroot</p></div>
      <div style="padding:32px">
        <h2 style="color:#1C1C1E;font-size:22px;margin:0 0 12px">You're invited!</h2>
        <p style="color:#4B5563;font-size:15px;line-height:1.6">You've been invited to join Careroot. Click below to accept and set your password.</p>
        <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;background:#1A3C2E;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Accept invitation</a>
        <p style="color:#9CA3AF;font-size:13px">This link expires in 24 hours.</p>
      </div>
    </div>`;
  } else {
    subject = "Careroot — action required";
    html = `<p>Click <a href="${confirmUrl}">here</a> to continue.</p>`;
  }

  const { error } = await resend.emails.send({ from: FROM, to: email, subject, html });
  if (error) {
    console.error("[email-hook] Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
