"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CRBadge } from "@/components/ui/CRBadge";
import { Loader2, Sparkles, TrendingUp, Send, CheckCircle } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
}

export function ClientAITab({ client }: Props) {
  const clientId = String(client.id);

  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<{ score: number; flags: number; summary: string } | null>(null);
  const [riskError, setRiskError] = useState("");

  const [briefLoading, setBriefLoading] = useState(false);
  const [briefResult, setBriefResult] = useState<{ content: string; sent: boolean } | null>(null);
  const [briefError, setBriefError] = useState("");

  const runRiskAnalysis = async () => {
    setRiskLoading(true);
    setRiskError("");
    setRiskResult(null);
    try {
      const res = await fetch("/api/ai/risk-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRiskResult({ score: data.risk_score, flags: data.new_flags_count ?? 0, summary: data.summary ?? "" });
    } catch (err: unknown) {
      setRiskError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setRiskLoading(false);
    }
  };

  const generateFamilyBrief = async (send: boolean) => {
    setBriefLoading(true);
    setBriefError("");
    setBriefResult(null);
    try {
      const res = await fetch("/api/ai/family-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, send_now: send }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setBriefResult({ content: data.content ?? data.brief ?? "", sent: send });
    } catch (err: unknown) {
      setBriefError(err instanceof Error ? err.message : "Failed to generate brief");
    } finally {
      setBriefLoading(false);
    }
  };

  const riskVariantFromScore = (score: number) =>
    score >= 70 ? "red" : score >= 45 ? "amber" : "green";

  return (
    <div className="space-y-6">
      {/* Risk Analysis */}
      <CRCard>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-cr-forest" />
          <h3 className="font-display text-lg font-semibold text-cr-charcoal">Risk Analysis</h3>
          <CRAIBadge />
        </div>
        <p className="text-sm font-body text-cr-slate mb-4">
          Analyse recent visit notes, incidents, and care records to identify patterns of concern and generate risk flags.
        </p>

        {riskResult && (
          <div className="bg-cr-mint rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body font-semibold text-cr-charcoal">Risk Score</span>
              <CRBadge variant={riskVariantFromScore(riskResult.score)} size="sm">
                {riskResult.score}/100
              </CRBadge>
            </div>
            {riskResult.flags > 0 && (
              <p className="text-sm font-body text-cr-charcoal mb-2">
                {riskResult.flags} new risk flag{riskResult.flags !== 1 ? "s" : ""} raised
              </p>
            )}
            {riskResult.summary && (
              <p className="text-sm font-body text-cr-slate">{riskResult.summary}</p>
            )}
          </div>
        )}

        {riskError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
            {riskError}
          </div>
        )}

        <button
          onClick={runRiskAnalysis}
          disabled={riskLoading}
          className="cr-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {riskLoading ? <><Loader2 size={15} className="animate-spin" /> Analysing…</> : <><Sparkles size={15} /> Run Risk Analysis</>}
        </button>
      </CRCard>

      {/* Family Brief */}
      <CRCard>
        <div className="flex items-center gap-2 mb-3">
          <Send size={18} className="text-cr-forest" />
          <h3 className="font-display text-lg font-semibold text-cr-charcoal">Family Brief</h3>
          <CRAIBadge />
        </div>
        <p className="text-sm font-body text-cr-slate mb-4">
          Generate a positive, reassuring weekly update for this client&apos;s family based on recent care records.
        </p>

        {briefResult && (
          <div className="bg-cr-mint rounded-xl p-4 mb-4">
            {briefResult.sent && (
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-cr-forest" />
                <span className="text-sm font-body font-semibold text-cr-forest">Sent to family</span>
              </div>
            )}
            <p className="text-sm font-body text-cr-charcoal leading-relaxed whitespace-pre-wrap">{briefResult.content}</p>
          </div>
        )}

        {briefError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
            {briefError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => generateFamilyBrief(false)}
            disabled={briefLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-body font-medium border border-cr-forest text-cr-forest rounded-lg hover:bg-cr-mint transition-colors disabled:opacity-50"
          >
            {briefLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Preview
          </button>
          <button
            onClick={() => generateFamilyBrief(true)}
            disabled={briefLoading}
            className="cr-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {briefLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Generate &amp; Send
          </button>
        </div>
      </CRCard>
    </div>
  );
}
