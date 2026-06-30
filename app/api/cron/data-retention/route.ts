import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Runs monthly — enforces data retention policy
// UK care records: 7 years after discharge / client death
// Shift credentials: 90 days
// Access logs: 1 year
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();

  // 1. Delete expired (inactive) shift credentials older than 90 days
  const credCutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
  const { data: deletedCreds } = await supabase
    .from("shift_credentials")
    .delete()
    .eq("is_active", false)
    .lt("created_at", credCutoff)
    .select("id");

  // 2. Delete shift access logs older than 1 year
  const logCutoff = new Date(now.getTime() - 365 * 86400000).toISOString();
  const { data: deletedLogs } = await supabase
    .from("shift_access_log")
    .delete()
    .lt("logged_at", logCutoff)
    .select("id");

  // 3. Anonymise completed SAR requests older than 2 years (retain metadata, redact personal info)
  const sarCutoff = new Date(now.getTime() - 2 * 365 * 86400000).toISOString();
  const { data: oldSARs } = await supabase
    .from("sar_requests")
    .select("id")
    .eq("status", "completed")
    .lt("created_at", sarCutoff);

  let anonymisedSARs = 0;
  for (const sar of oldSARs || []) {
    await supabase.from("sar_requests").update({
      requester_name: "[REDACTED]",
      requester_email: null,
      notes: "[Anonymised after 2-year retention period]",
    }).eq("id", sar.id);
    anonymisedSARs++;
  }

  return NextResponse.json({
    credentials_purged: deletedCreds?.length || 0,
    access_logs_purged: deletedLogs?.length || 0,
    sars_anonymised: anonymisedSARs,
    run_at: now.toISOString(),
  });
}
