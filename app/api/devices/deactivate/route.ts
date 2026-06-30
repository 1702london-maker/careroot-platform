import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: manager } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!manager || !["superadmin", "org_admin", "manager"].includes(manager.role)) {
    return NextResponse.json({ error: "Only managers can deactivate devices" }, { status: 403 });
  }

  const { device_id } = await req.json();
  if (!device_id) return NextResponse.json({ error: "device_id required" }, { status: 400 });

  // Verify device belongs to staff in this org
  const { data: device } = await supabase
    .from("registered_devices")
    .select("id, staff_id, users!staff_id(organisation_id)")
    .eq("id", device_id)
    .single();

  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("registered_devices")
    .update({ is_active: false, deactivated_at: new Date().toISOString(), deactivated_by: user.id })
    .eq("id", device_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ device: data });
}
