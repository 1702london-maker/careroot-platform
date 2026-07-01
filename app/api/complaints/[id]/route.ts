import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notify, messages } from "@/lib/notifications";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("complaints")
    .select("*, clients(first_name, last_name), users!submitted_by(first_name, last_name)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ complaint: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();

  if (!["org_admin", "manager", "compliance_lead"].includes(userRecord?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "investigation_notes", "resolution_notes", "resolved_at", "wants_cqc_escalation"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (body.status === "resolved" && !update.resolved_at) {
    update.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("complaints").update(update).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Alert compliance lead on CQC escalation
  if (body.wants_cqc_escalation && userRecord?.organisation_id) {
    await notify(supabase, {
      organisationId: userRecord.organisation_id,
      recipientGroups: ["compliance_lead"],
      message: `Complaint ${id.slice(0, 8)} has been flagged for CQC escalation. Immediate review required.`,
    });
  }

  return NextResponse.json({ complaint: data });
}
