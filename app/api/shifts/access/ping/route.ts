import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Called periodically during a shift to log GPS position and check credentials still valid
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, imei, gps_lat, gps_lng, gps_accuracy_metres } = await req.json();
  if (!shift_id) return NextResponse.json({ error: "shift_id required" }, { status: 400 });

  const now = new Date().toISOString();

  // Verify shift is still active and belongs to this user
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, staff_id, status, client_ids, scheduled_end")
    .eq("id", shift_id)
    .eq("staff_id", user.id)
    .single();

  if (!shift || shift.status !== "active") {
    return NextResponse.json({ active: false, reason: "Shift not active" });
  }

  // Check credentials still valid
  const { data: credential } = await supabase
    .from("shift_credentials")
    .select("id, valid_until, invalidated_at")
    .eq("shift_id", shift_id)
    .eq("staff_id", user.id)
    .is("invalidated_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!credential || now > credential.valid_until) {
    // Auto-logout: credential expired
    await Promise.all([
      supabase.from("shifts").update({ actual_end: now, status: "completed" }).eq("id", shift_id),
      supabase.from("shift_access_log").insert({
        shift_id, staff_id: user.id, device_imei: imei || null,
        action_type: "auto_logout_credential_expired",
        gps_lat: gps_lat || null, gps_lng: gps_lng || null,
        server_timestamp: now,
      }),
    ]);
    return NextResponse.json({ active: false, reason: "Credentials expired — auto logged out" });
  }

  // GPS check
  let withinApprovedRadius: boolean | null = null;
  if (gps_lat != null && gps_lng != null && shift.client_ids?.length) {
    const { data: client } = await supabase
      .from("clients")
      .select("gps_lat, gps_lng, approved_radius_metres")
      .eq("id", shift.client_ids[0])
      .single();

    if (client?.gps_lat && client?.gps_lng) {
      const dist = haversineMetres(gps_lat, gps_lng, Number(client.gps_lat), Number(client.gps_lng));
      withinApprovedRadius = dist <= (client.approved_radius_metres ?? 300);
    }
  }

  await supabase.from("shift_access_log").insert({
    shift_id, staff_id: user.id, device_imei: imei || null,
    action_type: "gps_ping",
    gps_lat: gps_lat || null, gps_lng: gps_lng || null,
    gps_accuracy_metres: gps_accuracy_metres || null,
    within_approved_radius: withinApprovedRadius,
    server_timestamp: now,
  });

  return NextResponse.json({
    active: true,
    within_approved_radius: withinApprovedRadius,
    credential_expires: credential.valid_until,
    server_timestamp: now,
  });
}
