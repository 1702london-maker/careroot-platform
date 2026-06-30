import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { applicationApprovedEmail } from "@/lib/emails";

// Generate a readable but strong temporary password.
function generateTempPassword(): string {
  const words = ["Care", "Root", "Visit", "Plan", "Safe", "Team", "Note", "Shift"];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const sym = "!@#$%&"[Math.floor(Math.random() * 6)];
  return `${w1}-${w2}${num}${sym}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Authenticate caller and confirm they are a superadmin.
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: caller } = await authClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Load the application (service client — bypasses RLS reliably).
  const admin = createServiceClientSync();
  const { data: app, error: appError } = await admin
    .from("signup_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (app.status === "approved") {
    return NextResponse.json({ error: "This application has already been approved." }, { status: 409 });
  }

  // 3. Create the auth user with a temporary password, pre-confirmed (no email-confirm step).
  const tempPassword = generateTempPassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: app.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: app.first_name,
      last_name: app.last_name,
      role: "org_admin",
    },
  });

  if (createError || !created.user) {
    console.error("[approve] createUser error:", createError);
    const msg = createError?.message?.includes("already")
      ? "A user with this email already exists in auth."
      : (createError?.message ?? "Failed to create the account.");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 4. Create the organisation + user profile (SECURITY DEFINER RPC — bypasses RLS).
  const { data: orgId, error: rpcError } = await admin.rpc("create_organisation_and_user", {
    p_user_id: created.user.id,
    p_org_name: app.org_name,
    p_org_type: app.org_type,
    p_first_name: app.first_name,
    p_last_name: app.last_name,
    p_email: app.email,
  });

  if (rpcError) {
    // Roll back the auth user so the application can be retried cleanly.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    console.error("[approve] RPC error:", rpcError.message);
    return NextResponse.json({ error: "Failed to set up organisation: " + rpcError.message }, { status: 400 });
  }

  // 5. Force password change + terms acceptance on first login.
  await admin.from("users").update({ must_change_password: true }).eq("id", created.user.id);

  // 6. Mark the application approved.
  await admin.from("signup_applications").update({
    status: "approved",
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    created_org_id: orgId,
  }).eq("id", id);

  // 7. Email the applicant their temporary password.
  try {
    const tpl = applicationApprovedEmail(app.first_name, app.org_name, app.email, tempPassword);
    await getResend().emails.send({ from: FROM_EMAIL, to: app.email, ...tpl });
  } catch (e) {
    console.error("[approve] email error:", e);
    // Account is created; surface the temp password so the admin can pass it on manually.
    return NextResponse.json({
      success: true,
      emailFailed: true,
      tempPassword,
      message: "Account created but the email failed to send. Share this temporary password securely.",
    });
  }

  return NextResponse.json({ success: true });
}
