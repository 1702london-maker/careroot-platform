"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { ArrowRightLeft, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type Handover = {
  id: string;
  current_status: string;
  key_events: string | null;
  nutrition_summary: string | null;
  medication_summary: string | null;
  actions_for_incoming_worker: string | null;
  triggers_activated_this_shift: string | null;
  outgoing_approved_at: string | null;
  incoming_read_confirmed_at: string | null;
  server_timestamp: string;
  client: { first_name: string; last_name: string } | null;
  outgoing_staff: { first_name: string; last_name: string } | null;
  incoming_staff: { first_name: string; last_name: string } | null;
};

export function HandoverApprovals({ handovers }: { handovers: unknown[] }) {
  const list = handovers as Handover[];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const pending = list.filter(h => !h.outgoing_approved_at).length;

  async function approve(id: string) {
    setApproving(id);
    await fetch(`/api/handover-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outgoing_approved_at: new Date().toISOString() }),
    });
    setApproving(null);
    window.location.reload();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CRPageHeader title="Handover Approvals" subtitle="Review and approve handover notes before the incoming worker can read them." />

      {pending > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-700">
          <Clock size={16} /> {pending} handover{pending > 1 ? "s" : ""} awaiting your approval
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <ArrowRightLeft size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
          <p className="text-sm text-cr-slate">No handover notes submitted</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(h => (
            <div key={h.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${!h.outgoing_approved_at ? "border-amber-200" : "border-gray-100"}`}>
              <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${h.outgoing_approved_at ? "bg-green-50" : "bg-amber-50"}`}>
                    <ArrowRightLeft size={18} className={h.outgoing_approved_at ? "text-green-600" : "text-amber-600"} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-cr-charcoal">
                      {h.client ? `${h.client.first_name} ${h.client.last_name}` : "Unknown client"}
                    </p>
                    <p className="text-xs text-cr-slate mt-0.5">
                      {h.outgoing_staff ? `${h.outgoing_staff.first_name} ${h.outgoing_staff.last_name}` : "Unknown"} →{" "}
                      {h.incoming_staff ? `${h.incoming_staff.first_name} ${h.incoming_staff.last_name}` : "Next worker"} ·{" "}
                      {new Date(h.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm text-cr-charcoal mt-1 line-clamp-1">{h.current_status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {h.outgoing_approved_at
                    ? <span className="text-xs text-green-700 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Approved</span>
                    : <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>
                  }
                  {expanded === h.id ? <ChevronUp size={16} className="text-cr-slate" /> : <ChevronDown size={16} className="text-cr-slate" />}
                </div>
              </div>

              {expanded === h.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  {[
                    { label: "Current Status", value: h.current_status },
                    { label: "Key Events", value: h.key_events },
                    { label: "Nutrition", value: h.nutrition_summary },
                    { label: "Medication", value: h.medication_summary },
                    { label: "Actions for Incoming Worker", value: h.actions_for_incoming_worker },
                    { label: "Triggers This Shift", value: h.triggers_activated_this_shift },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label}>
                      <p className="text-xs font-semibold text-cr-slate mb-1">{f.label}</p>
                      <p className="text-sm text-cr-charcoal whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))}

                  {!h.outgoing_approved_at && (
                    <button onClick={() => approve(h.id)} disabled={approving === h.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-cr-forest text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                      {approving === h.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve Handover
                    </button>
                  )}

                  {h.outgoing_approved_at && (
                    <div className="text-xs text-cr-slate">
                      Approved {new Date(h.outgoing_approved_at).toLocaleString("en-GB")} ·{" "}
                      {h.incoming_read_confirmed_at
                        ? `Read by incoming worker ${new Date(h.incoming_read_confirmed_at).toLocaleString("en-GB")}`
                        : "Not yet read by incoming worker"}
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
