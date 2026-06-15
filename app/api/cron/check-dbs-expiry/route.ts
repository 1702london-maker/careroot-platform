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

  // Check at 90, 60, and 30 days before expiry
  const checkDays = [90, 60, 30];
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

  let alertsSent = 0;

  for (const days of checkDays) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split("T")[0];

    const { data: staff } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, dbs_number, dbs_expiry, organisation_id")
      .eq("dbs_expiry", dateStr)
      .eq("is_active", true);

    if (!staff?.length) continue;

    for (const person of staff) {
      const expiryFormatted = new Date(person.dbs_expiry).toLocaleDateString("en-GB");

      const { data: managers } = await supabase
        .from("users")
        .select("email")
        .eq("organisation_id", person.organisation_id)
        .in("role", ["owner", "manager"])
        .eq("is_active", true);

      if (resend && managers?.length) {
        const tpl = dbsExpiryEmail({ staffName: `${person.first_name} ${person.last_name}`, expiryDate: expiryFormatted, daysRemaining: days });
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
