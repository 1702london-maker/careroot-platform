import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager", "coordinator"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { granted, withdrawn_at, notes } = await req.json();

  const update: Record<string, unknown> = {};
  if (granted !== undefined) update.granted = Boolean(granted);
  if (withdrawn_at !== undefined) update.withdrawn_at = withdrawn_at;
  if (!granted && !withdrawn_at) update.withdrawn_at = new Date().toISOString();
  if (notes !== undefined) update.notes = notes;

  const { error } = await supabase.from("consent_records").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
