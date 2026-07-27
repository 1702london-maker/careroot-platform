import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_FIELDS = new Set([
  "mood_score", "stress_level", "workload_rating", "support_needed",
  "notes", "follow_up_required", "follow_up_date", "status",
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase
    .from("users").select("role, organisation_id").eq("id", user.id).single();

  if (!["superadmin", "org_admin", "manager", "coordinator", "hr_manager"].includes(caller?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};
  for (const key of Array.from(ALLOWED_FIELDS)) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("staff_wellbeing_checks")
    .select("id, staff:users!staff_id(organisation_id)")
    .eq("id", params.id)
    .single();
  const staff = Array.isArray(existing?.staff) ? existing?.staff[0] : existing?.staff;
  if (!existing || (caller?.role !== "superadmin" && staff?.organisation_id !== caller?.organisation_id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("staff_wellbeing_checks")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ check: data });
}
