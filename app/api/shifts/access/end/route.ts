import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, imei, gps_lat, gps_lng, gps_accuracy_metres, auto_logout } = await req.json();
  if (!shift_id) return NextResponse.json({ error: "shift_id required" }, { status: 400 });

  const now = new Date().toISOString();

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, staff_id, status")
    .eq("id", shift_id)
    .eq("staff_id", user.id)
    .single();

  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  if (shift.status === "completed") return NextResponse.json({ error: "Shift already ended" }, { status: 400 });

  // Handover gating (BUILD_SPEC B14): a shift cannot be completed until the
  // outgoing worker has signed off a handover note. Auto-logout bypasses this
  // (the worker may be offline/out of time) and is flagged in the access log.
  if (!auto_logout) {
    const { data: handover } = await supabase
      .from("handover_notes")
      .select("id, outgoing_approved_at")
      .eq("shift_id", shift_id)
      .not("outgoing_approved_at", "is", null)
      .limit(1)
      .maybeSingle();

    if (!handover) {
      return NextResponse.json(
        { error: "Complete and sign off your handover note before ending this shift." },
        { status: 422 }
      );
    }
  }

  await Promise.all([
    supabase.from("shifts").update({ actual_end: now, status: "completed" }).eq("id", shift_id),
    supabase.from("shift_credentials").update({ invalidated_at: now }).eq("shift_id", shift_id).is("invalidated_at", null),
    supabase.from("shift_access_log").insert({
      shift_id, staff_id: user.id, device_imei: imei || null,
      action_type: auto_logout ? "auto_logout" : "shift_end",
      gps_lat: gps_lat || null, gps_lng: gps_lng || null,
      gps_accuracy_metres: gps_accuracy_metres || null,
      server_timestamp: now,
    }),
  ]);

  return NextResponse.json({ ended: true, shift_id, server_timestamp: now });
}
