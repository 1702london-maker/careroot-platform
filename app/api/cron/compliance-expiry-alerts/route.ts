import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Runs daily — alerts managers about expiring staff compliance items and overdue supervisions
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString();
  const todayStr = now.toISOString();

  // Items expiring within 30 days or already expired
  const { data: expiringItems } = await supabase
    .from("staff_compliance")
    .select("id, compliance_item, valid_until, status, staff:users!staff_id(id, first_name, last_name, organisation_id)")
    .lte("valid_until", in30Days)
    .neq("status", "expired");

  // Overdue supervisions
  const { data: overdueSupervisions } = await supabase
    .from("supervision_records")
    .select("id, next_supervision_due, staff:users!staff_id(id, first_name, last_name, organisation_id)")
    .lt("next_supervision_due", todayStr)
    .not("next_supervision_due", "is", null);

  // Group by organisation
  const orgAlerts: Record<string, { expiring: typeof expiringItems; overdue: typeof overdueSupervisions }> = {};

  for (const item of expiringItems || []) {
    const staffRec = item.staff as unknown as { organisation_id: string; first_name: string; last_name: string } | null;
    const orgId = staffRec?.organisation_id;
    if (!orgId) continue;
    if (!orgAlerts[orgId]) orgAlerts[orgId] = { expiring: [], overdue: [] };
    orgAlerts[orgId].expiring!.push(item);
  }

  for (const item of overdueSupervisions || []) {
    const staffRec = item.staff as unknown as { organisation_id: string; first_name: string; last_name: string } | null;
    const orgId = staffRec?.organisation_id;
    if (!orgId) continue;
    if (!orgAlerts[orgId]) orgAlerts[orgId] = { expiring: [], overdue: [] };
    orgAlerts[orgId].overdue!.push(item);
  }

  let notified = 0;

  if (process.env.RESEND_API_KEY && Object.keys(orgAlerts).length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || "noreply@careroot.care";

    for (const [orgId, alerts] of Object.entries(orgAlerts)) {
      // Get org managers
      const { data: managers } = await supabase
        .from("users")
        .select("email, first_name")
        .eq("organisation_id", orgId)
        .in("role", ["org_admin", "manager"]);

      if (!managers?.length) continue;

      const expiringHtml = alerts.expiring?.map(i => {
        const staff = i.staff as unknown as { first_name: string; last_name: string } | null;
        const daysLeft = i.valid_until ? Math.ceil((new Date(i.valid_until).getTime() - now.getTime()) / 86400000) : null;
        return `<li>${staff?.first_name} ${staff?.last_name} — ${i.compliance_item} (${daysLeft !== null ? `${daysLeft < 0 ? "EXPIRED" : `${daysLeft}d remaining`}` : "no date"})</li>`;
      }).join("") || "";

      const overdueHtml = alerts.overdue?.map(i => {
        const staff = i.staff as unknown as { first_name: string; last_name: string } | null;
        const daysOverdue = i.next_supervision_due ? Math.ceil((now.getTime() - new Date(i.next_supervision_due).getTime()) / 86400000) : null;
        return `<li>${staff?.first_name} ${staff?.last_name} — supervision overdue by ${daysOverdue}d</li>`;
      }).join("") || "";

      for (const manager of managers) {
        if (!manager.email) continue;
        await resend.emails.send({
          from,
          to: manager.email,
          subject: `Careroot — Staff compliance alerts`,
          html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1A3C2E;padding:20px 24px;border-radius:8px 8px 0 0">
              <p style="color:white;font-size:18px;font-weight:600;margin:0">Careroot</p>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Staff Compliance Alert — Action Required</p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="color:#1C1C1E;font-size:15px">Hi ${manager.first_name},</p>
              ${expiringHtml ? `<p style="font-weight:600;color:#DC2626">Expiring compliance items:</p><ul>${expiringHtml}</ul>` : ""}
              ${overdueHtml ? `<p style="font-weight:600;color:#F59E0B">Overdue supervisions:</p><ul>${overdueHtml}</ul>` : ""}
              <p style="color:#6B7280;font-size:13px">Log in to Careroot to take action.</p>
            </div>
          </div>`,
        });
        notified++;
      }
    }
  }

  return NextResponse.json({
    expiring_items: expiringItems?.length || 0,
    overdue_supervisions: overdueSupervisions?.length || 0,
    managers_notified: notified,
  });
}
