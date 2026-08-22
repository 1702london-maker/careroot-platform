import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { invalidIdResponse, isUuid } from "@/lib/route-params";

const ALLOWED_FIELDS = new Set([
  "status", "severity", "outcome", "reviewed_by", "reviewed_at",
  "action_taken", "investigation_notes", "closed_at", "referral_made",
  "referral_agency", "referral_date",
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return invalidIdResponse();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase
    .from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();

  // Allowlist — only safe operational fields can be patched
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = v;
  }
  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Scope to caller's org — prevents cross-org writes
  const { data, error } = await supabase
    .from("incidents")
    .update(safe)
    .eq("id", id)
    .eq("organisation_id", caller.organisation_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incident: data });
}
