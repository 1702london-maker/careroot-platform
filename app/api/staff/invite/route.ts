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
      .select("first_name, last_name, organisation_id, organisations(name)")
      .eq("id", user.id)
      .single();

    if (!inviter) return NextResponse.json({ error: "Inviter not found" }, { status: 404 });

    const orgName = (inviter.organisations as Record<string, string> | null)?.name ?? "your organisation";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

    // Generate Supabase invite link
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
        role,
        organisation_id: inviter.organisation_id,
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
