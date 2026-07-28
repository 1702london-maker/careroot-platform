"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CheckCircle, AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";

type Handover = {
  id: string;
  current_status?: string;
  key_events?: string;
  nutrition_summary?: string;
  medication_summary?: string;
  actions_for_incoming_worker?: string;
  triggers_activated_this_shift?: string[];
  outgoing_approved_at?: string;
  incoming_read_confirmed_at?: string;
  server_timestamp: string;
  client?: { id: string; first_name: string; last_name: string } | null;
  outgoing_staff?: { first_name: string; last_name: string } | null;
  incoming_staff?: { first_name: string; last_name: string } | null;
};

interface Props {
  handovers: Handover[];
  userId?: string;
  hasActiveShift: boolean;
}

export function CarerHandoverClient({ handovers, hasActiveShift }: Props) {
  const [expanded, setExpanded] = useState<string | null>(handovers[0]?.id ?? null);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!hasActiveShift) {
    return (
      <div className="text-center py-16">
        <ArrowRightLeft size={40} className="mx-auto text-cr-slate opacity-30 mb-3" />
        <p className="font-medium text-cr-charcoal">No active shift</p>
        <p className="text-sm text-cr-slate mt-1">Handover notes are only available during an active shift or within 30 minutes of shift end.</p>
      </div>
    );
  }

  const confirmRead = async (handoverId: string) => {
    setConfirming(handoverId);
    await fetch(`/api/handover-notes/${handoverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_read" }),
    });
    window.location.reload();
  };

  if (handovers.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle size={40} className="mx-auto text-green-500 opacity-50 mb-3" />
        <p className="font-medium text-cr-charcoal">No handover notes</p>
        <p className="text-sm text-cr-slate mt-1">No handover notes exist for your current clients yet.</p>
      </div>
    );
  }

  const unread = handovers.filter(h => !h.incoming_read_confirmed_at);

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <CRAlertBanner
          variant="amber"
          title={`${unread.length} unread handover note${unread.length > 1 ? "s" : ""}`}
          description="Please read and confirm all handover notes before starting care."
        />
      )}

      {handovers.map(h => {
        const client = h.client;
        const isExpanded = expanded === h.id;
        const isRead = Boolean(h.incoming_read_confirmed_at);

        return (
          <CRCard key={h.id}>
            {/* Header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : h.id)}
              className="w-full flex items-start justify-between gap-3 text-left"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-cr-charcoal text-sm">
                    {client?.first_name} {client?.last_name}
                  </p>
                  {!isRead && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                      UNREAD
                    </span>
                  )}
                  {isRead && (
                    <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={9} /> Read
                    </span>
                  )}
                </div>
                <p className="text-xs text-cr-slate mt-0.5">
                  From: {h.outgoing_staff?.first_name} {h.outgoing_staff?.last_name} ·{" "}
                  {new Date(h.server_timestamp).toLocaleDateString("en-GB")} at{" "}
                  {new Date(h.server_timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
                </p>
              </div>
              <ArrowRightLeft size={16} className="text-cr-slate flex-shrink-0 mt-0.5" />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                {h.current_status && (
                  <div>
                    <p className="text-xs font-semibold text-cr-charcoal mb-1">Current status</p>
                    <p className="text-sm text-cr-charcoal bg-gray-50 rounded-lg p-3">{h.current_status}</p>
                  </div>
                )}

                {h.key_events && (
                  <div>
                    <p className="text-xs font-semibold text-cr-charcoal mb-1">Key events this shift</p>
                    <p className="text-sm text-cr-charcoal bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{h.key_events}</p>
                  </div>
                )}

                {h.medication_summary && (
                  <div>
                    <p className="text-xs font-semibold text-cr-charcoal mb-1">Medication notes</p>
                    <p className="text-sm text-cr-charcoal bg-purple-50 rounded-lg p-3 whitespace-pre-wrap">{h.medication_summary}</p>
                  </div>
                )}

                {h.nutrition_summary && (
                  <div>
                    <p className="text-xs font-semibold text-cr-charcoal mb-1">Nutrition & fluids</p>
                    <p className="text-sm text-cr-charcoal bg-orange-50 rounded-lg p-3 whitespace-pre-wrap">{h.nutrition_summary}</p>
                  </div>
                )}

                {h.actions_for_incoming_worker && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={13} className="text-amber-500" />
                      <p className="text-xs font-semibold text-cr-charcoal">Actions required — YOUR shift</p>
                    </div>
                    <p className="text-sm text-cr-charcoal bg-amber-50 border border-amber-200 rounded-lg p-3 whitespace-pre-wrap">{h.actions_for_incoming_worker}</p>
                  </div>
                )}

                {h.triggers_activated_this_shift && h.triggers_activated_this_shift.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cr-charcoal mb-1">Triggers activated</p>
                    <div className="flex flex-wrap gap-1.5">
                      {h.triggers_activated_this_shift.map((t, i) => (
                        <span key={i} className="text-xs bg-red-100 text-cr-red font-medium px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read confirmation */}
                {!isRead && (
                  <button
                    onClick={() => confirmRead(h.id)}
                    disabled={confirming === h.id}
                    className="w-full cr-btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {confirming === h.id ? "Confirming..." : "I have read this handover"}
                  </button>
                )}

                {isRead && h.incoming_read_confirmed_at && (
                  <p className="text-xs text-cr-slate flex items-center gap-1">
                    <Clock size={11} />
                    Confirmed read at {new Date(h.incoming_read_confirmed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
                  </p>
                )}
              </div>
            )}
          </CRCard>
        );
      })}
    </div>
  );
}
