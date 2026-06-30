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

const LOG_TYPES = ["general", "personal_care", "mobility", "social", "health_observation", "behaviour", "other"];

export function ShiftLogForm({ shift, clients, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [logType, setLogType] = useState("general");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let gpsLat = null, gpsLng = null, withinRadius = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;

      const client = clients.find(c => c.id === clientId);
      if (client?.gps_lat && client?.gps_lng) {
        const R = 6371000;
        const dLat = ((Number(client.gps_lat) - gpsLat) * Math.PI) / 180;
        const dLng = ((Number(client.gps_lng) - gpsLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((gpsLat * Math.PI) / 180) * Math.cos((Number(client.gps_lat) * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        withinRadius = dist <= (Number(client.approved_radius_metres) || 300);
      }
    } catch { /* GPS optional */ }

    await fetch("/api/shift-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        client_id: clientId,
        log_type: logType,
        content,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        within_approved_radius: withinRadius,
      }),
    });

    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setContent(""); setDone(false); }, 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-bold text-cr-charcoal text-lg">Shift Log</h2>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Log saved</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Log Type</label>
            <div className="grid grid-cols-2 gap-2">
              {LOG_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setLogType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors capitalize
                    ${logType === t ? "bg-cr-forest text-white border-cr-forest" : "bg-white text-cr-slate border-gray-200"}`}>
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Notes</label>
            <textarea
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Describe what happened during this part of the shift..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none"
            />
          </div>

          <button type="submit" disabled={submitting || !content.trim()}
            className="w-full py-4 bg-cr-forest text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Log"}
          </button>
        </form>
      )}
    </div>
  );
}
