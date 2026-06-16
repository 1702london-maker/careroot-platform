import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { Plus, Eye, Download } from "lucide-react";
import type { PayrollRun } from "@/types";

function fmtGBP(n: number) { return `£${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }

function statusBadge(status: PayrollRun["status"]) {
  const map: Record<string, string> = { draft: "bg-gray-100 text-gray-600", processing: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", exported: "bg-cr-mint text-cr-forest", paid: "bg-green-100 text-green-700" };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-body font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export default async function PayrollPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: runs } = await supabase.from("payroll_runs").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(20);
  const payrollRuns = (runs ?? []) as PayrollRun[];
  const lastRun = payrollRuns[0];

  return (
    <div>
      <CRPageHeader
        title="Payroll"
        subtitle="Calculate and manage carer pay"
        action={
          <Link href="/payroll/new" className="flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors">
            <Plus size={16} /> Run Payroll
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CRStatCard label="Total Gross (Last Run)" value={lastRun ? fmtGBP(lastRun.total_gross) : "—"} />
        <CRStatCard label="Carers (Last Run)" value={lastRun ? String(lastRun.total_carers) : "—"} />
        <CRStatCard label="Hours (Last Run)" value={lastRun ? `${lastRun.total_hours}h` : "—"} />
        <CRStatCard label="Total Runs" value={String(payrollRuns.length)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-body font-semibold text-cr-charcoal">Payroll History</h2>
          <Link href="/payroll/settings" className="text-xs font-body text-cr-slate hover:text-cr-forest transition-colors">Pay Settings</Link>
        </div>

        {payrollRuns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-cr-slate font-body mb-4">No payroll runs yet.</p>
            <Link href="/payroll/new" className="bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cr-sage transition-colors">Run first payroll</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-cr-mint">
                <tr>{["Period", "Status", "Carers", "Hours", "Total Gross", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payrollRuns.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 text-cr-charcoal font-medium">{new Date(r.period_start).toLocaleDateString("en-GB")} — {new Date(r.period_end).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-cr-slate">{r.total_carers}</td>
                    <td className="px-4 py-3 text-cr-slate">{r.total_hours}h</td>
                    <td className="px-4 py-3 font-medium text-cr-charcoal">{fmtGBP(r.total_gross)}</td>
                    <td className="px-4 py-3 text-cr-slate text-xs">{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/payroll/${r.id}`} className="p-1.5 rounded hover:bg-cr-mint text-cr-forest transition-colors" title="View"><Eye size={14} /></Link>
                        <a href={`/api/payroll/${r.id}/export?format=csv`} className="p-1.5 rounded hover:bg-cr-mint text-cr-forest transition-colors" title="Export CSV"><Download size={14} /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
