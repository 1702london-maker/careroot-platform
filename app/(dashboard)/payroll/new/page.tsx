"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

type Carer = { id: string; first_name: string; last_name: string; role: string };
type CarerSummary = {
  carer_id: string; first_name: string; last_name: string;
  total_visits: number; total_hours: number; total_miles: number;
  regular_pay: number; overtime_pay: number; travel_pay: number; gross_pay: number;
  visit_breakdown: { date: string; client: string; hours: number; pay: number }[];
};

const QUICK_PERIODS: { label: string; fn: () => { start: string; end: string } }[] = [
  { label: "Last week", fn: () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7; const start = new Date(d.setDate(diff)); const end = new Date(start); end.setDate(end.getDate() + 6); return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] }; } },
  { label: "Last month", fn: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth() - 1, 1); const e = new Date(d.getFullYear(), d.getMonth(), 0); return { start: s.toISOString().split("T")[0], end: e.toISOString().split("T")[0] }; } },
];

export default function NewPayrollPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState("");
  const [carers, setCarers] = useState<Carer[]>([]);
  const [selectedCarers, setSelectedCarers] = useState<Set<string>>(new Set());
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summaries, setSummaries] = useState<CarerSummary[]>([]);
  const [expandedCarer, setExpandedCarer] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("organisation_id").eq("id", user.id).single().then(({ data }) => {
        setOrgId(data?.organisation_id ?? "");
        supabase.from("users").select("id, first_name, last_name, role").eq("organisation_id", data?.organisation_id).eq("is_active", true).in("role", ["carer"]).then(({ data: c }) => {
          const cs = (c ?? []) as Carer[];
          setCarers(cs);
          setSelectedCarers(new Set(cs.map((c) => c.id)));
        });
      });
    });
  }, []);

  const applyQuickPeriod = (idx: number) => {
    const { start, end } = QUICK_PERIODS[idx].fn();
    setPeriodStart(start); setPeriodEnd(end);
  };

  const calculate = async () => {
    setCalculating(true);
    const res = await fetch("/api/payroll/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organisation_id: orgId, period_start: periodStart, period_end: periodEnd, carer_ids: Array.from(selectedCarers) }),
    });
    const data = await res.json();
    setSummaries(data.summaries ?? []);
    setStep(3);
    setCalculating(false);
  };

  const save = async (approve = false) => {
    setSaving(true);
    const totalGross = summaries.reduce((s, c) => s + c.gross_pay, 0);
    const totalHours = summaries.reduce((s, c) => s + c.total_hours, 0);
    const totalVisits = summaries.reduce((s, c) => s + c.total_visits, 0);
    const { data: run } = await supabase.from("payroll_runs").insert({
      organisation_id: orgId, period_start: periodStart, period_end: periodEnd,
      status: approve ? "approved" : "draft",
      total_gross: totalGross, total_carers: summaries.length,
      total_hours: totalHours, total_visits: totalVisits,
    }).select().single();
    if (run) {
      await supabase.from("payroll_carer_summary").insert(summaries.map((s) => ({
        payroll_run_id: run.id, carer_id: s.carer_id, organisation_id: orgId,
        total_visits: s.total_visits, total_hours: s.total_hours, total_miles: s.total_miles,
        regular_pay: s.regular_pay, overtime_pay: s.overtime_pay, travel_pay: s.travel_pay,
        gross_pay: s.gross_pay, visit_breakdown: s.visit_breakdown,
      })));
      router.push(`/payroll/${run.id}`);
    }
    setSaving(false);
  };

  const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-cr-forest";
  const totalGross = summaries.reduce((s, c) => s + c.gross_pay, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push("/payroll")} className="text-cr-slate hover:text-cr-forest"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="font-body font-semibold text-xl text-cr-charcoal">New Payroll Run</h1>
          <p className="text-sm text-cr-slate">Step {step} of 3</p>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-body font-semibold text-cr-charcoal">Select Pay Period</h2>
          <div className="flex gap-2 flex-wrap">
            {QUICK_PERIODS.map((p, i) => (
              <button key={i} onClick={() => applyQuickPeriod(i)} className="text-xs font-body font-medium border border-gray-200 rounded-full px-3 py-1.5 hover:border-cr-forest hover:text-cr-forest transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-medium text-cr-slate mb-1">Period start</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputCls + " w-full"} />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-cr-slate mb-1">Period end</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputCls + " w-full"} />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!periodStart || !periodEnd}
            className="bg-cr-forest text-white px-5 py-2.5 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors disabled:opacity-50">
            Next — Select carers
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-body font-semibold text-cr-charcoal">Select Carers</h2>
            <div className="flex gap-3 text-xs font-body">
              <button onClick={() => setSelectedCarers(new Set(carers.map((c) => c.id)))} className="text-cr-forest hover:underline">Select all</button>
              <button onClick={() => setSelectedCarers(new Set())} className="text-cr-slate hover:text-cr-forest">Deselect all</button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {carers.map((c) => (
              <label key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedCarers.has(c.id)} onChange={(e) => {
                  const s = new Set(selectedCarers);
                  e.target.checked ? s.add(c.id) : s.delete(c.id);
                  setSelectedCarers(s);
                }} className="w-4 h-4 accent-cr-forest" />
                <span className="font-body text-sm text-cr-charcoal">{c.first_name} {c.last_name}</span>
                <span className="text-xs text-cr-slate capitalize">{c.role}</span>
              </label>
            ))}
            {carers.length === 0 && <p className="text-center py-10 text-sm text-cr-slate">No active carers found.</p>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <button onClick={calculate} disabled={selectedCarers.size === 0 || calculating}
              className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors disabled:opacity-50">
              {calculating ? <><Loader2 size={14} className="animate-spin" /> Calculating…</> : `Calculate pay for ${selectedCarers.size} carer${selectedCarers.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[["Carers", summaries.length], ["Hours", summaries.reduce((s,c) => s + c.total_hours, 0).toFixed(1) + "h"], ["Visits", summaries.reduce((s,c) => s + c.total_visits, 0)], ["Total Gross", `£${totalGross.toFixed(2)}`]].map(([label, value]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-cr-charcoal">{value}</p>
                <p className="text-xs text-cr-slate font-body mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-body font-semibold text-cr-charcoal">Carer Breakdown</h2>
            </div>
            <table className="w-full text-sm font-body">
              <thead className="bg-cr-mint">
                <tr>{["Carer", "Visits", "Hours", "Regular Pay", "Overtime", "Travel", "Gross Pay", ""].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summaries.map((s) => (
                  <>
                    <tr key={s.carer_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-cr-charcoal">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-3 text-cr-slate">{s.total_visits}</td>
                      <td className="px-4 py-3 text-cr-slate">{s.total_hours.toFixed(2)}h</td>
                      <td className="px-4 py-3">£{s.regular_pay.toFixed(2)}</td>
                      <td className="px-4 py-3">£{s.overtime_pay.toFixed(2)}</td>
                      <td className="px-4 py-3">£{s.travel_pay.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-cr-charcoal">£{s.gross_pay.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedCarer(expandedCarer === s.carer_id ? null : s.carer_id)} className="text-cr-forest hover:opacity-70">
                          {expandedCarer === s.carer_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedCarer === s.carer_id && (
                      <tr key={s.carer_id + "-expanded"}>
                        <td colSpan={8} className="px-8 pb-4 bg-gray-50">
                          <table className="w-full text-xs font-body mt-2">
                            <thead><tr className="text-cr-slate">{["Date", "Client", "Hours", "Pay"].map((h) => <th key={h} className="text-left pb-1">{h}</th>)}</tr></thead>
                            <tbody>
                              {s.visit_breakdown.map((v, i) => <tr key={i} className="border-t border-gray-100"><td className="py-1.5 text-cr-slate">{v.date}</td><td className="py-1.5 text-cr-charcoal">{v.client}</td><td className="py-1.5 text-cr-slate">{v.hours}h</td><td className="py-1.5 text-cr-charcoal">£{v.pay.toFixed(2)}</td></tr>)}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button onClick={() => save(false)} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium border border-cr-forest text-cr-forest hover:bg-cr-mint transition-colors disabled:opacity-50">
              Save as Draft
            </button>
            <button onClick={() => save(true)} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium bg-cr-forest text-white hover:bg-cr-sage transition-colors disabled:opacity-50">
              {saving ? <><Loader2 size={14} className="animate-spin inline mr-2" />Saving…</> : "Approve Payroll"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
