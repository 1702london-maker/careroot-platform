import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { Resend } from "resend";

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
        for (const mgr of managers) {
          if (!mgr.email) continue;
          await resend.emails.send({
            from,
            to: mgr.email,
            subject: `⚠️ DBS check expiring soon — ${person.first_name} ${person.last_name} — expires ${expiryFormatted}`,
            html: `<div style="font-family:sans-serif;max-width:600px">
              <div style="background:#1A3C2E;padding:20px;border-radius:8px 8px 0 0">
                <h2 style="color:white;margin:0">DBS Expiry Warning</h2>
              </div>
              <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                <p><strong>${person.first_name} ${person.last_name}</strong>'s DBS check expires in <strong>${days} days</strong> on <strong>${expiryFormatted}</strong>.</p>
                ${person.dbs_number ? `<p>DBS number: ${person.dbs_number}</p>` : ""}
                <p><a href="${appUrl}/staff/${person.id}" style="background:#1A3C2E;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View staff record →</a></p>
              </div>
            </div>`,
          });
          alertsSent++;
        }
      }
    }
  }

  return NextResponse.json({ checked: true, alerts_sent: alertsSent });
}
