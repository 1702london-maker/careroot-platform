import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, task_name, notes, requested_by } = await req.json();
  if (!shift_id || !task_name) {
    return NextResponse.json({ error: "shift_id and task_name required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Authorisation is decided SERVER-SIDE against the current care plan —
  // never trusted from the client (BUILD_SPEC B9).
  let isAuthorised = false;
  let organisationId: string | null = null;
  let clientName = "the client";

  if (client_id) {
    const { data: plan } = await supabase
      .from("care_plans")
      .select("authorised_tasks")
      .eq("client_id", client_id)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const authorised = (plan?.authorised_tasks as string[] | null) ?? [];
    isAuthorised = authorised
      .map((t) => String(t).toLowerCase().trim())
      .includes(String(task_name).toLowerCase().trim());

    const { data: client } = await supabase
      .from("clients")
      .select("organisation_id, first_name, last_name")
      .eq("id", client_id)
      .single();
    organisationId = client?.organisation_id ?? null;
    if (client) clientName = `${client.first_name} ${client.last_name}`;
  }

  const { data, error } = await supabase.from("task_completions").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    task_name, is_authorised: isAuthorised,
    notes: notes || null,
    server_timestamp: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Unauthorised task → auto-create a role boundary violation and alert leads.
  if (!isAuthorised && client_id) {
    await supabase.from("role_boundary_violations").insert({
      shift_id, client_id, staff_id: user.id,
      requested_task: task_name,
      requested_by: requested_by || "other",
      worker_response: "complied",
      compliance_note: notes || null,
      server_timestamp: now,
      notification_sent_at: now,
    });

    if (organisationId) {
      const { data: me } = await supabase
        .from("users").select("first_name, last_name").eq("id", user.id).single();
      const staffName = me ? `${me.first_name} ${me.last_name}` : "A worker";
      await notify(supabase, {
        organisationId,
        recipientGroups: ["manager", "hr_lead", "compliance_lead"],
        message: messages.roleBoundary(staffName, task_name, clientName, "complied"),
      });
    }
  }

  return NextResponse.json({ task: data, is_authorised: isAuthorised });
}
