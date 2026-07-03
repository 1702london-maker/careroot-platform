import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { staffInviteEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const { email, first_name, last_name, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: inviter } = await supabase
      .from("users")
      .select("first_name, last_name, organisation_id, organisations(name, plan, max_staff)")
      .eq("id", user.id)
      .single();

    if (!inviter?.organisation_id) return NextResponse.json({ error: "Inviter organisation not found" }, { status: 404 });

    const org = inviter.organisations as unknown as Record<string, string | number> | null;
    const orgId = inviter.organisation_id;
    const PLAN_LIMITS: Record<string, number> = { seed: 10, grow: 50, scale: 200, enterprise: Infinity };
    const plan = (org?.plan as string) ?? "seed";
    const maxStaff = (org?.max_staff as number) ?? PLAN_LIMITS[plan] ?? 10;

    const { count: currentStaff } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .not("role", "eq", "family");

    if ((currentStaff ?? 0) >= maxStaff) {
      return NextResponse.json({
        error: `Staff limit reached (${currentStaff}/${maxStaff}). Upgrade your plan to invite more.`,
      }, { status: 403 });
    }

    const service = createServiceClientSync();
    const appUrl = "https://www.careroot.co.uk";

    // Generate a magic invite link — no password needed on their end
    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { first_name, last_name, role, organisation_id: orgId },
        redirectTo: `${appUrl}/invite/complete`,
      },
    });

    if (linkError || !linkData) {
      console.error("Supabase invite link error:", linkError);
      return NextResponse.json({
        error: `Could not generate invite link: ${linkError?.message ?? "unknown error"}`,
      }, { status: 500 });
    }

    // Create public.users row so the carer can log in immediately
    await service.from("users").upsert({
      id: linkData.user.id,
      email,
      first_name: first_name ?? "",
      last_name: last_name ?? "",
      organisation_id: orgId,
      role,
      is_active: true,
      must_change_password: false,
    });

    const orgName = (org?.name as string) ?? "your organisation";
    const inviteLink = linkData.properties?.action_link ?? `${appUrl}/login`;

    const tpl = staffInviteEmail({
      inviteeName: first_name ?? email,
      inviterName: `${inviter.first_name} ${inviter.last_name}`,
      orgName,
      role,
      inviteLink,
    });

    const { error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      ...tpl,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ error: "Invite created but email failed to send. Contact support." }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: linkData.user.id });
  } catch (err) {
    console.error("staff invite error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
