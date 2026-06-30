import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager", "coordinator"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { client_id, consent_type, granted, granted_by, notes, review_due } = body;
  if (!client_id || !consent_type || granted === undefined) {
    return NextResponse.json({ error: "client_id, consent_type, granted required" }, { status: 400 });
  }

  const { data: clientRec } = await supabase.from("clients").select("organisation_id").eq("id", client_id).single();
  if (clientRec?.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from("consent_records").insert({
    client_id,
    consent_type,
    granted: Boolean(granted),
    granted_by: granted_by || null,
    granted_at: granted ? new Date().toISOString() : null,
    notes: notes || null,
    review_due: review_due || null,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
