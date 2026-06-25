"use client";

import { CRCard } from "@/components/ui/CRCard";
import { CRBadge, riskVariant } from "@/components/ui/CRBadge";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { formatDateUK } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  riskAssessment: Record<string, unknown> | null;
}

export function ClientRiskTab({ client, riskAssessment }: Props) {
  const getFallsBand = (score: number) => {
    if (score <= 5) return { label: "Low", color: "text-green-600", bg: "bg-green-50" };
    if (score <= 10) return { label: "Medium", color: "text-amber-600", bg: "bg-amber-50" };
    if (score <= 15) return { label: "High", color: "text-orange-600", bg: "bg-orange-50" };
    return { label: "Very High", color: "text-cr-red", bg: "bg-red-50" };
  };

  const fallsScore = Number(riskAssessment?.falls_risk_score || 0);
  const band = getFallsBand(fallsScore);

  return (
    <div className="space-y-6">
      {/* Overall risk */}
      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-cr-forest" />
            <h3 className="font-display text-lg font-semibold text-cr-charcoal">Overall Risk Level</h3>
          </div>
          <CRBadge variant={riskVariant(String(client.risk_level))} className="text-sm px-3 py-1">
            {String(client.risk_level).toUpperCase()}
          </CRBadge>
        </div>
        {riskAssessment ? (
          <p className="text-xs text-cr-slate">
            Last assessed {formatDateUK(String(riskAssessment.created_at))}
            {riskAssessment.next_review_date != null && ` · Next review ${formatDateUK(String(riskAssessment.next_review_date))}`}
          </p>
        ) : (
          <p className="text-sm text-cr-slate">No formal risk assessment on record</p>
        )}
      </CRCard>

      {riskAssessment && (
        <>
          {/* Falls risk */}
          <CRCard>
            <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Falls Risk</h3>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${band.bg} mb-3`}>
              <div className="text-center">
                <div className={`text-4xl font-bold font-body ${band.color}`}>{fallsScore}</div>
                <div className="text-xs text-cr-slate">/20</div>
              </div>
              <div>
                <p className={`text-lg font-body font-semibold ${band.color}`}>{band.label} Risk</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                  <div
                    className="h-2 rounded-full bg-cr-forest transition-all"
                    style={{ width: `${(fallsScore / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CRCard>

          {/* Risk factors */}
          {(riskAssessment.environmental_risks || riskAssessment.medication_risks || riskAssessment.notes) && (
            <CRCard>
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Risk Factors</h3>
              <div className="space-y-4">
                {riskAssessment.environmental_risks != null && (
                  <div>
                    <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-wide mb-1">Environmental</p>
                    <p className="text-sm font-body text-cr-charcoal">{String(riskAssessment.environmental_risks)}</p>
                  </div>
                )}
                {riskAssessment.medication_risks != null && (
                  <div>
                    <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-wide mb-1">Medication Risk</p>
                    <CRBadge variant={riskVariant(String(riskAssessment.medication_risks))}>{String(riskAssessment.medication_risks)}</CRBadge>
                  </div>
                )}
                {riskAssessment.notes != null && (
                  <div>
                    <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-wide mb-1">Assessor Notes</p>
                    <p className="text-sm font-body text-cr-charcoal">{String(riskAssessment.notes)}</p>
                  </div>
                )}
              </div>
            </CRCard>
          )}
        </>
      )}

      {/* AI Risk Flags shortcut */}
      <CRCard>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold text-cr-charcoal">AI Risk Analysis</h3>
          <CRAIBadge />
        </div>
        <p className="text-sm text-cr-slate mb-3">
          Run an AI analysis using the last 30 days of visits, notes, and medication records to detect emerging risks.
        </p>
        <button
          onClick={async () => {
            const res = await fetch("/api/ai/risk-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ client_id: client.id, organisation_id: client.organisation_id }),
            });
            if (res.ok) window.location.reload();
          }}
          className="cr-btn-primary px-4 py-2 text-sm"
        >
          Run AI Risk Analysis
        </button>
      </CRCard>
    </div>
  );
}
