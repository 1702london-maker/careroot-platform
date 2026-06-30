import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Runs daily — escalates repeated medication refusals to managers
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  // Find clients with 3+ refusals in the last 7 days
  const { data: refusals } = await supabase
    .from("medication_records")
    .select("client_id, refusal_reason, server_timestamp, client:clients(id, first_name, last_name, organisation_id)")
    .eq("outcome", "refused")
    .gte("server_timestamp", since);

  if (!refusals?.length) return NextResponse.json({ escalated: 0 });

  // Count refusals per client
  const counts: Record<string, { count: number; client: Record<string, string>; reasons: string[] }> = {};
  for (const r of refusals) {
    const client = r.client as unknown as { id: string; first_name: string; last_name: string; organisation_id: string } | null;
    if (!client?.id) continue;
    if (!counts[client.id]) counts[client.id] = { count: 0, client, reasons: [] };
    counts[client.id].count++;
    if (r.refusal_reason) counts[client.id].reasons.push(r.refusal_reason);
  }

  // Only escalate clients with 3+ refusals
  const toEscalate = Object.values(counts).filter(c => c.count >= 3);
  if (!toEscalate.length) return NextResponse.json({ escalated: 0 });

  let escalated = 0;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || "noreply@careroot.care";

    // Group by org
    const byOrg: Record<string, typeof toEscalate> = {};
    for (const item of toEscalate) {
      const orgId = item.client.organisation_id;
      if (!orgId) continue;
      if (!byOrg[orgId]) byOrg[orgId] = [];
      byOrg[orgId].push(item);
    }

    for (const [orgId, items] of Object.entries(byOrg)) {
      const { data: managers } = await supabase
        .from("users").select("email, first_name").eq("organisation_id", orgId).in("role", ["org_admin", "manager"]);

      if (!managers?.length) continue;

      const rows = items.map(i =>
        `<tr><td style="padding:8px 12px">${i.client.first_name} ${i.client.last_name}</td><td style="padding:8px 12px;color:#DC2626;font-weight:600">${i.count} refusals</td><td style="padding:8px 12px">${Array.from(new Set(i.reasons)).join(", ") || "Not recorded"}</td></tr>`
      ).join("");

      for (const manager of managers) {
        if (!manager.email) continue;
        await resend.emails.send({
          from,
          to: manager.email,
          subject: `Careroot — Medication refusal alert (${items.length} client${items.length > 1 ? "s" : ""})`,
          html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F59E0B;padding:20px 24px;border-radius:8px 8px 0 0">
              <p style="color:white;font-size:18px;font-weight:600;margin:0">Medication Refusal Alert</p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="color:#1C1C1E">Hi ${manager.first_name}, the following clients have refused medication 3 or more times in the past 7 days:</p>
              <table style="width:100%;border-collapse:collapse;margin-top:12px">
                <thead><tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Client</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Refusals</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280">Reasons given</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
              <p style="color:#6B7280;font-size:13px;margin-top:16px">Review the client's medication plan and consider a GP review. Log in to Careroot for full records.</p>
            </div>
          </div>`,
        });
        escalated++;
      }
    }
  }

  return NextResponse.json({ clients_flagged: toEscalate.length, managers_notified: escalated });
}
