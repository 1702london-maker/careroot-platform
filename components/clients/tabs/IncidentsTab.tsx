"use client";

import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { formatDateUK } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  incidents: Record<string, unknown>[];
}

export function ClientIncidentsTab({ client, incidents }: Props) {
  if (incidents.length === 0) {
    return (
      <CREmptyState
        icon={<AlertTriangle className="text-cr-slate" size={40} />}
        title="No incidents recorded"
        description="Incidents reported for this client will appear here"
      />
    );
  }

  const severityVariant = (s: string) => {
    if (s === "critical") return "red";
    if (s === "high") return "red";
    if (s === "medium") return "amber";
    return "slate";
  };

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <CRCard key={String(incident.id)}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-body font-medium text-cr-charcoal capitalize">{String(incident.category)}</span>
                <CRBadge variant={severityVariant(String(incident.severity))}>{String(incident.severity)}</CRBadge>
                {incident.is_family_visible && <CRBadge variant="blue">Visible to family</CRBadge>}
              </div>
              <p className="text-xs text-cr-slate">{formatDateUK(String(incident.reported_at))}</p>
            </div>
            <CRBadge variant={incident.status === "resolved" ? "green" : incident.status === "under_review" ? "amber" : "slate"}>
              {String(incident.status || "open")}
            </CRBadge>
          </div>
          <p className="text-sm font-body text-cr-charcoal leading-relaxed">{String(incident.description)}</p>
          {incident.actions_taken && (
            <div className="mt-3 p-3 bg-cr-mint rounded-lg">
              <p className="text-xs font-body font-semibold text-cr-forest mb-1">Actions Taken</p>
              <p className="text-sm font-body text-cr-charcoal">{String(incident.actions_taken)}</p>
            </div>
          )}
        </CRCard>
      ))}
    </div>
  );
}
