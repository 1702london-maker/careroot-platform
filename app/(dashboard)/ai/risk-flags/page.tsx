import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge, riskVariant } from "@/components/ui/CRBadge";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { Sparkles } from "lucide-react";
import { formatDateTimeUK } from "@/lib/utils";
import Link from "next/link";
import { RiskFlagActions } from "@/components/ai/RiskFlagActions";

export default async function AIRiskFlagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const { data: flags } = await supabase
    .from("ai_risk_flags")
    .select("*, clients(first_name, last_name, id)")
    .eq("organisation_id", userRecord?.organisation_id)
    .order("created_at", { ascending: false });

  const open = flags?.filter(f => f.status === "open") ?? [];
  const acknowledged = flags?.filter(f => f.status === "acknowledged") ?? [];

  return (
    <div>
      <CRPageHeader
        title="Risk Flags"
        subtitle={`${open.length} open · ${acknowledged.length} acknowledged`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Intelligence" }]}
        action={<CRAIBadge />}
      />

      {flags?.length === 0 ? (
        <CREmptyState
          icon={<Sparkles size={48} />}
          title="No risk flags"
          description="Patterns of concern will appear patterns of concern here as it analyses visit notes and care records."
        />
      ) : (
        <CRCard noPadding>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Client", "Flag type", "Severity", "Description", "Raised", "Status"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {flags?.map((flag) => {
                const client = flag.clients as Record<string, string> | null;
                return (
                  <tr key={flag.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      {client && (
                        <Link href={`/clients/${client.id}`} className="text-sm font-body font-medium text-cr-charcoal hover:text-cr-forest">
                          {client.first_name} {client.last_name}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-body text-cr-charcoal capitalize">
                        {flag.flag_type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CRBadge variant={riskVariant(flag.severity)} size="sm">
                        {flag.severity}
                      </CRBadge>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm font-body text-cr-charcoal line-clamp-2">{flag.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-body text-cr-slate">{formatDateTimeUK(flag.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <CRBadge
                          variant={flag.status === "open" ? "red" : flag.status === "acknowledged" ? "amber" : "green"}
                          size="sm"
                        >
                          {flag.status}
                        </CRBadge>
                        <RiskFlagActions flagId={String(flag.id)} status={String(flag.status)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CRCard>
      )}
    </div>
  );
}
