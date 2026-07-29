import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { imei, device_model } = await req.json();
  const cleanImei = String(imei || "").replace(/\s/g, "");
  if (!cleanImei) return NextResponse.json({ error: "Device ID required" }, { status: 400 });

  const { data: staff } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!staff || staff.role !== "carer") {
    return NextResponse.json({ error: "Only staff accounts can request device approval" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("registered_devices")
    .select("id, is_active")
    .eq("imei", cleanImei)
    .eq("staff_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      requested: !existing.is_active,
      approved: existing.is_active,
      device_id: existing.id,
    });
  }

  const { data, error } = await supabase
    .from("registered_devices")
    .insert({
      staff_id: user.id,
      imei: cleanImei,
      device_model: device_model || null,
      registered_by: null,
      is_active: false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This device is already linked to another staff account. Contact your manager." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requested: true, approved: false, device_id: data.id });
}
