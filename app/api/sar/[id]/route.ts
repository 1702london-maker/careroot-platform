import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, notes, data_provided_at } = await req.json();
  const validStatuses = ["received", "in_progress", "completed", "refused"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (data_provided_at) update.data_provided_at = data_provided_at;
  if (status === "completed" && !data_provided_at) update.data_provided_at = new Date().toISOString();

  const { error } = await supabase.from("sar_requests").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
