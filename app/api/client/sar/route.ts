import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { notify, messages } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/platform-audit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { client_id, reason } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const { data: access } = await supabase
    .from("client_access")
    .select("organisation_id, clients(first_name, last_name)")
    .eq("user_id", user.id)
    .eq("client_id", client_id)
    .eq("is_active", true)
    .single();
  if (!access?.organisation_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = access.clients as unknown as { first_name?: string; last_name?: string } | null;
  const clientName = `${client?.first_name ?? "Client"} ${client?.last_name ?? ""}`.trim();
  const deadlineDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase.from("sar_requests").insert({
    organisation_id: access.organisation_id,
    client_id,
    requester_name: clientName,
    requester_relationship: "self",
    requester_email: user.email,
    reason: reason || null,
    requested_by: user.id,
    request_date: new Date().toISOString().slice(0, 10),
    deadline_date: deadlineDate,
    status: "received",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const service = createServiceClientSync();
  await notify(service, {
    organisationId: access.organisation_id,
    recipientGroups: ["data_protection_lead"],
    message: messages.sarReceived(clientName, deadlineDate),
  });
  await writeAuditLog(service, {
    organisationId: access.organisation_id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: "client",
    action: "client.sar.created",
    entityType: "sar_requests",
    entityId: data.id,
    metadata: { client_id, deadline_date: deadlineDate },
    req,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
