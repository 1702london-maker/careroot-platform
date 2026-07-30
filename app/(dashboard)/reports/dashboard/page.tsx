import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart2, Users, FileText, ShieldCheck, Activity, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Category = {
  title: string;
  description: string;
  icon: typeof Activity;
  href: string;
  reports: number;
  primaryMetric: string;
  secondaryMetric: string;
  colour: string;
  badge?: string;
};

function pct(done: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((done / total) * 100)}%`;
}

function money(value: number) {
  return `GBP ${value.toFixed(2)}`;
}

export default async function ReportsDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) redirect("/login");

  const orgId = profile.organisation_id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString();

  const [
    { data: visits },
    { data: invoices },
    { data: incidents },
    { data: complaints },
    { data: staff },
    { data: clients },
    { data: carePlans },
    { data: compliance },
  ] = await Promise.all([
    supabase.from("visits").select("status").eq("organisation_id", orgId).gte("scheduled_start", thirtyDaysAgo),
    supabase.from("invoices").select("status, total, total_amount, amount_outstanding").eq("organisation_id", orgId),
    supabase.from("incidents").select("severity, status").eq("organisation_id", orgId).gte("created_at", thirtyDaysAgo),
    supabase.from("complaints").select("status").eq("organisation_id", orgId).gte("created_at", thirtyDaysAgo),
    supabase.from("users").select("id, is_active").eq("organisation_id", orgId).eq("role", "carer"),
    supabase.from("clients").select("id, status, risk_level").eq("organisation_id", orgId),
    supabase.from("care_plans").select("id, status, review_date").eq("organisation_id", orgId),
    supabase.from("staff_compliance").select("status, valid_until").eq("organisation_id", orgId),
  ]);

  const completedVisits = visits?.filter((v) => v.status === "completed").length ?? 0;
  const missedVisits = visits?.filter((v) => v.status === "missed").length ?? 0;
  const visitTotal = visits?.length ?? 0;

  const outstandingValue = (invoices ?? []).reduce((sum, inv) => {
    if (!["sent", "overdue"].includes(inv.status ?? "")) return sum;
    return sum + Number(inv.amount_outstanding ?? inv.total ?? inv.total_amount ?? 0);
  }, 0);
  const paidInvoices = invoices?.filter((i) => i.status === "paid").length ?? 0;

  const openIncidents = incidents?.filter((i) => ["open", "investigating"].includes(i.status ?? "")).length ?? 0;
  const seriousIncidents = incidents?.filter((i) => ["high", "critical"].includes(i.severity ?? "")).length ?? 0;
  const openComplaints = complaints?.filter((c) => ["open", "investigating"].includes(c.status ?? "")).length ?? 0;

  const activeStaff = staff?.filter((s) => s.is_active !== false).length ?? 0;
  const activeClients = clients?.filter((c) => !["inactive", "deceased"].includes(c.status ?? "")).length ?? 0;
  const highRiskClients = clients?.filter((c) => ["high", "critical"].includes(c.risk_level ?? "")).length ?? 0;

  const overduePlans = carePlans?.filter((p) => {
    return p.status === "active" && p.review_date && new Date(p.review_date) < new Date(today);
  }).length ?? 0;

  const expiredCompliance = compliance?.filter((c) => {
    return c.status === "expired" || (c.valid_until && new Date(c.valid_until) < new Date(today));
  }).length ?? 0;

  const reportCategories: Category[] = [
    {
      title: "Visit Reports",
      description: "Visit completion rates, missed visits, duration analysis, and carer punctuality.",
      icon: Activity,
      href: "/reports/visits",
      reports: 12,
      primaryMetric: `${pct(completedVisits, visitTotal)} completion`,
      secondaryMetric: `${missedVisits} missed in 30 days`,
      colour: "bg-cr-mint text-cr-forest border-cr-forest/20",
    },
    {
      title: "Financial Reports",
      description: "Revenue, invoicing, outstanding balances, and funder-by-funder breakdown.",
      icon: BarChart2,
      href: "/reports/financial",
      reports: 8,
      primaryMetric: `${paidInvoices} paid invoices`,
      secondaryMetric: `${money(outstandingValue)} outstanding`,
      colour: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Compliance Reports",
      description: "MAR chart completion, incident logging, DBS expiry, and training records.",
      icon: ShieldCheck,
      href: "/reports/compliance",
      reports: 10,
      primaryMetric: `${expiredCompliance} expired items`,
      secondaryMetric: `${seriousIncidents} serious incidents`,
      colour: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Staff Reports",
      description: "Carer hours, workload, attendance, retention, and burnout risk.",
      icon: Users,
      href: "/reports/staff",
      reports: 8,
      primaryMetric: `${activeStaff} active carers`,
      secondaryMetric: `${expiredCompliance} compliance actions`,
      colour: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      title: "Client Reports",
      description: "Care plan reviews, risk assessments, client outcomes, and service changes.",
      icon: Heart,
      href: "/reports/clients",
      reports: 7,
      primaryMetric: `${activeClients} active clients`,
      secondaryMetric: `${highRiskClients} high-risk clients`,
      colour: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      title: "Custom Reports",
      description: "Build your own report by combining fields, filters, and date ranges.",
      icon: FileText,
      href: "/reports/visits",
      reports: 0,
      primaryMetric: "Template builder",
      secondaryMetric: "Coming soon",
      colour: "bg-gray-50 text-cr-charcoal border-gray-200",
      badge: "Coming soon",
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-cr-charcoal mb-1">Reports</h1>
        <p className="text-sm text-cr-slate font-body">Live analytics across care delivery, people, quality and finance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Metric label="Visits 30 days" value={String(visitTotal)} detail={`${completedVisits} completed`} />
        <Metric label="Open safety items" value={String(openIncidents + openComplaints)} detail={`${openIncidents} incidents, ${openComplaints} complaints`} />
        <Metric label="Care plan reviews" value={String(overduePlans)} detail="overdue active plans" />
        <Metric label="Outstanding" value={money(outstandingValue)} detail="sent or overdue invoices" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.title}
              href={cat.href}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-cr-forest hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${cat.colour}`}>
                  <Icon size={18} />
                </div>
                {cat.badge ? (
                  <span className="text-[10px] font-body font-semibold bg-cr-gold/10 text-cr-gold border border-cr-gold/20 rounded-full px-2 py-0.5">{cat.badge}</span>
                ) : (
                  <span className="text-xs font-body text-cr-slate">{cat.reports} reports</span>
                )}
              </div>
              <h3 className="font-body font-semibold text-cr-charcoal mb-1 group-hover:text-cr-forest transition-colors">{cat.title}</h3>
              <p className="text-xs text-cr-slate leading-relaxed min-h-10">{cat.description}</p>
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-cr-charcoal">{cat.primaryMetric}</p>
                <p className="text-xs text-cr-slate">{cat.secondaryMetric}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-cr-mint rounded-xl p-6 border border-cr-forest/10">
        <h2 className="font-body font-semibold text-cr-forest mb-1">Inspection and management exports</h2>
        <p className="text-sm text-cr-slate font-body mb-3">Use the report sections to export live CSVs. CQC evidence packs also have a secured PDF export route.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/reports/visits" className="text-sm font-body font-medium text-cr-forest hover:underline">
            Visit Reports
          </Link>
          <Link href="/ai/cqc-evidence" className="text-sm font-body font-medium text-cr-forest hover:underline">
            CQC Evidence
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
      <p className="text-xs font-body text-cr-slate">{label}</p>
      <p className="font-display text-2xl text-cr-charcoal mt-1">{value}</p>
      <p className="text-xs text-cr-slate mt-1">{detail}</p>
    </div>
  );
}
