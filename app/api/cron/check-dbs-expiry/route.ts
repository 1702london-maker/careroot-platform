import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { Resend } from "resend";
import { dbsExpiryEmail } from "@/lib/emails";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date();
  const checkDays = [90, 60, 30];
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";

  let alertsSent = 0;

  for (const days of checkDays) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split("T")[0];

    // DBS is stored in staff_records, joined to users for name/email
    const { data: staffRecords } = await supabase
      .from("staff_records")
      .select("id, dbs_number, dbs_expiry, organisation_id, users(first_name, last_name, email, is_active)")
      .eq("dbs_expiry", dateStr);

    if (!staffRecords?.length) continue;

    for (const record of staffRecords) {
      const person = record.users as Record<string, string | boolean> | null;
      if (!person || !person.is_active) continue;

      const staffName = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
      const expiryFormatted = new Date(record.dbs_expiry).toLocaleDateString("en-GB");

      const { data: managers } = await supabase
        .from("users")
        .select("email")
        .eq("organisation_id", record.organisation_id)
        .in("role", ["org_admin", "manager"])
        .eq("is_active", true);

      if (resend && managers?.length) {
        const tpl = dbsExpiryEmail({ staffName, expiryDate: expiryFormatted, daysRemaining: days });
        for (const mgr of managers) {
          if (!mgr.email) continue;
          await resend.emails.send({ from, to: mgr.email, ...tpl });
          alertsSent++;
        }
      }
    }
  }

  return NextResponse.json({ checked: true, alerts_sent: alertsSent });
}
