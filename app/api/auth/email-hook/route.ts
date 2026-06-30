import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@careroot.co.uk";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { user, email_data } = payload;
  const email = user?.email;
  const firstName = user?.user_metadata?.first_name || "there";

  if (!email || !email_data?.token) {
    return NextResponse.json({ error: "Missing email or token" }, { status: 400 });
  }

  const { token_hash, redirect_to } = email_data;
  const confirmUrl = `https://ayorrmtdpfvubgdxthro.supabase.co/auth/v1/verify?token=${token_hash}&type=${email_data.token_type || "signup"}&redirect_to=${redirect_to || "https://careroot.co.uk/auth/callback"}`;

  let subject = "";
  let html = "";

  if (email_data.token_type === "signup" || email_data.token_type === "email_confirmation") {
    subject = "Confirm your Careroot account";
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#1A3C2E;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:600;margin:0">🌿 Careroot</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;margin:0 0 12px">Welcome, ${firstName}!</h2>
          <p style="color:#4B5563;font-size:15px;line-height:1.6">Thanks for signing up. Click below to confirm your email and access your account.</p>
          <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;background:#1A3C2E;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Confirm my account</a>
          <p style="color:#9CA3AF;font-size:13px">This link expires in 24 hours. If you didn't create a Careroot account, ignore this email.</p>
        </div>
      </div>`;
  } else if (email_data.token_type === "recovery") {
    subject = "Reset your Careroot password";
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#1A3C2E;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:600;margin:0">🌿 Careroot</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;margin:0 0 12px">Password reset request</h2>
          <p style="color:#4B5563;font-size:15px;line-height:1.6">Hi ${firstName}, click below to reset your password.</p>
          <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;background:#1A3C2E;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Reset password</a>
          <p style="color:#9CA3AF;font-size:13px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
        </div>
      </div>`;
  } else if (email_data.token_type === "invite") {
    subject = "You've been invited to Careroot";
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#1A3C2E;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:600;margin:0">🌿 Careroot</p>
        </div>
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
