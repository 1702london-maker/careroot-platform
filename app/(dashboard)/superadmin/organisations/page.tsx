import { createClient } from "@/lib/supabase/server";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRBadge } from "@/components/ui/CRBadge";
import { Crown } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

export default async function SuperadminOrganisations() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name, plan, subscription_status, white_label, wl_package_tier, created_at")
    .order("created_at", { ascending: false });

  // Count staff and clients per org
  const orgIds = (orgs ?? []).map((o) => o.id);

  const [{ data: staffCounts }, { data: clientCounts }] = await Promise.all([
    supabase.from("users").select("organisation_id").in("organisation_id", orgIds).eq("is_active", true),
    supabase.from("clients").select("organisation_id").in("organisation_id", orgIds).eq("is_active", true),
  ]);

  const staffByOrg: Record<string, number> = {};
  const clientsByOrg: Record<string, number> = {};
  for (const u of staffCounts ?? []) staffByOrg[u.organisation_id] = (staffByOrg[u.organisation_id] ?? 0) + 1;
  for (const c of clientCounts ?? []) clientsByOrg[c.organisation_id] = (clientsByOrg[c.organisation_id] ?? 0) + 1;

  const planVariant = (plan: string) => plan === "enterprise" ? "green" : plan === "scale" ? "amber" : plan === "grow" ? "blue" : "slate";

  return (
    <div>
      <CRPageHeader title="All Organisations" subtitle={`${orgs?.length ?? 0} total`} breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]} />
      <CRCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Organisation", "Plan", "Status", "Staff", "Clients", "White Label", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(orgs ?? []).map((org) => (
                <tr key={org.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <span className="text-sm font-body font-semibold text-cr-charcoal">{org.name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <CRBadge variant={planVariant(org.plan ?? "seed") as "green" | "amber" | "slate"} size="sm" className="capitalize">
                      {org.plan ?? "seed"}
                    </CRBadge>
                  </td>
                  <td className="px-5 py-3">
                    <CRBadge
                      variant={org.subscription_status === "active" ? "green" : org.subscription_status === "trial" ? "amber" : "red"}
                      size="sm"
                    >
                      {org.subscription_status ?? "trial"}
                    </CRBadge>
                  </td>
                  <td className="px-5 py-3 text-sm font-body text-cr-charcoal">{staffByOrg[org.id] ?? 0}</td>
                  <td className="px-5 py-3 text-sm font-body text-cr-charcoal">{clientsByOrg[org.id] ?? 0}</td>
                  <td className="px-5 py-3">
                    {org.white_label ? (
                      <div className="flex items-center gap-1.5">
                        <Crown size={14} className="text-cr-gold" />
                        <span className="text-xs font-body text-cr-charcoal capitalize">{org.wl_package_tier ?? "basic"}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-cr-slate">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs font-body text-cr-slate">{formatDateUK(org.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CRCard>
    </div>
  );
}
