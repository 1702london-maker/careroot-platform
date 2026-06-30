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
  const { staff_id, compliance_item, status, valid_until, document_url, notes } = body;
  if (!staff_id || !compliance_item || !status) {
    return NextResponse.json({ error: "staff_id, compliance_item, status required" }, { status: 400 });
  }

  // Verify staff belongs to same org
  const { data: target } = await supabase.from("users").select("organisation_id").eq("id", staff_id).single();
  if (target?.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from("staff_compliance").insert({
    staff_id,
    compliance_item,
    status,
    valid_until: valid_until || null,
    document_url: document_url || null,
    notes: notes || null,
    verified_by: user.id,
    verified_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, valid_until, document_url, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("staff_compliance").update({
    status,
    valid_until: valid_until || null,
    document_url: document_url || null,
    notes: notes || null,
    verified_by: user.id,
    verified_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
