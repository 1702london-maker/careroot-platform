"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { formatDateTimeUK } from "@/lib/utils";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  visits: Record<string, unknown>[];
}

const supabase = createClient();

export function ClientNotesTab({ client, visits }: Props) {
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("visit_notes")
      .select("*, visits(scheduled_start, users(first_name, last_name))")
      .eq("client_id", String(client.id))
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setNotes(data || []);
        setLoading(false);
      });
  }, [client.id]);

  if (loading) return <div className="text-sm text-cr-slate p-4">Loading notes...</div>;

  if (notes.length === 0) {
    return (
      <CREmptyState
        icon={<FileText className="text-cr-slate" size={40} />}
        title="No visit notes yet"
        description="Notes are added by carers during and after visits"
      />
    );
  }

  const sentimentVariant = (s: string) => {
    if (s === "positive") return "green";
    if (s === "concerning") return "red";
    if (s === "neutral") return "slate";
    return "slate";
  };

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const visit = note.visits as Record<string, unknown> | null;
        const carer = visit?.users as Record<string, string> | null;
        const aiData = note.ai_structured as Record<string, unknown> | null;
        const isExpanded = expanded === String(note.id);

        return (
          <CRCard key={String(note.id)} hover>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-body font-medium text-cr-charcoal">
                    {formatDateTimeUK(String(note.created_at))}
                  </span>
                  {note.sentiment && (
                    <CRBadge variant={sentimentVariant(String(note.sentiment))}>
                      {String(note.sentiment)}
                    </CRBadge>
                  )}
                  {note.ai_structured && <CRAIBadge size="sm" />}
                  {note.is_internal && <CRBadge variant="slate">Internal</CRBadge>}
                </div>
                <p className="text-xs text-cr-slate mb-2">
                  {carer ? `${carer.first_name} ${carer.last_name}` : "Unknown carer"}
                </p>
                <p className={`text-sm font-body text-cr-charcoal leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}>
                  {String(note.content)}
                </p>

                {isExpanded && aiData && (
                  <div className="mt-4 p-3 bg-cr-mint rounded-xl">
                    <p className="text-xs font-body font-semibold text-cr-forest mb-2">AI Analysis</p>
                    {Object.entries(aiData).map(([key, val]) => val && (
                      <div key={key} className="mb-2">
                        <p className="text-xs font-body font-medium text-cr-charcoal capitalize">{key.replace(/_/g, " ")}</p>
                        <p className="text-sm font-body text-cr-slate">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setExpanded(isExpanded ? null : String(note.id))}
                className="ml-3 text-cr-slate hover:text-cr-charcoal"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </CRCard>
        );
      })}
    </div>
  );
}
