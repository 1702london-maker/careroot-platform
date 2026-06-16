import Link from "next/link";
import { BarChart2, Users, FileText, ShieldCheck, Activity, Heart } from "lucide-react";

const REPORT_CATEGORIES = [
  {
    title: "Visit Reports",
    description: "Visit completion rates, missed visits, duration analysis, and carer punctuality.",
    icon: Activity,
    href: "/reports/visits",
    count: 12,
    colour: "bg-cr-mint text-cr-forest border-cr-forest/20",
  },
  {
    title: "Financial Reports",
    description: "Revenue, invoicing, outstanding balances, and funder-by-funder breakdown.",
    icon: BarChart2,
    href: "/reports/financial",
    count: 8,
    colour: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    title: "Compliance Reports",
    description: "MAR chart completion, incident logging, DBS expiry, and training records.",
    icon: ShieldCheck,
    href: "/reports/compliance",
    count: 10,
    colour: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    title: "Staff Reports",
    description: "Carer hours, overtime, sickness, holiday, and performance trends.",
    icon: Users,
    href: "/reports/staff",
    count: 8,
    colour: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    title: "Client Reports",
    description: "Care plan reviews, risk assessments, client outcomes, and service changes.",
    icon: Heart,
    href: "/reports/clients",
    count: 7,
    colour: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    title: "Custom Reports",
    description: "Build your own report by combining fields, filters, and date ranges.",
    icon: FileText,
    href: "/reports/visits",
    count: null,
    colour: "bg-gray-50 text-cr-charcoal border-gray-200",
    badge: "Coming soon",
  },
];

export default function ReportsDashboardPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-cr-charcoal mb-1">Reports</h1>
        <p className="text-sm text-cr-slate font-body">Analytics and reports across all areas of your care operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORT_CATEGORIES.map((cat) => {
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
                  <span className="text-xs font-body text-cr-slate">{cat.count} reports</span>
                )}
              </div>
              <h3 className="font-body font-semibold text-cr-charcoal mb-1 group-hover:text-cr-forest transition-colors">{cat.title}</h3>
              <p className="text-xs text-cr-slate leading-relaxed">{cat.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-cr-mint rounded-xl p-6 border border-cr-forest/10">
        <h2 className="font-body font-semibold text-cr-forest mb-1">Need a specific report?</h2>
        <p className="text-sm text-cr-slate font-body mb-3">All reports can be filtered by date range, carer, client, and funder. Export to CSV or PDF.</p>
        <Link href="/reports/visits" className="text-sm font-body font-medium text-cr-forest hover:underline">
          Start with Visit Reports →
        </Link>
      </div>
    </div>
  );
}
