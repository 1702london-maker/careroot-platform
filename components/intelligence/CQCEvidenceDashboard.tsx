"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { Shield, CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTimeUK } from "@/lib/utils";

interface EvidenceByStandard {
  score: number;
  strengths: string[];
  gaps: string[];
  evidence_count: number;
}

interface CQCPack {
  id: string;
  safe_score: number;
  effective_score: number;
  caring_score: number;
  responsive_score: number;
  well_led_score: number;
  overall_compliance_score: number;
  inspection_ready: boolean;
  gaps: string[];
  evidence_by_standard: Record<string, EvidenceByStandard> | null;
  last_updated_at: string;
}

interface Props {
  pack: CQCPack | null;
}

const STANDARDS = ["SAFE", "EFFECTIVE", "CARING", "RESPONSIVE", "WELL_LED"] as const;
const SCORE_KEYS: Record<typeof STANDARDS[number], keyof CQCPack> = {
  SAFE: "safe_score",
  EFFECTIVE: "effective_score",
  CARING: "caring_score",
  RESPONSIVE: "responsive_score",
  WELL_LED: "well_led_score",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-body font-semibold text-cr-charcoal w-10 text-right">{score}</span>
    </div>
  );
}

export function CQCEvidenceDashboard({ pack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  async function regenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/cqc-evidence-pack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {pack?.last_updated_at && (
          <p className="text-sm text-cr-slate font-body">Last analysed: {formatDateTimeUK(pack.last_updated_at)}</p>
        )}
        <CRButton onClick={regenerate} loading={generating} size="sm" variant="secondary">
          <RefreshCw size={14} className="mr-1.5" />
          {pack ? "Re-analyse" : "Analyse now"}
        </CRButton>
      </div>
      {error && <p className="text-sm text-red-600 font-body">{error}</p>}

      {!pack ? (
        <div className="text-center py-20">
          <Shield className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-body text-cr-slate">No CQC evidence pack generated yet.</p>
          <p className="text-sm text-cr-slate mt-1">Click &ldquo;Analyse now&rdquo; to score your service against the CQC framework.</p>
        </div>
      ) : (
        <>
          {/* Overall score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CRCard className="sm:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-body text-cr-slate">Overall Compliance Score</p>
                  <p className="text-4xl font-display font-bold text-cr-charcoal mt-0.5">{pack.overall_compliance_score}<span className="text-lg text-cr-slate font-body font-normal">/100</span></p>
                </div>
                <CRBadge variant={pack.inspection_ready ? "green" : "amber"}>
                  {pack.inspection_ready ? "Inspection Ready" : "Needs Attention"}
                </CRBadge>
              </div>
              <div className="space-y-3">
                {STANDARDS.map(std => (
                  <div key={std}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-body font-medium text-cr-slate uppercase">{std.replace("_", " ")}</span>
                    </div>
                    <ScoreBar score={pack[SCORE_KEYS[std]] as number} />
                  </div>
                ))}
              </div>
            </CRCard>

            <CRCard>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-red-500" />
                <p className="font-body font-semibold text-cr-charcoal text-sm">Top Gaps</p>
              </div>
              {(pack.gaps || []).length === 0 ? (
                <p className="text-sm text-cr-slate font-body">No critical gaps identified.</p>
              ) : (
                <ul className="space-y-2">
                  {(pack.gaps || []).map((gap, i) => (
                    <li key={i} className="flex gap-2 text-sm font-body text-cr-charcoal">
                      <span className="flex-shrink-0 text-red-400 font-semibold">{i + 1}.</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              )}
            </CRCard>
          </div>

          {/* Evidence by standard */}
          {pack.evidence_by_standard && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">Evidence Detail</h2>
              {STANDARDS.map(std => {
                const evidence = (pack.evidence_by_standard as Record<string, EvidenceByStandard>)[std];
                if (!evidence) return null;
                const expanded = expandedStandard === std;
                const score = evidence.score;
                const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
                return (
                  <CRCard key={std}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedStandard(expanded ? null : std)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-body font-semibold text-cr-charcoal w-28">{std.replace("_", " ")}</span>
                        <span className={`text-lg font-display font-bold ${color}`}>{score}</span>
                        <span className="text-xs text-cr-slate font-body">{evidence.evidence_count} data points</span>
                      </div>
                      {expanded ? <ChevronUp size={16} className="text-cr-slate" /> : <ChevronDown size={16} className="text-cr-slate" />}
                    </div>
                    {expanded && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        {evidence.strengths?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <CheckCircle size={13} className="text-green-500" />
                              <p className="text-xs font-body font-semibold text-green-700 uppercase tracking-wide">Strengths</p>
                            </div>
                            <ul className="space-y-1">
                              {evidence.strengths.map((s, i) => (
                                <li key={i} className="text-sm font-body text-cr-charcoal flex gap-2">
                                  <span className="text-green-500 flex-shrink-0">•</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evidence.gaps?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <AlertCircle size={13} className="text-red-500" />
                              <p className="text-xs font-body font-semibold text-red-700 uppercase tracking-wide">Gaps</p>
                            </div>
                            <ul className="space-y-1">
                              {evidence.gaps.map((g, i) => (
                                <li key={i} className="text-sm font-body text-cr-charcoal flex gap-2">
                                  <span className="text-red-400 flex-shrink-0">•</span>{g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CRCard>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
