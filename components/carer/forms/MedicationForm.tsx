"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

type MedSchedule = {
  id: string;
  medication_name: string;
  dose: string;
  route: string;
  is_controlled: boolean;
  is_prn: boolean;
  current_stock: number | null;
};

const OUTCOMES = ["administered", "refused", "omitted", "not_required"];

export function MedicationForm({ shift, clients, onBack }: Props) {
  const supabase = createClient();
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [schedules, setSchedules] = useState<MedSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MedSchedule | null>(null);
  const [outcome, setOutcome] = useState("administered");
  const [refusalReason, setRefusalReason] = useState("");
  const [prnReason, setPrnReason] = useState("");
  const [stockBefore, setStockBefore] = useState("");
  const [stockAfter, setStockAfter] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    supabase.from("medication_schedules").select("id, medication_name, dose, route, is_controlled, is_prn, current_stock")
      .eq("client_id", clientId).eq("is_active", true)
      .then(({ data }) => { setSchedules(data || []); setLoading(false); });
  }, [clientId, supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);

    await fetch("/api/medication-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        client_id: clientId,
        medication_schedule_id: selected.id,
        outcome,
        refusal_reason: outcome === "refused" ? refusalReason : null,
        prn_reason: selected.is_prn ? prnReason : null,
        stock_before: selected.is_controlled ? Number(stockBefore) : null,
        stock_after: selected.is_controlled ? Number(stockAfter) : null,
        outcome_notes: notes,
      }),
    });

    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setSelected(null); setDone(false); setOutcome("administered"); setNotes(""); setStockBefore(""); setStockAfter(""); setRefusalReason(""); setPrnReason(""); }, 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-bold text-cr-charcoal text-lg">Medication</h2>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Medication record saved</p>
        </div>
      ) : !selected ? (
        <>
          <ClientPicker clients={clients} value={clientId} onChange={v => { setClientId(v); setSelected(null); }} />
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-cr-slate" /></div>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-cr-slate text-center py-10">No active medication schedules for this client.</p>
            ) : schedules.map(med => (
              <button key={med.id} onClick={() => setSelected(med)}
                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-left flex items-start justify-between gap-3 shadow-sm">
                <div>
                  <p className="font-semibold text-sm text-cr-charcoal">{med.medication_name}</p>
                  <p className="text-xs text-cr-slate">{med.dose} · {med.route}</p>
                  <div className="flex gap-2 mt-1">
                    {med.is_controlled && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">CONTROLLED</span>}
                    {med.is_prn && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">PRN</span>}
                  </div>
                </div>
                {med.current_stock != null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${med.current_stock <= 7 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    Stock: {med.current_stock}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-cr-charcoal">{selected.medication_name}</p>
                <p className="text-xs text-cr-slate">{selected.dose} · {selected.route}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xs text-cr-slate underline">Change</button>
            </div>
            {selected.is_controlled && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-700 font-semibold">Controlled drug — stock count required</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-2">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(o => (
                <button key={o} type="button" onClick={() => setOutcome(o)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors
                    ${outcome === o ? "bg-cr-forest text-white border-cr-forest" : "bg-white text-cr-slate border-gray-200"}`}>
                  {o.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {outcome === "refused" && (
            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">Reason for refusal</label>
              <textarea required value={refusalReason} onChange={e => setRefusalReason(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
            </div>
          )}

          {selected.is_prn && (
            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">PRN reason (why given now?)</label>
              <textarea required value={prnReason} onChange={e => setPrnReason(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
            </div>
          )}

          {selected.is_controlled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cr-slate mb-1.5">Stock before</label>
                <input required type="number" value={stockBefore} onChange={e => setStockBefore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cr-slate mb-1.5">Stock after</label>
                <input required type="number" value={stockAfter} onChange={e => setStockAfter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-cr-forest text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Record"}
          </button>
        </form>
      )}
    </div>
  );
}
