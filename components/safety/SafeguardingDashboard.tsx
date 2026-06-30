"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Shield, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type Concern = {
  id: string;
  concern_description: string;
  bypass_line_manager: boolean;
  status: string;
  server_timestamp: string;
  escalated_to_local_authority: boolean;
  escalated_at: string | null;
  notified_safeguarding_lead_at: string | null;
  notified_manager_at: string | null;
  client: { id: string; first_name: string; last_name: string } | null;
  staff: { id: string; first_name: string; last_name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  under_review: "bg-amber-100 text-amber-700",
  escalated: "bg-purple-100 text-purple-700",
  closed: "bg-green-100 text-green-700",
};

export function SafeguardingDashboard({ concerns }: { concerns: unknown[] }) {
  const list = concerns as Concern[];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const open = list.filter(c => c.status === "open").length;
  const underReview = list.filter(c => c.status === "under_review").length;
  const escalated = list.filter(c => c.status === "escalated").length;

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/safeguarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    window.location.reload();
  }

  async function escalateToLA(id: string) {
    if (!confirm("Escalate this concern to the Local Authority? This cannot be undone.")) return;
    setUpdating(id);
    await fetch(`/api/safeguarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "escalated", escalated_to_local_authority: true, escalated_at: new Date().toISOString() }),
    });
    setUpdating(null);
    window.location.reload();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CRPageHeader title="Safeguarding" subtitle="All safeguarding concerns raised by staff. Respond within 24 hours." />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open", count: open, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { label: "Under Review", count: underReview, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Escalated", count: escalated, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-cr-slate mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Shield size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
          <p className="text-sm text-cr-slate">No safeguarding concerns on record</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(concern => (
            <div key={concern.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === concern.id ? null : concern.id)}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${concern.bypass_line_manager ? "bg-red-100" : "bg-amber-50"}`}>
                    <Shield size={18} className={concern.bypass_line_manager ? "text-red-600" : "text-amber-600"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm text-cr-charcoal">
                        {concern.client ? `${concern.client.first_name} ${concern.client.last_name}` : "Unknown client"}
                      </p>
                      {concern.bypass_line_manager && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">BYPASSED MANAGER</span>
                      )}
                      {concern.escalated_to_local_authority && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">ESCALATED TO LA</span>
                      )}
                    </div>
                    <p className="text-xs text-cr-slate">
                      Reported by {concern.staff ? `${concern.staff.first_name} ${concern.staff.last_name}` : "Unknown"} ·{" "}
                      {new Date(concern.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm text-cr-charcoal mt-1.5 line-clamp-2">{concern.concern_description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[concern.status] || "bg-gray-100 text-gray-500"}`}>
                    {concern.status.replace(/_/g, " ")}
                  </span>
                  {expanded === concern.id ? <ChevronUp size={16} className="text-cr-slate" /> : <ChevronDown size={16} className="text-cr-slate" />}
                </div>
              </div>

              {expanded === concern.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-cr-slate mb-1">Full Description</p>
                    <p className="text-sm text-cr-charcoal whitespace-pre-wrap">{concern.concern_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-cr-slate">Safeguarding Lead Notified</p>
                      <p className="text-cr-charcoal">{concern.notified_safeguarding_lead_at ? new Date(concern.notified_safeguarding_lead_at).toLocaleString("en-GB") : "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-cr-slate">Manager Notified</p>
                      <p className="text-cr-charcoal">{concern.notified_manager_at ? new Date(concern.notified_manager_at).toLocaleString("en-GB") : "Not notified (bypassed)"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {concern.status === "open" && (
                      <button onClick={() => updateStatus(concern.id, "under_review")} disabled={updating === concern.id}
                        className="px-3 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg disabled:opacity-50">
                        Mark Under Review
                      </button>
                    )}
                    {(concern.status === "open" || concern.status === "under_review") && (
                      <>
                        {!concern.escalated_to_local_authority && (
                          <button onClick={() => escalateToLA(concern.id)} disabled={updating === concern.id}
                            className="px-3 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg disabled:opacity-50">
                            Escalate to Local Authority
                          </button>
                        )}
                        <button onClick={() => updateStatus(concern.id, "closed")} disabled={updating === concern.id}
                          className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg disabled:opacity-50">
                          Close Concern
                        </button>
                      </>
                    )}
                    {concern.status === "closed" && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle size={14} /> Closed
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
