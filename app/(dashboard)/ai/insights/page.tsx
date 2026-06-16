import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { RiskFlagActions } from "@/components/ai/RiskFlagActions";
import { formatDateUK } from "@/lib/utils";
import { Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AIInsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users")
    .select("organisation_id").eq("id", user.id).single();

  const [{ data: riskFlags }, { data: briefings }] = await Promise.all([
    supabase.from("ai_risk_flags")
      .select("*, clients(first_name, last_name)")
      .eq("organisation_id", userRecord?.organisation_id)
      .in("status", ["open", "acknowledged"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("family_briefings")
      .select("*, clients(first_name, last_name)")
      .eq("organisation_id", userRecord?.organisation_id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const severityVariant = (s: string) => {
    if (s === "critical" || s === "high") return "red";
    if (s === "medium") return "amber";
    return "slate";
  };

  return (
    <div>
      <CRPageHeader
        title="AI Insights"
        subtitle="Risk flags, patterns, and AI-generated briefings"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={<CRAIBadge />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-cr-forest" />
            <h2 className="font-display text-xl font-semibold text-cr-charcoal">Active Risk Flags</h2>
            <CRBadge variant={riskFlags && riskFlags.length > 0 ? "red" : "green"}>{riskFlags?.length || 0}</CRBadge>
          </div>
          <div className="space-y-3">
            {(riskFlags || []).map((flag) => {
              const client = flag.clients as Record<string, string> | null;
              return (
                <CRCard key={String(flag.id)} hover>
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/clients/${flag.client_id}`} className="font-body font-medium text-cr-charcoal hover:text-cr-forest">
                      {client?.first_name} {client?.last_name}
                    </Link>
                    <CRBadge variant={severityVariant(String(flag.severity))} size="sm">{String(flag.severity)}</CRBadge>
                  </div>
                  <p className="text-xs font-body text-cr-slate mb-1 capitalize">{String(flag.flag_type).replace(/_/g, " ")}</p>
                  <p className="text-sm font-body text-cr-charcoal mb-3">{String(flag.description)}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-cr-slate">{formatDateUK(String(flag.created_at))}</p>
                    <RiskFlagActions flagId={String(flag.id)} status={String(flag.status)} />
                  </div>
                </CRCard>
              );
            })}
            {(!riskFlags || riskFlags.length === 0) && (
              <div className="text-center py-8">
                <Sparkles className="mx-auto mb-2 text-cr-forest" size={32} />
                <p className="text-sm text-cr-slate">No active risk flags — great work!</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-cr-forest" />
            <h2 className="font-display text-xl font-semibold text-cr-charcoal">Recent AI Briefings</h2>
          </div>
          <div className="space-y-3">
            {(briefings || []).map((b) => {
              const client = b.clients as Record<string, string> | null;
              return (
                <CRCard key={String(b.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/clients/${b.client_id}`} className="font-body font-medium text-cr-charcoal hover:text-cr-forest">
                      {client?.first_name} {client?.last_name}
                    </Link>
                    <p className="text-xs text-cr-slate">{formatDateUK(String(b.created_at))}</p>
                  </div>
                  <p className="text-sm font-body text-cr-slate line-clamp-3">{String(b.content)}</p>
                  {b.sent_at && <CRBadge variant="green" size="sm" className="mt-2">Sent to family</CRBadge>}
                </CRCard>
              );
            })}
            {(!briefings || briefings.length === 0) && (
              <p className="text-sm text-cr-slate text-center py-8">No briefings generated yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
