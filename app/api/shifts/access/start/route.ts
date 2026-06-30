import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, pin, token, imei, gps_lat, gps_lng, gps_accuracy_metres } = await req.json();
  if (!shift_id || !pin || !token) {
    return NextResponse.json({ error: "shift_id, pin, and token required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Validate credential
  const { data: credential } = await supabase
    .from("shift_credentials")
    .select("id, pin_hash, valid_from, valid_until, invalidated_at, staff_id")
    .eq("shift_id", shift_id)
    .eq("token", token)
    .eq("staff_id", user.id)
    .single();

  if (!credential || credential.invalidated_at || now < credential.valid_from || now > credential.valid_until) {
    await supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: "access_denied_bad_credential",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      gps_accuracy_metres: gps_accuracy_metres || null,
      server_timestamp: now,
    });
    return NextResponse.json({ allowed: false, reason: "Invalid or expired credentials" }, { status: 401 });
  }

  const pinMatch = await bcrypt.compare(pin, credential.pin_hash);
  if (!pinMatch) {
    await supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: "access_denied_wrong_pin",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      server_timestamp: now,
    });
    return NextResponse.json({ allowed: false, reason: "Incorrect PIN" }, { status: 401 });
  }

  // Validate IMEI — mandatory (BUILD_SPEC: access blocked if IMEI not registered).
  if (!imei) {
    await supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, action_type: "access_denied_no_imei",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null, server_timestamp: now,
    });
    return NextResponse.json({ allowed: false, reason: "Device identifier required" }, { status: 401 });
  }
  {
    const { data: device } = await supabase
      .from("registered_devices")
      .select("id, is_active")
      .eq("imei", imei.replace(/\s/g, ""))
      .eq("staff_id", user.id)
      .single();

    if (!device || !device.is_active) {
      await supabase.from("shift_access_log").insert({
        shift_id, staff_id: user.id, device_imei: imei,
        action_type: "access_denied_unregistered_device",
        gps_lat: gps_lat || null, gps_lng: gps_lng || null,
        server_timestamp: now,
      });
      return NextResponse.json({ allowed: false, reason: "Device not registered" }, { status: 401 });
    }
  }

  // GPS verification (server-side Haversine)
  let withinApprovedRadius: boolean | null = null;
  if (gps_lat != null && gps_lng != null) {
    // Get client GPS coords for this shift
    const { data: shift } = await supabase
      .from("shifts")
      .select("client_ids")
      .eq("id", shift_id)
      .single();

    if (shift?.client_ids?.length) {
      const { data: client } = await supabase
        .from("clients")
        .select("gps_lat, gps_lng, approved_radius_metres")
        .eq("id", shift.client_ids[0])
        .single();

      if (client?.gps_lat && client?.gps_lng) {
        const distMetres = haversineMetres(gps_lat, gps_lng, Number(client.gps_lat), Number(client.gps_lng));
        withinApprovedRadius = distMetres <= (client.approved_radius_metres ?? 300);
      }
    }
  }

  // Mark credential used and update shift actual_start
  await Promise.all([
    supabase.from("shift_credentials").update({ used_at: now }).eq("id", credential.id).is("used_at", null),
    supabase.from("shifts").update({ actual_start: now, status: "active" }).eq("id", shift_id),
    supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: "shift_start",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      gps_accuracy_metres: gps_accuracy_metres || null,
      within_approved_radius: withinApprovedRadius,
      server_timestamp: now,
    }),
  ]);

  return NextResponse.json({
    allowed: true,
    shift_id,
    within_approved_radius: withinApprovedRadius,
    server_timestamp: now,
  });
}
