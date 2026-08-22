import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { push_token, device_id } = await req.json().catch(() => ({}));
  if (!push_token || typeof push_token !== "string") {
    return NextResponse.json({ error: "push_token required" }, { status: 400 });
  }

  if (!device_id || typeof device_id !== "string") {
    return NextResponse.json({ error: "device_id required before push notifications can be enabled" }, { status: 400 });
  }

  const imei = device_id.replace(/\s/g, "");
  const { data: updatedDevices, error } = await supabase
    .from("registered_devices")
    .update({
      push_token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq("staff_id", user.id)
    .eq("is_active", true)
    .eq("imei", imei)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!updatedDevices?.length) {
    return NextResponse.json(
      { error: "No active registered device found. Ask your manager to approve your Careroot Device ID before push notifications can be enabled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
