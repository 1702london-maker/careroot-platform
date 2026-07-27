import { createServiceClientSync } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { writeCronRun } from "@/lib/platform-audit";

// Runs daily — invalidates expired shift credentials
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const startedAt = new Date();
  const now = startedAt.toISOString();

  const { data, error } = await supabase
    .from("shift_credentials")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("valid_until", now)
    .select("id");

  if (error) {
    console.error("cleanup-credentials error:", error);
    await writeCronRun(supabase, { jobName: "cleanup-credentials", path: "/api/cron/cleanup-credentials", status: "failed", startedAt, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = { cleaned: data?.length || 0, timestamp: now };
  await writeCronRun(supabase, { jobName: "cleanup-credentials", path: "/api/cron/cleanup-credentials", status: "success", startedAt, result });
  return NextResponse.json(result);
}
