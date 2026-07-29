import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: manager } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!manager || !["superadmin", "org_admin", "manager"].includes(manager.role)) {
    return NextResponse.json({ error: "Only managers can approve devices" }, { status: 403 });
  }

  const { device_id } = await req.json();
  if (!device_id) return NextResponse.json({ error: "device_id required" }, { status: 400 });

  const { data: device } = await supabase
    .from("registered_devices")
    .select("id, staff:users!staff_id(organisation_id)")
    .eq("id", device_id)
    .single();

  const staff = Array.isArray(device?.staff) ? device?.staff[0] : device?.staff;
  if (!device || staff?.organisation_id !== manager.organisation_id) {
    return NextResponse.json({ error: "Device request not found in your organisation" }, { status: 404 });
  }

  const { error } = await supabase
    .from("registered_devices")
    .update({
      is_active: true,
      registered_by: user.id,
      registered_at: new Date().toISOString(),
      deactivated_at: null,
      deactivated_by: null,
    })
    .eq("id", device_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approved: true });
}
