import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { writeAuditLog } from "@/lib/platform-audit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { client_id, email, first_name, last_name, access_level } = await req.json();
  if (!client_id || !email) {
    return NextResponse.json({ error: "client_id and email required" }, { status: 400 });
  }

  const { data: inviter } = await supabase
    .from("users")
    .select("first_name, last_name, role, organisation_id, organisations(name)")
    .eq("id", user.id)
    .single();
  if (!inviter?.organisation_id || !["superadmin", "org_admin", "manager", "coordinator"].includes(inviter.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, first_name, last_name, organisation_id")
    .eq("id", client_id)
    .eq("organisation_id", inviter.organisation_id)
    .single();
  if (!client) return NextResponse.json({ error: "Client not found in your organisation" }, { status: 404 });

  const service = createServiceClientSync();
  const appUrl = "https://www.careroot.co.uk";
  const clientFirstName = first_name || client.first_name || "";
  const clientLastName = last_name || client.last_name || "";

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { first_name: clientFirstName, last_name: clientLastName, role: "client", organisation_id: inviter.organisation_id },
      redirectTo: `${appUrl}/invite/complete`,
    },
  });

  if (linkError || !linkData) {
    return NextResponse.json({ error: linkError?.message ?? "Could not generate client invite" }, { status: 500 });
  }

  const userId = linkData.user.id;
  await service.from("users").upsert({
    id: userId,
    email,
    first_name: clientFirstName,
    last_name: clientLastName,
    organisation_id: inviter.organisation_id,
    role: "client",
    is_active: true,
    must_change_password: false,
  });

  await service.from("client_access").upsert({
    client_id,
    organisation_id: inviter.organisation_id,
    user_id: userId,
    access_level: access_level ?? "full",
    invited_by: user.id,
    is_active: true,
  }, { onConflict: "client_id,user_id" });

  let inviteLink = `${appUrl}/invite/complete`;
  const rawActionLink = linkData.properties?.action_link;
  if (rawActionLink) {
    try {
      const url = new URL(rawActionLink);
      const token = url.searchParams.get("token");
      if (token) inviteLink = `${appUrl}/invite/complete?token=${encodeURIComponent(token)}&type=invite`;
    } catch {}
  }

  const orgName = (inviter.organisations as unknown as { name?: string } | null)?.name ?? "your care provider";
  const clientName = `${client.first_name} ${client.last_name}`.trim();
  const { error: emailError } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your ${orgName} client portal access`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#1A3C2E">Client portal access</h1>
      <p>Hello ${clientFirstName || clientName},</p>
      <p>${orgName} has invited you to access your Careroot client portal for ${clientName}.</p>
      <p><a href="${inviteLink}" style="display:inline-block;background:#1A3C2E;color:white;padding:12px 20px;border-radius:6px;text-decoration:none">Set password and open portal</a></p>
      <p style="color:#6B7280;font-size:13px">This link is personal to you. Do not forward it.</p>
    </div>`,
  });
  if (emailError) {
    return NextResponse.json({ error: "Access created but email failed to send." }, { status: 500 });
  }

  await writeAuditLog(service, {
    organisationId: inviter.organisation_id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: inviter.role,
    action: "client_access.invited",
    entityType: "client_access",
    entityId: userId,
    metadata: { client_id, client_email: email, access_level: access_level ?? "full" },
    req,
  });

  return NextResponse.json({ ok: true, user_id: userId });
}
