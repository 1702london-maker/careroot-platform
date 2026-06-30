"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Calendar } from "lucide-react";

type Incident = {
  id: string;
  incident_type: string;
  behaviour_description: string;
  antecedent: string | null;
  antecedent_trigger: string | null;
  consequence_description: string | null;
  physical_intervention_occurred: boolean;
  pi_technique: string | null;
  pi_duration_minutes: number | null;
  pi_debrief_scheduled: boolean | null;
  pi_debrief_date: string | null;
  deescalation_strategies_used: string[] | null;
  staff_wellbeing_checked: boolean;
  staff_wellbeing_check_due: string | null;
  notified_manager_at: string | null;
  server_timestamp: string;
  client: { id: string; first_name: string; last_name: string } | null;
  staff: { id: string; first_name: string; last_name: string } | null;
};

export function IncidentsDashboard({ incidents }: { incidents: unknown[] }) {
  const list = incidents as Incident[];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [debriefDate, setDebriefDate] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const piPending = list.filter(i => i.physical_intervention_occurred && !i.pi_debrief_scheduled).length;
  const wellbeingDue = list.filter(i => i.staff_wellbeing_check_due && !i.staff_wellbeing_checked && new Date(i.staff_wellbeing_check_due) < new Date()).length;

  async function scheduleDebrief(id: string) {
    const date = debriefDate[id];
    if (!date) return;
    setSaving(id);
    await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pi_debrief_scheduled: true, pi_debrief_date: date }),
    });
    setSaving(null);
    window.location.reload();
  }

  async function markWellbeingChecked(id: string) {
    setSaving(id);
    await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_wellbeing_checked: true }),
    });
    setSaving(null);
    window.location.reload();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CRPageHeader title="Incidents" subtitle="All incident reports. Schedule PI debriefs and staff wellbeing checks." />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl p-4 border text-center ${piPending > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
          <p className={`text-2xl font-bold ${piPending > 0 ? "text-red-600" : "text-cr-slate"}`}>{piPending}</p>
          <p className="text-xs text-cr-slate mt-0.5">PI Debriefs Pending</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${wellbeingDue > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
          <p className={`text-2xl font-bold ${wellbeingDue > 0 ? "text-amber-600" : "text-cr-slate"}`}>{wellbeingDue}</p>
          <p className="text-xs text-cr-slate mt-0.5">Wellbeing Checks Overdue</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
          <p className="text-sm text-cr-slate">No incidents on record</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(inc => (
            <div key={inc.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${inc.physical_intervention_occurred ? "bg-red-100" : "bg-amber-50"}`}>
                    <AlertTriangle size={18} className={inc.physical_intervention_occurred ? "text-red-600" : "text-amber-600"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm text-cr-charcoal capitalize">
                        {inc.incident_type?.replace(/_/g, " ") || "Incident"}
                      </p>
                      {inc.physical_intervention_occurred && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">PI USED</span>
                      )}
                      {inc.physical_intervention_occurred && !inc.pi_debrief_scheduled && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">DEBRIEF PENDING</span>
                      )}
                    </div>
                    <p className="text-xs text-cr-slate">
                      {inc.client ? `${inc.client.first_name} ${inc.client.last_name}` : "Unknown"} ·{" "}
                      {inc.staff ? `${inc.staff.first_name} ${inc.staff.last_name}` : "Unknown"} ·{" "}
                      {new Date(inc.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm text-cr-charcoal mt-1 line-clamp-2">{inc.behaviour_description}</p>
                  </div>
                </div>
                {expanded === inc.id ? <ChevronUp size={16} className="text-cr-slate flex-shrink-0" /> : <ChevronDown size={16} className="text-cr-slate flex-shrink-0" />}
              </div>

              {expanded === inc.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {inc.antecedent && <div><p className="text-xs font-semibold text-cr-slate mb-1">Antecedent</p><p className="text-cr-charcoal">{inc.antecedent}</p></div>}
                    {inc.antecedent_trigger && <div><p className="text-xs font-semibold text-cr-slate mb-1">Trigger</p><p className="text-cr-charcoal">{inc.antecedent_trigger}</p></div>}
                    <div><p className="text-xs font-semibold text-cr-slate mb-1">Behaviour</p><p className="text-cr-charcoal">{inc.behaviour_description}</p></div>
                    {inc.consequence_description && <div><p className="text-xs font-semibold text-cr-slate mb-1">Consequence</p><p className="text-cr-charcoal">{inc.consequence_description}</p></div>}
                    {inc.deescalation_strategies_used?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-cr-slate mb-1">De-escalation Used</p>
                        <div className="flex flex-wrap gap-1.5">
                          {inc.deescalation_strategies_used.map(d => (
                            <span key={d} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{d.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {inc.physical_intervention_occurred && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-bold text-red-700">Physical Intervention</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><p className="font-semibold text-red-600">Technique</p><p className="text-cr-charcoal">{inc.pi_technique || "—"}</p></div>
                        <div><p className="font-semibold text-red-600">Duration</p><p className="text-cr-charcoal">{inc.pi_duration_minutes ? `${inc.pi_duration_minutes} min` : "—"}</p></div>
                      </div>
                      {inc.pi_debrief_scheduled ? (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle size={14} />
                          Debrief scheduled: {inc.pi_debrief_date ? new Date(inc.pi_debrief_date).toLocaleDateString("en-GB") : "—"}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="date" value={debriefDate[inc.id] || ""}
                            onChange={e => setDebriefDate(d => ({ ...d, [inc.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none" />
                          <button onClick={() => scheduleDebrief(inc.id)} disabled={saving === inc.id || !debriefDate[inc.id]}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                            <Calendar size={12} /> Schedule Debrief
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {inc.staff_wellbeing_check_due && (
                    <div className={`border rounded-xl p-4 ${inc.staff_wellbeing_checked ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                      <p className="text-sm font-semibold mb-2 text-cr-charcoal">Staff Wellbeing Check</p>
                      {inc.staff_wellbeing_checked ? (
                        <div className="flex items-center gap-2 text-sm text-green-700"><CheckCircle size={14} /> Checked</div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-amber-700">Due: {new Date(inc.staff_wellbeing_check_due).toLocaleString("en-GB")}</p>
                          <button onClick={() => markWellbeingChecked(inc.id)} disabled={saving === inc.id}
                            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                            Mark Checked
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
