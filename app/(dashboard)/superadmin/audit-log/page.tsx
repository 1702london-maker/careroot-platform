import { CRBadge } from "@/components/ui/CRBadge";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeUK } from "@/lib/utils";

type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  actor_email: string | null;
  actor_role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  organisation: { name: string } | null;
};

export default async function SuperadminAuditLogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_audit_logs")
    .select("id, created_at, action, actor_email, actor_role, entity_type, entity_id, metadata, organisation:organisations(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as AuditRow[];

  return (
    <div>
      <CRPageHeader
        title="Audit Log"
        subtitle="Latest platform-level activity across organisations."
        breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]}
      />

      <CRCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Time", "Action", "Actor", "Organisation", "Entity", "Metadata"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-xs text-cr-slate whitespace-nowrap">{formatDateTimeUK(row.created_at)}</td>
                  <td className="px-5 py-3"><CRBadge variant="blue" size="sm">{row.action}</CRBadge></td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-cr-charcoal">{row.actor_email ?? "System"}</p>
                    <p className="text-xs text-cr-slate">{row.actor_role ?? "-"}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-cr-charcoal">{row.organisation?.name ?? "-"}</td>
                  <td className="px-5 py-3 text-xs text-cr-slate">{row.entity_type ?? "-"}{row.entity_id ? ` / ${row.entity_id}` : ""}</td>
                  <td className="px-5 py-3 text-xs text-cr-slate max-w-sm truncate">{row.metadata ? JSON.stringify(row.metadata) : "-"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-cr-slate">No audit events logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CRCard>
    </div>
  );
}
