import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { imei } = await req.json();
  if (!imei) return NextResponse.json({ error: "imei required" }, { status: 400 });

  const { data: device } = await supabase
    .from("registered_devices")
    .select("id, staff_id, is_active, device_model")
    .eq("imei", imei.replace(/\s/g, ""))
    .eq("staff_id", user.id)
    .single();

  if (!device) return NextResponse.json({ allowed: false, reason: "Device not registered" }, { status: 403 });
  if (!device.is_active) return NextResponse.json({ allowed: false, reason: "Device has been deactivated" }, { status: 403 });

  return NextResponse.json({ allowed: true, device_id: device.id, device_model: device.device_model });
}
