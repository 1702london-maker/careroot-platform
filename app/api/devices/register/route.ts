import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: manager } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!manager || !["superadmin", "org_admin", "manager"].includes(manager.role)) {
    return NextResponse.json({ error: "Only managers can register devices" }, { status: 403 });
  }

  const { staff_id, imei, device_model } = await req.json();
  if (!staff_id || !imei) return NextResponse.json({ error: "staff_id and imei required" }, { status: 400 });

  // Verify staff member belongs to same org
  const { data: staffMember } = await supabase.from("users").select("id, organisation_id").eq("id", staff_id).single();
  if (!staffMember || staffMember.organisation_id !== manager.organisation_id) {
    return NextResponse.json({ error: "Staff member not found in your organisation" }, { status: 404 });
  }

  const { data, error } = await supabase.from("registered_devices").insert({
    staff_id,
    imei: imei.replace(/\s/g, ""),
    device_model: device_model || null,
    registered_by: user.id,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This IMEI is already registered" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ device: data });
}
