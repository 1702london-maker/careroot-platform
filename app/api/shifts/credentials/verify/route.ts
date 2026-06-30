import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, pin, token, imei } = await req.json();
  if (!shift_id || !pin || !token) {
    return NextResponse.json({ error: "shift_id, pin, and token required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: credential } = await supabase
    .from("shift_credentials")
    .select("id, pin_hash, valid_from, valid_until, used_at, invalidated_at, staff_id")
    .eq("shift_id", shift_id)
    .eq("token", token)
    .eq("staff_id", user.id)
    .single();

  if (!credential) return NextResponse.json({ valid: false, reason: "Invalid credentials" }, { status: 401 });
  if (credential.invalidated_at) return NextResponse.json({ valid: false, reason: "Credentials have been invalidated" }, { status: 401 });
  if (now < credential.valid_from) return NextResponse.json({ valid: false, reason: "Credentials not yet active" }, { status: 401 });
  if (now > credential.valid_until) return NextResponse.json({ valid: false, reason: "Credentials have expired" }, { status: 401 });

  const pinMatch = await bcrypt.compare(pin, credential.pin_hash);
  if (!pinMatch) return NextResponse.json({ valid: false, reason: "Incorrect PIN" }, { status: 401 });

  // If IMEI provided, verify it matches a registered device for this staff member
  if (imei) {
    const { data: device } = await supabase
      .from("registered_devices")
      .select("id, is_active")
      .eq("imei", imei.replace(/\s/g, ""))
      .eq("staff_id", user.id)
      .single();

    if (!device || !device.is_active) {
      return NextResponse.json({ valid: false, reason: "Device not registered or deactivated" }, { status: 401 });
    }
  }

  // Mark as used if first use
  if (!credential.used_at) {
    await supabase.from("shift_credentials").update({ used_at: now }).eq("id", credential.id);
  }

  return NextResponse.json({ valid: true, credential_id: credential.id });
}
