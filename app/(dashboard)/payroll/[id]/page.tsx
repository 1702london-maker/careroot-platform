import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export default async function PayrollDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: run } = await supabase.from("payroll_runs").select("*").eq("id", params.id).eq("organisation_id", orgId).single();
  if (!run) notFound();

  const { data: summaries } = await supabase.from("payroll_carer_summary").select("*, users!payroll_carer_summary_carer_id_fkey(first_name, last_name)").eq("payroll_run_id", params.id);

  const statusMap: Record<string, string> = { draft: "bg-gray-100 text-gray-600", processing: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", exported: "bg-cr-mint text-cr-forest", paid: "bg-green-100 text-green-700" };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/payroll" className="text-cr-slate hover:text-cr-forest"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="font-body font-semibold text-xl text-cr-charcoal">
              Payroll — {new Date(run.period_start).toLocaleDateString("en-GB")} to {new Date(run.period_end).toLocaleDateString("en-GB")}
            </h1>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-body font-semibold capitalize ${statusMap[run.status] ?? "bg-gray-100"}`}>{run.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/api/payroll/${run.id}/export?format=csv`} className="flex items-center gap-1.5 text-sm font-body font-medium border border-gray-200 rounded-lg px-3 py-2 text-cr-charcoal hover:border-cr-forest transition-colors">
            <Download size={14} /> CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[["Total Gross", `£${Number(run.total_gross).toFixed(2)}`], ["Carers", String(run.total_carers)], ["Hours", `${run.total_hours}h`], ["Visits", String(run.total_visits)]].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-cr-charcoal">{v}</p>
            <p className="text-xs text-cr-slate font-body mt-1">{l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-body font-semibold text-cr-charcoal">Carer Pay Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint">
              <tr>{["Carer", "Visits", "Hours", "Miles", "Regular Pay", "Overtime", "Travel", "Gross Pay"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(summaries ?? []).map((s, i) => {
                const carer = (s.users as { first_name: string; last_name: string } | null);
                return (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 font-medium text-cr-charcoal">{carer ? `${carer.first_name} ${carer.last_name}` : "—"}</td>
                    <td className="px-4 py-3 text-cr-slate">{s.total_visits}</td>
                    <td className="px-4 py-3 text-cr-slate">{Number(s.total_hours).toFixed(2)}h</td>
                    <td className="px-4 py-3 text-cr-slate">{Number(s.total_miles).toFixed(1)}</td>
                    <td className="px-4 py-3">£{Number(s.regular_pay).toFixed(2)}</td>
                    <td className="px-4 py-3">£{Number(s.overtime_pay).toFixed(2)}</td>
                    <td className="px-4 py-3">£{Number(s.travel_pay).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-cr-charcoal">£{Number(s.gross_pay).toFixed(2)}</td>
                  </tr>
                );
              })}
              {(!summaries || summaries.length === 0) && (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-cr-slate">No carer data for this run.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
