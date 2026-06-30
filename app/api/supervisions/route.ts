import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { staff_id, supervision_date, supervision_type, topics_discussed, action_points, next_supervision_due, staff_signature_obtained } = body;
  if (!staff_id || !supervision_date || !supervision_type) {
    return NextResponse.json({ error: "staff_id, supervision_date, supervision_type required" }, { status: 400 });
  }

  const { data: target } = await supabase.from("users").select("organisation_id").eq("id", staff_id).single();
  if (target?.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from("supervision_records").insert({
    staff_id,
    supervisor_id: user.id,
    supervision_date,
    supervision_type,
    topics_discussed: topics_discussed || null,
    action_points: action_points || null,
    next_supervision_due: next_supervision_due || null,
    staff_signature_obtained: staff_signature_obtained || false,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
