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
  const { client_id, requester_name, requester_relationship, requester_email, request_date, notes } = body;
  if (!client_id || !requester_name || !request_date) {
    return NextResponse.json({ error: "client_id, requester_name, request_date required" }, { status: 400 });
  }

  // Verify client belongs to org
  const { data: clientRec } = await supabase.from("clients").select("organisation_id").eq("id", client_id).single();
  if (clientRec?.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // SAR deadline = request_date + 30 days
  const deadline = new Date(request_date);
  deadline.setDate(deadline.getDate() + 30);

  const { data, error } = await supabase.from("sar_requests").insert({
    client_id,
    requester_name,
    requester_relationship: requester_relationship || null,
    requester_email: requester_email || null,
    request_date,
    deadline_date: deadline.toISOString().split("T")[0],
    status: "received",
    notes: notes || null,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sar: data });
}
