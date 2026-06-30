import { createClient } from "@/lib/supabase/server";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Users, Building2, TrendingUp, Crown } from "lucide-react";

const PLAN_MRR: Record<string, number> = {
  seed: 99, grow: 349, scale: 899, enterprise: 1500,
};

export default async function SuperadminDashboard() {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalOrgs },
    { count: wlOrgs },
    { count: newThisMonth },
    { count: churnedThisMonth },
    { data: activeOrgs },
    { count: pendingApplications },
  ] = await Promise.all([
    supabase.from("organisations").select("*", { count: "exact", head: true }),
    supabase.from("organisations").select("*", { count: "exact", head: true }).eq("white_label", true),
    supabase.from("organisations").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth),
    supabase.from("organisations").select("*", { count: "exact", head: true })
      .eq("subscription_status", "canceled").gte("updated_at", startOfMonth),
    supabase.from("organisations").select("plan, subscription_status").eq("subscription_status", "active"),
    supabase.from("signup_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const mrr = (activeOrgs ?? []).reduce((sum, org) => {
    return sum + (PLAN_MRR[org.plan ?? "seed"] ?? 0);
  }, 0);

  const stats = [
    { label: "Total organisations", value: totalOrgs ?? 0, icon: <Building2 size={20} className="text-cr-forest" /> },
    { label: "White label", value: wlOrgs ?? 0, icon: <Crown size={20} className="text-cr-gold" /> },
    { label: "MRR", value: `£${mrr.toLocaleString()}`, icon: <TrendingUp size={20} className="text-cr-sage" /> },
    { label: "New this month", value: newThisMonth ?? 0, icon: <Users size={20} className="text-cr-forest" /> },
    { label: "Churned this month", value: churnedThisMonth ?? 0, icon: <Users size={20} className="text-cr-red" /> },
  ];

  return (
    <div>
      <CRPageHeader
        title="Superadmin"
        subtitle="Platform-wide metrics"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <CRCard key={s.label} className="text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <p className="font-display text-2xl font-semibold text-cr-charcoal">{s.value}</p>
            <p className="text-xs font-body text-cr-slate mt-1">{s.label}</p>
          </CRCard>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <a href="/superadmin/applications" className="cr-btn-primary px-5 py-2.5 text-sm relative">
          Access applications →
          {(pendingApplications ?? 0) > 0 && (
            <span className="ml-2 inline-flex items-center justify-center bg-cr-amber text-white text-xs rounded-full px-2 py-0.5">{pendingApplications}</span>
          )}
        </a>
        <a href="/superadmin/organisations" className="cr-btn-secondary px-5 py-2.5 text-sm">All organisations →</a>
        <a href="/superadmin/white-label" className="cr-btn-secondary px-5 py-2.5 text-sm">White label →</a>
      </div>
    </div>
  );
}
