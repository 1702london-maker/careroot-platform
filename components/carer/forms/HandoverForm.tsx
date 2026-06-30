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

export function HandoverForm({ shift, clients, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [currentStatus, setCurrentStatus] = useState("");
  const [keyEvents, setKeyEvents] = useState("");
  const [nutritionSummary, setNutritionSummary] = useState("");
  const [medicationSummary, setMedicationSummary] = useState("");
  const [actionsForIncoming, setActionsForIncoming] = useState("");
  const [triggersThisShift, setTriggersThisShift] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/handover-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        client_id: clientId,
        current_status: currentStatus,
        key_events: keyEvents,
        nutrition_summary: nutritionSummary,
        medication_summary: medicationSummary,
        actions_for_incoming_worker: actionsForIncoming,
        triggers_activated_this_shift: triggersThisShift,
      }),
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="font-bold text-cr-charcoal text-lg">Handover Note</h2>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700">This handover will be reviewed by your manager before the incoming worker can read it. Raw shift logs are never shared.</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Handover submitted</p>
          <p className="text-xs text-cr-slate text-center">Awaiting manager approval before incoming worker receives it</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Current status of client</label>
            <textarea required value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} rows={2}
              placeholder="How is the client right now? Overall presentation?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Key events this shift</label>
            <textarea value={keyEvents} onChange={e => setKeyEvents(e.target.value)} rows={3}
              placeholder="Any significant events, behaviours, or observations"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Nutrition summary</label>
            <textarea value={nutritionSummary} onChange={e => setNutritionSummary(e.target.value)} rows={2}
              placeholder="What was eaten/drunk, any concerns"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Medication summary</label>
            <textarea value={medicationSummary} onChange={e => setMedicationSummary(e.target.value)} rows={2}
              placeholder="What was given, any refusals, stock levels"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Actions for incoming worker</label>
            <textarea value={actionsForIncoming} onChange={e => setActionsForIncoming(e.target.value)} rows={3}
              placeholder="What does the next worker need to do or be aware of?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Triggers observed this shift</label>
            <textarea value={triggersThisShift} onChange={e => setTriggersThisShift(e.target.value)} rows={2}
              placeholder="Any known triggers that were activated or observed?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <button type="submit" disabled={submitting || !currentStatus.trim()}
            className="w-full py-4 bg-cr-forest text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Handover"}
          </button>
        </form>
      )}
    </div>
  );
}
