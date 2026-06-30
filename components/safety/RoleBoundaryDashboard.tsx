"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { AlertTriangle, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

type Violation = {
  id: string;
  requested_task: string;
  requested_by: string;
  worker_response: string;
  server_timestamp: string;
  notification_sent_at: string | null;
  client: { first_name: string; last_name: string } | null;
  staff: { first_name: string; last_name: string } | null;
};

type VerbalAbuse = {
  id: string;
  perpetrator: string;
  description: string;
  resolved: boolean;
  server_timestamp: string;
  client: { first_name: string; last_name: string } | null;
  staff: { first_name: string; last_name: string } | null;
};

export function RoleBoundaryDashboard({ violations, verbalAbuse }: { violations: unknown[]; verbalAbuse: unknown[] }) {
  const vList = violations as Violation[];
  const aList = verbalAbuse as VerbalAbuse[];
  const [tab, setTab] = useState<"violations" | "abuse">("violations");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  async function resolveAbuse(id: string) {
    setResolving(id);
    await fetch(`/api/verbal-abuse/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    setResolving(null);
    window.location.reload();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CRPageHeader title="Role Boundaries & Safety" subtitle="Track role boundary violations and verbal/physical abuse reports." />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("violations")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "violations" ? "bg-cr-forest text-white" : "bg-white text-cr-slate border border-gray-200"}`}>
          Boundary Violations ({vList.length})
        </button>
        <button onClick={() => setTab("abuse")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "abuse" ? "bg-cr-forest text-white" : "bg-white text-cr-slate border border-gray-200"}`}>
          Verbal Abuse Reports ({aList.filter(a => !a.resolved).length} open)
        </button>
      </div>

      {tab === "violations" && (
        vList.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <AlertTriangle size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
            <p className="text-sm text-cr-slate">No role boundary violations reported</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vList.map(v => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-cr-charcoal">
                        {v.staff ? `${v.staff.first_name} ${v.staff.last_name}` : "Unknown"}
                        <span className="text-cr-slate font-normal"> was asked to </span>
                        {v.requested_task}
                      </p>
                      <p className="text-xs text-cr-slate mt-0.5">
                        {v.client ? `Client: ${v.client.first_name} ${v.client.last_name}` : ""} ·{" "}
                        {new Date(v.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  {expanded === v.id ? <ChevronUp size={16} className="text-cr-slate flex-shrink-0" /> : <ChevronDown size={16} className="text-cr-slate flex-shrink-0" />}
                </div>
                {expanded === v.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3 text-sm">
                    <div><p className="text-xs font-semibold text-cr-slate mb-1">Requested by</p><p>{v.requested_by}</p></div>
                    <div><p className="text-xs font-semibold text-cr-slate mb-1">Worker&apos;s response</p><p>{v.worker_response}</p></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "abuse" && (
        aList.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <MessageSquare size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
            <p className="text-sm text-cr-slate">No verbal abuse reports on record</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aList.map(a => (
              <div key={a.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${a.resolved ? "opacity-60 border-gray-100" : "border-red-100"}`}>
                <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.resolved ? "bg-gray-100" : "bg-red-50"}`}>
                      <MessageSquare size={18} className={a.resolved ? "text-cr-slate" : "text-red-600"} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-cr-charcoal">
                        {a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : "Unknown"} — abuse by {a.perpetrator}
                      </p>
                      <p className="text-xs text-cr-slate mt-0.5">
                        {a.client ? `${a.client.first_name} ${a.client.last_name}` : ""} ·{" "}
                        {new Date(a.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm text-cr-charcoal mt-1 line-clamp-2">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.resolved && <span className="text-xs text-green-700 font-semibold">Resolved</span>}
                    {expanded === a.id ? <ChevronUp size={16} className="text-cr-slate" /> : <ChevronDown size={16} className="text-cr-slate" />}
                  </div>
                </div>
                {expanded === a.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div><p className="text-xs font-semibold text-cr-slate mb-1">Full description</p><p className="text-sm text-cr-charcoal whitespace-pre-wrap">{a.description}</p></div>
                    {!a.resolved && (
                      <button onClick={() => resolveAbuse(a.id)} disabled={resolving === a.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                        <CheckCircle size={12} /> Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
