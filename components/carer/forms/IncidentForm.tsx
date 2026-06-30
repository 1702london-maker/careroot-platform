"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

const INCIDENT_TYPES = ["fall", "behaviour", "medical_emergency", "near_miss", "property_damage", "other"];
const DEESCALATION = ["verbal_redirection", "distraction", "space_giving", "sensory_support", "music", "movement", "other"];

export function IncidentForm({ shift, clients, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [incidentType, setIncidentType] = useState("behaviour");
  const [antecedent, setAntecedent] = useState("");
  const [antecedentTrigger, setAntecedentTrigger] = useState("");
  const [behaviourDescription, setBehaviourDescription] = useState("");
  const [consequenceDescription, setConsequenceDescription] = useState("");
  const [piOccurred, setPiOccurred] = useState(false);
  const [piTechnique, setPiTechnique] = useState("");
  const [piDuration, setPiDuration] = useState("");
  const [deescalation, setDeescalation] = useState<string[]>([]);
  const [staffWellbeing, setStaffWellbeing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function toggleDeescalation(item: string) {
    setDeescalation(d => d.includes(item) ? d.filter(x => x !== item) : [...d, item]);
  }

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

    await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id, client_id: clientId, incident_type: incidentType,
        antecedent, antecedent_trigger: antecedentTrigger,
        behaviour_description: behaviourDescription, consequence_description: consequenceDescription,
        physical_intervention_occurred: piOccurred,
        pi_technique: piOccurred ? piTechnique : null,
        pi_duration_minutes: piOccurred && piDuration ? Number(piDuration) : null,
        deescalation_strategies_used: deescalation,
        staff_wellbeing_checked: staffWellbeing,
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
        <h2 className="font-bold text-cr-charcoal text-lg">Report Incident</h2>
      </div>

      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
        <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">Your manager will be notified immediately. Complete all sections accurately.</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Incident report submitted</p>
          <p className="text-xs text-cr-slate text-center">Your manager has been notified</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-2">Incident Type</label>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setIncidentType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors
                    ${incidentType === t ? "bg-red-600 text-white border-red-600" : "bg-white text-cr-slate border-gray-200"}`}>
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* ABC Framework */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            <p className="text-xs font-bold text-cr-charcoal">ABC Framework</p>

            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">A — Antecedent (what happened before?)</label>
              <textarea required value={antecedent} onChange={e => setAntecedent(e.target.value)} rows={2}
                placeholder="What was happening before the incident?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">Trigger (if known)</label>
              <input value={antecedentTrigger} onChange={e => setAntecedentTrigger(e.target.value)}
                placeholder="Known trigger or suspected cause"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">B — Behaviour (what happened?)</label>
              <textarea required value={behaviourDescription} onChange={e => setBehaviourDescription(e.target.value)} rows={3}
                placeholder="Describe exactly what occurred"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">C — Consequence (outcome?)</label>
              <textarea required value={consequenceDescription} onChange={e => setConsequenceDescription(e.target.value)} rows={2}
                placeholder="What happened as a result?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none bg-white" />
            </div>
          </div>

          {/* De-escalation */}
          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-2">De-escalation strategies used</label>
            <div className="grid grid-cols-2 gap-2">
              {DEESCALATION.map(d => (
                <button key={d} type="button" onClick={() => toggleDeescalation(d)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors
                    ${deescalation.includes(d) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-cr-slate border-gray-200"}`}>
                  {d.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Intervention */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" checked={piOccurred} onChange={e => setPiOccurred(e.target.checked)} className="rounded w-5 h-5" />
              <span className="text-sm font-bold text-red-700">Physical intervention was used</span>
            </label>
            {piOccurred && (
              <div className="space-y-3">
                <input required value={piTechnique} onChange={e => setPiTechnique(e.target.value)}
                  placeholder="Technique used (e.g. guided movement)"
                  className="w-full px-4 py-3 rounded-xl border border-red-200 text-sm focus:outline-none bg-white" />
                <input required type="number" value={piDuration} onChange={e => setPiDuration(e.target.value)}
                  placeholder="Duration (minutes)"
                  className="w-full px-4 py-3 rounded-xl border border-red-200 text-sm focus:outline-none bg-white" />
                <p className="text-xs text-red-600 font-semibold">PI must be debriefed within 24 hours. Your manager will schedule this.</p>
              </div>
            )}
          </div>

          {/* Staff wellbeing */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-gray-100 rounded-2xl">
            <input type="checkbox" checked={staffWellbeing} onChange={e => setStaffWellbeing(e.target.checked)} className="rounded w-5 h-5" />
            <span className="text-sm font-semibold text-cr-charcoal">I have checked in on my own wellbeing following this incident</span>
          </label>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Incident Report"}
          </button>
        </form>
      )}
    </div>
  );
}
