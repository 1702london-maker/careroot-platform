import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { applicationRejectedEmail } from "@/lib/emails";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = typeof body?.reason === "string" ? body.reason : undefined;

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: caller } = await authClient.from("users").select("role").eq("id", user.id).single();
  if (caller?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceClientSync();
  const { data: app } = await admin.from("signup_applications").select("*").eq("id", id).single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (app.status === "approved") {
    return NextResponse.json({ error: "This application was already approved." }, { status: 409 });
  }

  await admin.from("signup_applications").update({
    status: "rejected",
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason || null,
  }).eq("id", id);

  try {
    const tpl = applicationRejectedEmail(app.first_name, app.org_name, reason);
    await getResend().emails.send({ from: FROM_EMAIL, to: app.email, ...tpl });
  } catch (e) {
    console.error("[reject] email error:", e);
  }

  return NextResponse.json({ success: true });
}
