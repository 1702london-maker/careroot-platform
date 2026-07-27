import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { staffInviteEmail } from "@/lib/emails";
import { writeAuditLog } from "@/lib/platform-audit";

export async function POST(req: NextRequest) {
  try {
    const { email, first_name, last_name, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: inviter } = await supabase
      .from("users")
      .select("first_name, last_name, role, organisation_id, organisations(name, plan, max_staff)")
      .eq("id", user.id)
      .single();

    if (!inviter?.organisation_id) return NextResponse.json({ error: "Inviter organisation not found" }, { status: 404 });

    if (!["org_admin", "manager", "superadmin"].includes(inviter.role ?? "")) {
      return NextResponse.json({ error: "Forbidden: only managers and admins can invite staff" }, { status: 403 });
    }

    const INVITABLE_ROLES = ["carer", "senior_carer", "coordinator", "nurse", "manager", "support_worker", "driver", "admin"];
    if (!INVITABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

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
      // User already exists in Supabase auth — send a password reset instead
      const isExistingUser =
        linkError?.message?.toLowerCase().includes("already been registered") ||
        linkError?.message?.toLowerCase().includes("already registered") ||
        linkError?.status === 422;

      if (isExistingUser) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/invite/complete`,
        });
        if (resetErr) {
          return NextResponse.json({ error: "Could not resend invite. Contact support." }, { status: 500 });
        }
        // Ensure users row is up to date
        await service.from("users").upsert({
          email,
          first_name: first_name ?? "",
          last_name: last_name ?? "",
          organisation_id: orgId,
          role,
          is_active: true,
          must_change_password: true,
        }, { onConflict: "email" });
        await writeAuditLog(service, {
          organisationId: orgId,
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: inviter.role,
          action: "staff_invite.resent",
          entityType: "users",
          entityId: email,
          metadata: { invited_email: email, role },
          req,
        });
        return NextResponse.json({ success: true, resent: true });
      }

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
    // Extract token from action_link and build our own URL so we bypass
    // Supabase's redirect allowlist restriction entirely.
    let inviteLink = `${appUrl}/invite/complete`;
    const rawActionLink = linkData.properties?.action_link;
    if (rawActionLink) {
      try {
        const u = new URL(rawActionLink);
        const token = u.searchParams.get("token");
        if (token) inviteLink = `${appUrl}/invite/complete?token=${encodeURIComponent(token)}&type=invite`;
      } catch {
        // fall back to appUrl/invite/complete — page will show error
      }
    }

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

    await writeAuditLog(service, {
      organisationId: orgId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: inviter.role,
      action: "staff_invite.created",
      entityType: "users",
      entityId: linkData.user.id,
      metadata: { invited_email: email, role },
      req,
    });

    return NextResponse.json({ success: true, user_id: linkData.user.id });
  } catch (err) {
    console.error("staff invite error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
