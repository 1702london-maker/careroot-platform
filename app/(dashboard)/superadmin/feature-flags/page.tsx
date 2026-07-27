import { CRBadge } from "@/components/ui/CRBadge";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeUK } from "@/lib/utils";

type FlagRow = {
  id: string;
  flag_key: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  updated_at: string;
  organisation: { name: string } | null;
};

export default async function SuperadminFeatureFlagsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("id, flag_key, enabled, config, updated_at, organisation:organisations(name)")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as FlagRow[];

  return (
    <div>
      <CRPageHeader
        title="Feature Flags"
        subtitle="Organisation-level capability switches for rollout control."
        breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]}
      />

      <CRCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Organisation", "Flag", "Status", "Updated", "Config"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-semibold text-cr-charcoal">{row.organisation?.name ?? "Global"}</td>
                  <td className="px-5 py-3 text-sm font-mono text-cr-charcoal">{row.flag_key}</td>
                  <td className="px-5 py-3"><CRBadge variant={row.enabled ? "green" : "slate"} size="sm">{row.enabled ? "Enabled" : "Disabled"}</CRBadge></td>
                  <td className="px-5 py-3 text-xs text-cr-slate">{formatDateTimeUK(row.updated_at)}</td>
                  <td className="px-5 py-3 text-xs text-cr-slate max-w-md truncate">{row.config ? JSON.stringify(row.config) : "{}"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-cr-slate">No feature flags configured yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CRCard>
    </div>
  );
}
