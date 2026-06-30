"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

const MEAL_TYPES = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack", "supplement"];

export function NutritionForm({ shift, clients, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [mealType, setMealType] = useState("lunch");
  const [offered, setOffered] = useState("");
  const [consumed, setConsumed] = useState("");
  const [fluidMl, setFluidMl] = useState("");
  const [concerns, setConcerns] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/nutrition-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id, client_id: clientId, meal_type: mealType,
        offered, consumed, fluid_intake_ml: fluidMl ? Number(fluidMl) : null, concerns,
      }),
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setOffered(""); setConsumed(""); setFluidMl(""); setConcerns(""); setDone(false); }, 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="font-bold text-cr-charcoal text-lg">Nutrition</h2>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Nutrition record saved</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-2">Meal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(m => (
                <button key={m} type="button" onClick={() => setMealType(m)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors
                    ${mealType === m ? "bg-cr-forest text-white border-cr-forest" : "bg-white text-cr-slate border-gray-200"}`}>
                  {m.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">What was offered</label>
            <input value={offered} onChange={e => setOffered(e.target.value)} placeholder="e.g. Chicken soup, bread"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">What was consumed</label>
            <input value={consumed} onChange={e => setConsumed(e.target.value)} placeholder="e.g. Half portion, refused bread"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Fluid intake (ml)</label>
            <input type="number" value={fluidMl} onChange={e => setFluidMl(e.target.value)} placeholder="e.g. 250"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Concerns / notes</label>
            <textarea value={concerns} onChange={e => setConcerns(e.target.value)} rows={3}
              placeholder="Any swallowing difficulties, refusals, changes in appetite..."
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
