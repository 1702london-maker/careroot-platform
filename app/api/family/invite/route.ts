import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, phone, relationship, client_id, access_level } = await req.json();
    if (!email || !first_name || !client_id) {
      return NextResponse.json({ error: "First name, email and client are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: inviter } = await supabase.from("users")
      .select("first_name, last_name, role, organisation_id, organisations(name)")
      .eq("id", user.id).single();

    if (!inviter?.organisation_id) {
      return NextResponse.json({ error: "Inviter organisation not found" }, { status: 403 });
    }

    if (!["org_admin", "manager", "coordinator", "superadmin"].includes(inviter.role ?? "")) {
      return NextResponse.json({ error: "Forbidden: only authorised office users can invite family members" }, { status: 403 });
    }

    const orgId = inviter.organisation_id;
    const orgName = (inviter?.organisations as unknown as { name: string } | null)?.name ?? "your organisation";
    const appUrl = "https://www.careroot.co.uk";

    // Verify the client belongs to the inviter's organisation — prevent cross-org family access grants
    const { data: clientCheck } = await supabase
      .from("clients").select("id").eq("id", client_id).eq("organisation_id", orgId).single();
    if (!clientCheck) {
      return NextResponse.json({ error: "Client not found in your organisation" }, { status: 404 });
    }

    const service = createServiceClientSync();

    // Generate invite link
    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { first_name, last_name, role: "family", organisation_id: orgId },
        redirectTo: `${appUrl}/invite/complete`,
      },
    });

    if (linkError || !linkData) {
      return NextResponse.json({ error: linkError?.message ?? "Could not generate invite link" }, { status: 500 });
    }

    const userId = linkData.user.id;

    // Create public.users row
    await service.from("users").upsert({
      id: userId, email,
      first_name: first_name ?? "", last_name: last_name ?? "",
      organisation_id: orgId, role: "family",
      phone: phone ?? null,
      is_active: true, must_change_password: false,
    });

    // Create family_access record
    await service.from("family_access").insert({
      client_id, organisation_id: orgId,
      user_id: userId, relationship: relationship ?? "Family",
      access_level: access_level ?? "full",
      invited_by: user.id,
    });

    // Build invite link
    let inviteLink = `${appUrl}/invite/complete`;
    const rawActionLink = linkData.properties?.action_link;
    if (rawActionLink) {
      try {
        const u = new URL(rawActionLink);
        const token = u.searchParams.get("token");
        if (token) inviteLink = `${appUrl}/invite/complete?token=${encodeURIComponent(token)}&type=invite`;
      } catch { /* use fallback */ }
    }

    // Fetch client name for email
    const { data: clientRecord } = await supabase.from("clients")
      .select("first_name, last_name").eq("id", client_id).single();
    const clientName = clientRecord ? `${clientRecord.first_name} ${clientRecord.last_name}` : "your family member";

    const { error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You've been invited to view ${clientName}'s care on Careroot`,
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
          <div style="background:#1A3C2E;padding:28px 32px">
            <span style="color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:600">Careroot</span>
            <span style="color:rgba(255,255,255,0.55);font-size:13px;margin-left:8px">Family portal</span>
          </div>
          <div style="padding:28px 32px">
            <h1 style="font-family:Georgia,serif;color:#1A3C2E;font-size:22px;margin:0 0 16px">You've been invited</h1>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 14px">Hi ${first_name},</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 14px">
              <strong>${inviter?.first_name} ${inviter?.last_name}</strong> from <strong>${orgName}</strong> has given you access to view the care records for <strong>${clientName}</strong>.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px">
              You will be able to view visit logs, update care preferences, raise concerns, and stay informed about ${clientName}'s care.
            </p>
            <a href="${inviteLink}" style="display:inline-block;background:#1A3C2E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;margin:0 0 20px">
              Set your password and access the portal
            </a>
            <p style="color:#6b7280;font-size:13px">This invitation expires in 7 days.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      return NextResponse.json({ error: "Invite created but email failed. Contact support." }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: userId });
  } catch (err) {
    console.error("family invite error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
