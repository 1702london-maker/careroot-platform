import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";

/**
 * Auto-logout: end any active shift whose credential window has passed
 * (BUILD_SPEC B21 shift-access-expiry). Ideally runs every 1 minute — requires
 * Vercel Pro for sub-daily cron frequency.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date().toISOString();

  // Active shifts whose access window has closed.
  const { data: expired } = await supabase
    .from("shifts")
    .select("id, staff_id, access_closes_at, scheduled_end")
    .eq("status", "active")
    .lt("access_closes_at", now);

  let ended = 0;
  for (const shift of expired ?? []) {
    await Promise.all([
      supabase.from("shifts").update({ actual_end: now, status: "completed" }).eq("id", shift.id),
      supabase.from("shift_credentials").update({ invalidated_at: now }).eq("shift_id", shift.id).is("invalidated_at", null),
      supabase.from("shift_access_log").insert({
        shift_id: shift.id, staff_id: shift.staff_id,
        action_type: "auto_logout", server_timestamp: now,
        metadata: { reason: "credential_window_expired" },
      }),
    ]);
    ended++;
  }

  return NextResponse.json({ ok: true, ended });
}
