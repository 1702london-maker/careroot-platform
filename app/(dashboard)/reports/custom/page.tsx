import { redirect } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type ReportBlock = {
  title: string;
  description: string;
  href: string;
  rows: Record<string, string | number>[];
};

function csvUrl(rows: Record<string, string | number>[]) {
  if (!rows.length) return "#";
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function dateOnly(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB");
}

export default async function CustomReportsPage() {
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

  const [
    { data: clients },
    { data: visits },
    { data: staff },
    { data: compliance },
    { data: incidents },
    { data: complaints },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("clients").select("first_name, last_name, status, risk_level, created_at").eq("organisation_id", orgId).order("last_name"),
    supabase.from("visits").select("scheduled_start, status, actual_start, actual_end, clients(first_name,last_name), users!visits_carer_id_fkey(first_name,last_name)").eq("organisation_id", orgId).gte("scheduled_start", thirtyDaysAgo).order("scheduled_start", { ascending: false }).limit(50),
    supabase.from("users").select("first_name, last_name, email, role, is_active, created_at").eq("organisation_id", orgId).order("last_name"),
    supabase.from("staff_compliance").select("compliance_item, status, valid_until, users!staff_id(first_name,last_name)").eq("organisation_id", orgId).order("valid_until", { ascending: true }).limit(50),
    supabase.from("incidents").select("title, severity, status, reported_at, created_at, clients(first_name,last_name)").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(50),
    supabase.from("complaints").select("title, category, severity, status, created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(50),
    supabase.from("invoices").select("invoice_number, status, total, total_amount, amount_outstanding, due_date, created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(50),
  ]);

  const blocks: ReportBlock[] = [
    {
      title: "Client Register",
      description: "All current clients with risk and status for management review.",
      href: "careroot-client-register.csv",
      rows: (clients ?? []).map((c) => ({
        Client: `${c.first_name} ${c.last_name}`,
        Status: c.status ?? "",
        Risk: c.risk_level ?? "",
        Added: dateOnly(c.created_at),
      })),
    },
    {
      title: "Recent Visits",
      description: "Last 30 days of scheduled care activity with staff and client context.",
      href: "careroot-recent-visits.csv",
      rows: (visits ?? []).map((v) => {
        const client = Array.isArray(v.clients) ? v.clients[0] : v.clients;
        const carer = Array.isArray(v.users) ? v.users[0] : v.users;
        return {
          Date: dateOnly(v.scheduled_start),
          Client: client ? `${client.first_name} ${client.last_name}` : "",
          Staff: carer ? `${carer.first_name} ${carer.last_name}` : "",
          Status: v.status ?? "",
          "Actual Start": dateOnly(v.actual_start),
          "Actual End": dateOnly(v.actual_end),
        };
      }),
    },
    {
      title: "Staff Register",
      description: "Staff, admin and management users in this organisation.",
      href: "careroot-staff-register.csv",
      rows: (staff ?? []).map((s) => ({
        Name: `${s.first_name} ${s.last_name}`,
        Email: s.email ?? "",
        Role: s.role ?? "",
        Active: s.is_active === false ? "No" : "Yes",
        Added: dateOnly(s.created_at),
      })),
    },
    {
      title: "Compliance Actions",
      description: "Staff compliance records ordered by earliest expiry.",
      href: "careroot-compliance-actions.csv",
      rows: (compliance ?? []).map((c) => {
        const member = Array.isArray(c.users) ? c.users[0] : c.users;
        return {
          Staff: member ? `${member.first_name} ${member.last_name}` : "",
          Item: c.compliance_item ?? "",
          Status: c.status ?? "",
          "Valid Until": dateOnly(c.valid_until),
        };
      }),
    },
    {
      title: "Incidents And Complaints",
      description: "Safety, quality and complaint records for review meetings.",
      href: "careroot-incidents-complaints.csv",
      rows: [
        ...(incidents ?? []).map((i) => {
          const client = Array.isArray(i.clients) ? i.clients[0] : i.clients;
          return {
            Type: "Incident",
            Title: i.title ?? "",
            Client: client ? `${client.first_name} ${client.last_name}` : "",
            Category: i.severity ?? "",
            Status: i.status ?? "",
            Date: dateOnly(i.reported_at ?? i.created_at),
          };
        }),
        ...(complaints ?? []).map((c) => ({
          Type: "Complaint",
          Title: c.title ?? "",
          Client: "",
          Category: c.category ?? c.severity ?? "",
          Status: c.status ?? "",
          Date: dateOnly(c.created_at),
        })),
      ],
    },
    {
      title: "Invoice Snapshot",
      description: "Latest invoices with totals, outstanding value and due dates.",
      href: "careroot-invoice-snapshot.csv",
      rows: (invoices ?? []).map((i) => ({
        Invoice: i.invoice_number ?? "",
        Status: i.status ?? "",
        Total: Number(i.total ?? i.total_amount ?? 0).toFixed(2),
        Outstanding: Number(i.amount_outstanding ?? 0).toFixed(2),
        Due: dateOnly(i.due_date),
      })),
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-cr-charcoal">Custom Reports</h1>
        <p className="text-sm text-cr-slate font-body mt-0.5">Live export packs for management, audits and weekly checks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {blocks.map((block) => (
          <section key={block.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg border border-cr-forest/20 bg-cr-mint text-cr-forest flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="font-body font-semibold text-cr-charcoal">{block.title}</h2>
                  <p className="text-xs text-cr-slate mt-0.5 leading-relaxed">{block.description}</p>
                </div>
              </div>
              <a
                href={csvUrl(block.rows)}
                download={block.href}
                className={`text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  block.rows.length ? "hover:border-cr-forest text-cr-forest" : "opacity-50 pointer-events-none"
                }`}
              >
                <Download size={12} />
                Export
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="bg-cr-mint">
                  <tr>
                    {(Object.keys(block.rows[0] ?? { Status: "" })).map((header) => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cr-slate">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {block.rows.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-3 py-2.5 text-cr-charcoal">{value}</td>
                      ))}
                    </tr>
                  ))}
                  {!block.rows.length && (
                    <tr>
                      <td className="px-3 py-8 text-center text-xs text-cr-slate">No records yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {block.rows.length > 5 && <p className="mt-3 text-xs text-cr-slate">Showing 5 of {block.rows.length}. Export CSV for the full set.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
