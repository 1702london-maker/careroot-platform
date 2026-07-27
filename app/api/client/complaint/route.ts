import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";
import { generateComplaintReference } from "@/lib/utils";
import { writeAuditLog } from "@/lib/platform-audit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { client_id, category, description, desired_outcome } = await req.json();
  if (!client_id || !description) {
    return NextResponse.json({ error: "client_id and description required" }, { status: 400 });
  }

  const { data: access } = await supabase
    .from("client_access")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("client_id", client_id)
    .eq("is_active", true)
    .single();
  if (!access?.organisation_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase.from("complaints").insert({
    organisation_id: access.organisation_id,
    client_id,
    submitted_by: user.id,
    reference_number: generateComplaintReference(),
    category: category || "care_quality",
    description,
    desired_outcome: desired_outcome || null,
    status: "open",
  }).select("id, reference_number").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(createServiceClientSync(), {
    organisationId: access.organisation_id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: "client",
    action: "client.complaint.created",
    entityType: "complaints",
    entityId: data.id,
    metadata: { client_id, reference_number: data.reference_number, category },
    req,
  });

  return NextResponse.json({ ok: true, complaint: data });
}
