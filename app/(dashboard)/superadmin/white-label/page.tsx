import { createClient } from "@/lib/supabase/server";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRBadge } from "@/components/ui/CRBadge";
import { formatDateUK } from "@/lib/utils";

export default async function SuperadminWhiteLabel() {
  const supabase = await createClient();

  const { data: wlOrgs } = await supabase
    .from("organisations")
    .select("id, name, plan, wl_package_tier, wl_domain, wl_setup_complete, wl_app_name, white_label_domains(*)")
    .eq("white_label", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <CRPageHeader
        title="White Label Organisations"
        subtitle={`${wlOrgs?.length ?? 0} active`}
        breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]}
      />

      <CRCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Organisation", "App name", "Package", "Domain", "Domain status", "Setup", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(wlOrgs ?? []).map((org) => {
                const domains = (org.white_label_domains ?? []) as Array<{ domain: string; verified: boolean; created_at: string }>;
                const latestDomain = domains[0];
                return (
                  <tr key={org.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-body font-semibold text-cr-charcoal">{org.name}</td>
                    <td className="px-5 py-3 text-sm font-body text-cr-charcoal">{org.wl_app_name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <CRBadge variant="green" size="sm" className="capitalize">{org.wl_package_tier ?? "basic"}</CRBadge>
                    </td>
                    <td className="px-5 py-3 text-xs font-body text-cr-charcoal">{org.wl_domain ?? latestDomain?.domain ?? "—"}</td>
                    <td className="px-5 py-3">
                      {latestDomain ? (
                        <CRBadge variant={latestDomain.verified ? "green" : "amber"} size="sm">
                          {latestDomain.verified ? "Verified" : "Pending"}
                        </CRBadge>
                      ) : <span className="text-xs text-cr-slate">No domain</span>}
                    </td>
                    <td className="px-5 py-3">
                      <CRBadge variant={org.wl_setup_complete ? "green" : "amber"} size="sm">
                        {org.wl_setup_complete ? "Complete" : "Pending"}
                      </CRBadge>
                    </td>
                    <td className="px-5 py-3 text-xs font-body text-cr-slate">{formatDateUK(latestDomain?.created_at ?? "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CRCard>
    </div>
  );
}
