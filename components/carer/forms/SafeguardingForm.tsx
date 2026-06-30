"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

export function SafeguardingForm({ shift, clients, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [description, setDescription] = useState("");
  const [bypassLineManager, setBypassLineManager] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let gpsLat = null, gpsLng = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
    } catch { /* optional */ }

    await fetch("/api/safeguarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id, client_id: clientId,
        concern_description: description, bypass_line_manager: bypassLineManager,
        gps_lat: gpsLat, gps_lng: gpsLng,
      }),
    });

    setSubmitting(false);
    setDone(true);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="font-bold text-cr-charcoal text-lg">Safeguarding</h2>
      </div>

      <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex gap-3">
        <Shield size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Safeguarding Concern</p>
          <p className="text-xs text-amber-700 mt-1">You have a legal duty to report safeguarding concerns. This will be escalated to the Designated Safeguarding Lead immediately.</p>
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Safeguarding concern submitted</p>
          <p className="text-xs text-cr-slate text-center">The Designated Safeguarding Lead has been notified</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Describe your concern</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={6}
              placeholder="Describe what you saw, heard, or observed. Be as specific as possible — include dates, times, people involved, and exactly what was said or done."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={bypassLineManager} onChange={e => setBypassLineManager(e.target.checked)} className="rounded w-5 h-5 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Report directly to Safeguarding Lead (bypass line manager)</p>
                <p className="text-xs text-red-600 mt-1">Use this if your concern involves your line manager, or if you believe notifying them would put the client at greater risk.</p>
              </div>
            </label>
          </div>

          {bypassLineManager && (
            <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 rounded-xl">
              <AlertTriangle size={14} className="text-red-600" />
              <p className="text-xs text-red-700 font-semibold">This report will go directly to the Designated Safeguarding Lead. Your line manager will NOT be notified.</p>
            </div>
          )}

          <button type="submit" disabled={submitting || !description.trim()}
            className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Safeguarding Concern"}
          </button>
        </form>
      )}
    </div>
  );
}
