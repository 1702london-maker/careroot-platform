import { NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { writeCronRun } from "@/lib/platform-audit";

/**
 * Data protection enforcement (BUILD_SPEC B20 / system rules).
 * 1. Package-end closure: revoke access and set retention date.
 * 2. Flag records whose data_retention_until has elapsed.
 * 3. Purge expired credentials and old access logs.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date();
  const startedAt = now;
  const today = now.toISOString().split("T")[0];

  const { data: ended } = await supabase
    .from("clients")
    .select("id, package_end_date, date_of_birth, service_line:service_lines(code, regulatory_body)")
    .lt("package_end_date", today)
    .is("access_revoked_at", null);

  let closed = 0;
  let familyAccessRevoked = 0;

  for (const client of ended ?? []) {
    if (!client.package_end_date) continue;

    const retentionUntil = new Date(client.package_end_date);
    retentionUntil.setDate(retentionUntil.getDate() + 2920);

    const serviceLine = Array.isArray(client.service_line) ? client.service_line[0] : client.service_line;
    const serviceCode = (serviceLine?.code || "").toUpperCase();
    const regulatoryBody = (serviceLine?.regulatory_body || "").toUpperCase();
    const childService = ["OFSTED", "LOCAL_AUTHORITY"].includes(regulatoryBody)
      || serviceCode.includes("CHILD")
      || serviceCode.includes("OUTREACH");

    if (childService && client.date_of_birth) {
      const twentyFifthBirthday = new Date(client.date_of_birth);
      twentyFifthBirthday.setFullYear(twentyFifthBirthday.getFullYear() + 25);
      if (twentyFifthBirthday > retentionUntil) {
        retentionUntil.setTime(twentyFifthBirthday.getTime());
      }
    }

    await supabase
      .from("clients")
      .update({
        status: "inactive",
        access_revoked_at: now.toISOString(),
        data_retention_until: retentionUntil.toISOString().split("T")[0],
      })
      .eq("id", client.id);

    const { data: revoked } = await supabase
      .from("family_access")
      .update({ is_active: false })
      .eq("client_id", client.id)
      .eq("is_active", true)
      .select("id");
    familyAccessRevoked += revoked?.length ?? 0;
    closed++;
  }

  const { data: retentionElapsed } = await supabase
    .from("clients")
    .select("id")
    .lt("data_retention_until", today)
    .not("data_retention_until", "is", null);

  const credCutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
  const { data: deletedCreds } = await supabase
    .from("shift_credentials")
    .delete()
    .not("invalidated_at", "is", null)
    .lt("created_at", credCutoff)
    .select("id");

  const logCutoff = new Date(now.getTime() - 365 * 86400000).toISOString();
  const { data: deletedLogs } = await supabase
    .from("shift_access_log")
    .delete()
    .lt("server_timestamp", logCutoff)
    .select("id");

  const result = {
    packages_closed: closed,
    family_access_revoked: familyAccessRevoked,
    retention_elapsed_flagged: retentionElapsed?.length ?? 0,
    credentials_purged: deletedCreds?.length ?? 0,
    access_logs_purged: deletedLogs?.length ?? 0,
    run_at: now.toISOString(),
  };
  await writeCronRun(supabase, {
    jobName: "data-retention",
    path: "/api/cron/data-retention",
    status: "success",
    startedAt,
    result,
  });
  return NextResponse.json(result);
}
