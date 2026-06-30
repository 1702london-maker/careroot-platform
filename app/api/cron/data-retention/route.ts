import { NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";

/**
 * Data protection enforcement (BUILD_SPEC B20 / system rules).
 * 1. Package-end closure: revoke access + set retention date when a client's
 *    package_end_date has passed.
 * 2. Flag records whose data_retention_until has elapsed (manager action).
 * 3. Purge expired credentials and old access logs.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // 1. Package-end closure protocol — clients whose package ended and access
  //    has not yet been revoked. Retention: 8 years (2920 days) post package end.
  const { data: ended } = await supabase
    .from("clients")
    .select("id, package_end_date")
    .lt("package_end_date", today)
    .is("access_revoked_at", null);

  let closed = 0;
  for (const c of ended ?? []) {
    if (!c.package_end_date) continue;
    const retentionUntil = new Date(c.package_end_date);
    retentionUntil.setDate(retentionUntil.getDate() + 2920);
    await supabase.from("clients").update({
      status: "inactive",
      access_revoked_at: now.toISOString(),
      data_retention_until: retentionUntil.toISOString().split("T")[0],
    }).eq("id", c.id);
    closed++;
  }

  // 2. Flag clients whose retention window has fully elapsed (ready for disposal).
  const { data: retentionElapsed } = await supabase
    .from("clients")
    .select("id")
    .lt("data_retention_until", today)
    .not("data_retention_until", "is", null);

  // 3. Purge invalidated shift credentials older than 90 days.
  const credCutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
  const { data: deletedCreds } = await supabase
    .from("shift_credentials")
    .delete()
    .not("invalidated_at", "is", null)
    .lt("created_at", credCutoff)
    .select("id");

  // 4. Purge shift access logs older than 1 year (correct column: server_timestamp).
  const logCutoff = new Date(now.getTime() - 365 * 86400000).toISOString();
  const { data: deletedLogs } = await supabase
    .from("shift_access_log")
    .delete()
    .lt("server_timestamp", logCutoff)
    .select("id");

  return NextResponse.json({
    packages_closed: closed,
    retention_elapsed_flagged: retentionElapsed?.length ?? 0,
    credentials_purged: deletedCreds?.length ?? 0,
    access_logs_purged: deletedLogs?.length ?? 0,
    run_at: now.toISOString(),
  });
}
