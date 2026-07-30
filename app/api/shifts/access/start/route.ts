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
    return NextResponse.json({ allowed: false, reason: "This device has no Careroot Device ID yet. Reopen the app, then contact your manager if it continues." }, { status: 401 });
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
      return NextResponse.json({ allowed: false, reason: "This device is not approved for your staff account. Contact your manager to register this Careroot Device ID." }, { status: 401 });
    }
  }

  // GPS verification (server-side Haversine)
  let withinApprovedRadius: boolean | null = null;
  const { data: shift } = await supabase
    .from("shifts")
    .select("client_ids")
    .eq("id", shift_id)
    .eq("staff_id", user.id)
    .single();

  if (!shift) {
    return NextResponse.json({ allowed: false, reason: "Shift not assigned to this staff member" }, { status: 403 });
  }

  if (shift.client_ids?.length) {
    const recentHandoverCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: unreadHandovers } = await supabase
      .from("handover_notes")
      .select("id, client_id")
      .in("client_id", shift.client_ids)
      .not("outgoing_approved_at", "is", null)
      .is("incoming_read_confirmed_at", null)
      .gte("server_timestamp", recentHandoverCutoff)
      .or(`incoming_staff_id.is.null,incoming_staff_id.eq.${user.id}`)
      .limit(1);

    if (unreadHandovers?.length) {
      return NextResponse.json({
        allowed: false,
        reason: "You must read and confirm the handover note before starting care.",
        handover_required: true,
      }, { status: 403 });
    }
  }

  if (shift.client_ids?.length) {
    const { data: currentCarePlans } = await supabase
      .from("care_plans")
      .select("id, client_id")
      .in("client_id", shift.client_ids)
      .eq("is_current", true);

    const carePlanIds = (currentCarePlans ?? []).map((plan) => plan.id);
    if (carePlanIds.length) {
      const { data: confirmedViews } = await supabase
        .from("care_plan_views")
        .select("care_plan_id")
        .eq("carer_id", user.id)
        .in("care_plan_id", carePlanIds);

      const confirmedIds = new Set((confirmedViews ?? []).map((view) => view.care_plan_id));
      const missingCarePlan = carePlanIds.some((id) => !confirmedIds.has(id));
      if (missingCarePlan) {
        return NextResponse.json({
          allowed: false,
          reason: "You must read and confirm the current care plan before starting this shift.",
          care_plan_required: true,
        }, { status: 403 });
      }
    }
  }

  if (shift.client_ids?.length) {
    const { data: client } = await supabase
      .from("clients")
      .select("gps_lat, gps_lng, approved_radius_metres")
      .eq("id", shift.client_ids[0])
      .single();

    if (client?.gps_lat && client?.gps_lng) {
      if (gps_lat == null || gps_lng == null) {
        await supabase.from("shift_access_log").insert({
          shift_id, staff_id: user.id, device_imei: imei || null,
          action_type: "access_denied_missing_gps",
          gps_accuracy_metres: gps_accuracy_metres || null,
          server_timestamp: now,
        });
        return NextResponse.json({ allowed: false, reason: "Location is required for safety. Enable location to confirm you are with the client, or contact your manager." }, { status: 401 });
      }

      const distMetres = haversineMetres(gps_lat, gps_lng, Number(client.gps_lat), Number(client.gps_lng));
      withinApprovedRadius = distMetres <= (client.approved_radius_metres ?? 300);
    }
  }

  // Block if GPS was provided and carer is confirmed outside approved radius
  if (withinApprovedRadius === false) {
    await supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: "access_denied_outside_radius",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      gps_accuracy_metres: gps_accuracy_metres || null,
      within_approved_radius: false,
      server_timestamp: now,
    });
    return NextResponse.json({
      allowed: false,
      reason: "You are outside the approved client radius. Move closer and try again, or contact your manager if this is incorrect.",
    }, { status: 401 });
  }

  // Mark credential used and update shift actual_start
  const { data: usedCredential, error: credentialUseError } = await supabase
    .from("shift_credentials")
    .update({ used_at: now })
    .eq("id", credential.id)
    .is("used_at", null)
    .select("id")
    .single();

  if (credentialUseError || !usedCredential) {
    await supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: "access_denied_credential_already_used",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      gps_accuracy_metres: gps_accuracy_metres || null,
      within_approved_radius: withinApprovedRadius,
      server_timestamp: now,
    });
    return NextResponse.json({ allowed: false, reason: "Shift access has already been used or could not be verified. Ask your manager to reauthorise you." }, { status: 409 });
  }

  const [{ error: shiftUpdateError }, { error: logError }] = await Promise.all([
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

  if (shiftUpdateError || logError) {
    console.error("shift start write error:", { shiftUpdateError, logError });
    return NextResponse.json({ allowed: false, reason: "Unable to start shift. Please try again or contact your manager." }, { status: 500 });
  }

  return NextResponse.json({
    allowed: true,
    shift_id,
    within_approved_radius: withinApprovedRadius,
    server_timestamp: now,
  });
}
