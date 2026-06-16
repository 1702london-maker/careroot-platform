import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { staffInviteEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const { email, first_name, last_name, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: "email and role required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: inviter } = await supabase.from("users")
      .select("first_name, last_name, organisation_id, organisations(name, max_staff)")
      .eq("id", user.id)
      .single();

    if (!inviter) return NextResponse.json({ error: "Inviter not found" }, { status: 404 });

    const org = inviter.organisations as Record<string, string | number> | null;
    const orgId = inviter.organisation_id;
    const PLAN_LIMITS: Record<string, number> = { seed: 10, grow: 50, scale: 200, enterprise: Infinity };
    const plan = (org?.plan as string) ?? "seed";
    const maxStaff = (org?.max_staff as number) ?? PLAN_LIMITS[plan] ?? 10;

    // Enforce staff limit — count active users for this org
    const { count: currentStaff } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .not("role", "eq", "family");

    if ((currentStaff ?? 0) >= maxStaff) {
      return NextResponse.json({
        error: `Staff limit reached. Your ${org?.name} plan allows ${maxStaff} staff members. Upgrade your plan to invite more.`,
        limit_reached: true,
        current: currentStaff,
        max: maxStaff,
      }, { status: 403 });
    }

    const orgName = (org?.name as string) ?? "your organisation";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
        role,
        organisation_id: orgId,
      },
      redirectTo: `${appUrl}/signup/complete`,
    });

    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

    const tpl = staffInviteEmail({
      inviteeName: first_name ?? email,
      inviterName: `${inviter.first_name} ${inviter.last_name}`,
      orgName,
      role,
      inviteLink: `${appUrl}/signup/complete`,
    });

    await getResend().emails.send({ from: FROM_EMAIL, to: email, ...tpl });

    return NextResponse.json({ success: true, user_id: inviteData.user?.id });
  } catch (error) {
    console.error("staff invite error:", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
