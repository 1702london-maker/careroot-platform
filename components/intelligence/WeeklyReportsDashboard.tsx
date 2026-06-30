"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { FileText, ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface Client { id: string; first_name: string; last_name: string; }
interface Report {
  id: string;
  client_id: string;
  week_start: string;
  week_end: string;
  status: string;
  generated_at: string;
  content: Record<string, unknown> | null;
  clients: Client | null;
}

interface Props {
  reports: unknown[];
  clients: unknown[];
}

export function WeeklyReportsDashboard({ reports: rawReports, clients: rawClients }: Props) {
  const reports = rawReports as Report[];
  const clients = rawClients as Client[];

  const [selectedClient, setSelectedClient] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compute default week
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const defaultWeekStart = monday.toISOString().split("T")[0];
  const defaultWeekEnd = sunday.toISOString().split("T")[0];

  async function generate() {
    if (!selectedClient) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: selectedClient, week_start: defaultWeekStart, week_end: defaultWeekEnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const grouped: Record<string, Report[]> = {};
  for (const r of reports) {
    if (!grouped[r.client_id]) grouped[r.client_id] = [];
    grouped[r.client_id].push(r);
  }

  return (
    <div className="space-y-6">
      {/* Generate panel */}
      <CRCard>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cr-forest" />
            <span className="font-body font-medium text-cr-charcoal">Generate this week&apos;s report</span>
          </div>
          <select
            className="flex-1 min-w-48 h-10 rounded-lg border border-gray-200 px-3 text-sm font-body text-cr-charcoal focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
          >
            <option value="">Select client…</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
          <span className="text-sm text-cr-slate font-body">{defaultWeekStart} → {defaultWeekEnd}</span>
          <CRButton onClick={generate} loading={generating} disabled={!selectedClient} size="sm">
            Generate
          </CRButton>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 font-body">{error}</p>}
      </CRCard>

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-body text-cr-slate">No weekly reports generated yet. Select a client above to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const content = report.content as Record<string, unknown> | null;
            const expanded = expandedId === report.id;
            const client = report.clients;
            const concerns = (content?.key_concerns as string[]) || [];
            const highlights = (content?.positive_highlights as string[]) || [];
            const actions = (content?.actions_required as string[]) || [];

            return (
              <CRCard key={report.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : report.id)}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-body font-semibold text-cr-charcoal">
                        {client?.first_name} {client?.last_name}
                      </span>
                      <CRBadge variant={report.status === "published" ? "green" : "slate"} size="sm">
                        {report.status}
                      </CRBadge>
                    </div>
                    <p className="text-xs text-cr-slate font-body">
                      Week of {formatDateUK(report.week_start)} → {formatDateUK(report.week_end)}
                    </p>
                  </div>
                  {expanded ? <ChevronUp size={18} className="text-cr-slate" /> : <ChevronDown size={18} className="text-cr-slate" />}
                </div>

                {expanded && content && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                    {content.executive_summary && (
                      <div>
                        <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Summary</p>
                        <p className="text-sm font-body text-cr-charcoal">{content.executive_summary as string}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {["wellbeing_overview", "nutrition_summary", "medication_summary", "mood_summary", "incidents_summary"].map(key => (
                        content[key] ? (
                          <div key={key} className="col-span-1">
                            <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-body text-cr-charcoal">{content[key] as string}</p>
                          </div>
                        ) : null
                      ))}
                    </div>

                    {concerns.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <AlertCircle size={14} className="text-amber-500" />
                          <p className="text-xs font-body font-semibold text-amber-700 uppercase tracking-wide">Key Concerns</p>
                        </div>
                        <ul className="space-y-1">
                          {concerns.map((c, i) => (
                            <li key={i} className="text-sm font-body text-cr-charcoal flex gap-2">
                              <span className="text-amber-500 flex-shrink-0">•</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {highlights.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle size={14} className="text-green-500" />
                          <p className="text-xs font-body font-semibold text-green-700 uppercase tracking-wide">Positive Highlights</p>
                        </div>
                        <ul className="space-y-1">
                          {highlights.map((h, i) => (
                            <li key={i} className="text-sm font-body text-cr-charcoal flex gap-2">
                              <span className="text-green-500 flex-shrink-0">•</span>{h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {actions.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs font-body font-semibold text-red-700 uppercase tracking-wide mb-2">Actions Required</p>
                        <ul className="space-y-1">
                          {actions.map((a, i) => (
                            <li key={i} className="text-sm font-body text-red-800 flex gap-2">
                              <span className="flex-shrink-0">{i + 1}.</span>{a}
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
    </div>
  );
}
