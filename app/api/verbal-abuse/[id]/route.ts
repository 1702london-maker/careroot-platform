import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { invalidIdResponse, isUuid } from "@/lib/route-params";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return invalidIdResponse();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase
    .from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();
  const ALLOWED = ["status", "outcome", "action_taken", "reviewed_by", "reviewed_at", "closed_at"];
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) { if (ALLOWED.includes(k)) safe[k] = v; }
  if (Object.keys(safe).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await supabase
    .from("verbal_abuse_reports")
    .update(safe)
    .eq("id", params.id)
    .eq("organisation_id", caller.organisation_id)
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report: data });
}
