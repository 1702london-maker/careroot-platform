import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Runs daily — alerts managers about SARs approaching the 30-day GDPR deadline
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];

  // SARs due within 7 days or overdue, still open
  const { data: urgentSARs } = await supabase
    .from("sar_requests")
    .select("id, requester_name, deadline_date, status, client:clients(id, first_name, last_name, organisation_id)")
    .in("status", ["received", "in_progress"])
    .lte("deadline_date", in7Days);

  if (!urgentSARs?.length) return NextResponse.json({ alerted: 0 });

  // Group by org
  const byOrg: Record<string, typeof urgentSARs> = {};
  for (const sar of urgentSARs) {
    const orgId = (sar.client as unknown as { organisation_id: string } | null)?.organisation_id;
    if (!orgId) continue;
    if (!byOrg[orgId]) byOrg[orgId] = [];
    byOrg[orgId].push(sar);
  }

  let notified = 0;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || "noreply@careroot.care";

    for (const [orgId, sars] of Object.entries(byOrg)) {
      const { data: managers } = await supabase
        .from("users").select("email, first_name").eq("organisation_id", orgId).in("role", ["org_admin", "manager"]);

      if (!managers?.length) continue;

      const sarRows = sars.map(s => {
        const client = s.client as unknown as { first_name: string; last_name: string } | null;
        const days = Math.ceil((new Date(s.deadline_date).getTime() - now.getTime()) / 86400000);
        return `<tr><td style="padding:8px 12px">${client?.first_name} ${client?.last_name}</td><td style="padding:8px 12px">${s.requester_name}</td><td style="padding:8px 12px;color:${days < 0 ? "#DC2626" : days <= 3 ? "#F59E0B" : "#1C1C1E"};font-weight:600">${days < 0 ? `OVERDUE (${Math.abs(days)}d)` : `${days}d remaining`}</td><td style="padding:8px 12px;text-transform:capitalize">${s.status.replace("_", " ")}</td></tr>`;
      }).join("");

      for (const manager of managers) {
        if (!manager.email) continue;
        await resend.emails.send({
          from,
          to: manager.email,
          subject: `⚠ Careroot — ${sars.length} SAR${sars.length > 1 ? "s" : ""} require urgent action`,
          html: `<div style="font-family:'DM Sans',sans-serif;max-width:640px;margin:0 auto">
            <div style="background:#DC2626;padding:20px 24px;border-radius:8px 8px 0 0">
              <p style="color:white;font-size:18px;font-weight:600;margin:0">Careroot — Urgent SAR Alert</p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="color:#1C1C1E">Hi ${manager.first_name}, the following Subject Access Requests require immediate action under GDPR (30-day deadline):</p>
              <table style="width:100%;border-collapse:collapse;margin-top:12px">
                <thead><tr style="background:#f9fafb">
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Client</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Requester</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Deadline</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Status</th>
                </tr></thead>
                <tbody>${sarRows}</tbody>
              </table>
              <p style="color:#6B7280;font-size:13px;margin-top:16px">Failure to respond within 30 days is a breach of UK GDPR. Log in to Careroot immediately.</p>
            </div>
          </div>`,
        });
        notified++;
      }
    }
  }

  return NextResponse.json({ urgent_sars: urgentSARs.length, managers_notified: notified });
}
