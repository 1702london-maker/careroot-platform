"use client";

import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { formatDateUK, formatDateTimeUK } from "@/lib/utils";
import { Heart, CheckCircle, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  client: Record<string, unknown>;
  accessLevel: string;
  recentVisits: Record<string, unknown>[];
  latestBriefing: Record<string, unknown> | null;
  notes: Record<string, unknown>[];
  incidents: Record<string, unknown>[];
}

export function FamilyPortalView({ client, accessLevel, recentVisits, latestBriefing, notes, incidents }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/family/login");
  };

  const completedRecent = recentVisits.filter((v) => v.status === "completed").length;

  return (
    <div className="min-h-screen bg-cr-mint">
      {/* Header */}
      <div className="bg-cr-forest text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={20} />
          <span className="font-body font-semibold">Careroot Family Portal</span>
        </div>
        <button onClick={signOut} className="text-xs text-white/70 hover:text-white">Sign out</button>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {/* Client card */}
        <CRCard>
          <div className="flex items-center gap-4">
            <CRAvatar
              src={String(client.photo_url || "")}
              name={`${client.first_name} ${client.last_name}`}
              size="lg"
            />
            <div>
              <h1 className="font-display text-2xl font-semibold text-cr-charcoal">
                {String(client.first_name)} {String(client.last_name)}
              </h1>
              <p className="text-sm text-cr-slate">
                Born {formatDateUK(String(client.date_of_birth))}
              </p>
              <CRBadge variant="green" className="mt-1">Care active</CRBadge>
            </div>
          </div>
        </CRCard>

        {/* Recent visits summary */}
        <CRCard>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-cr-forest" />
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Recent Care Visits</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-cr-mint rounded-xl p-3 text-center">
              <p className="text-3xl font-bold text-cr-forest">{completedRecent}</p>
              <p className="text-xs text-cr-slate">Completed</p>
            </div>
            <div className="bg-cr-mint rounded-xl p-3 text-center">
              <p className="text-3xl font-bold text-cr-charcoal">{recentVisits.length}</p>
              <p className="text-xs text-cr-slate">Scheduled</p>
            </div>
          </div>
          <div className="space-y-2">
            {recentVisits.slice(0, 5).map((visit, i) => {
              const carer = visit.users as Record<string, string> | null;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-body text-cr-charcoal">
                      {formatDateTimeUK(String(visit.scheduled_start))}
                    </p>
                    {carer && (
                      <p className="text-xs text-cr-slate">{carer.first_name} {carer.last_name}</p>
                    )}
                  </div>
                  <CRBadge variant={visit.status === "completed" ? "green" : visit.status === "missed" ? "red" : "slate"}>
                    {String(visit.status)}
                  </CRBadge>
                </div>
              );
            })}
          </div>
        </CRCard>

        {/* Latest AI briefing */}
        {latestBriefing && (
          <CRCard>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">Latest Care Update</h2>
              {!!latestBriefing.ai_generated && <CRAIBadge size="sm" />}
            </div>
            <p className="text-xs text-cr-slate mb-3">
              {formatDateUK(String(latestBriefing.created_at))}
            </p>
            <p className="text-sm font-body text-cr-charcoal leading-relaxed whitespace-pre-wrap">
              {String(latestBriefing.content)}
            </p>
          </CRCard>
        )}

        {/* Visit notes (standard/full access only) */}
        {accessLevel !== "basic" && notes.length > 0 && (
          <CRCard>
            <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Visit Notes</h2>
            <div className="space-y-3">
              {notes.slice(0, 5).map((note, i) => {
                const visit = note.visits as Record<string, unknown> | null;
                const carer = visit?.users as Record<string, string> | null;
                return (
                  <div key={i} className="pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-cr-slate">{formatDateUK(String(note.created_at))}</p>
                      {note.sentiment === "positive" && <CRBadge variant="green">positive</CRBadge>}
                      {note.sentiment === "concerning" && <CRBadge variant="amber">note</CRBadge>}
                    </div>
                    <p className="text-sm font-body text-cr-charcoal line-clamp-4">{String(note.content)}</p>
                    {carer && (
                      <p className="text-xs text-cr-slate mt-1">— {carer.first_name}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CRCard>
        )}

        {/* Incidents (full access only) */}
        {accessLevel === "full" && incidents.length > 0 && (
          <CRCard>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">Important Notices</h2>
            </div>
            {incidents.map((incident, i) => (
              <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-body font-medium text-cr-charcoal capitalize">{String(incident.category)}</span>
                  <span className="text-xs text-cr-slate">{formatDateUK(String(incident.reported_at))}</span>
                </div>
                <p className="text-sm font-body text-cr-charcoal">{String(incident.description)}</p>
              </div>
            ))}
          </CRCard>
        )}

        {/* Contact the agency */}
        <CRCard>
          <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Contact the Care Team</h2>
          <div className="space-y-3">
            <a
              href="tel:+44000000000"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
                <Phone size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-body font-medium text-cr-charcoal">Call the office</p>
                <p className="text-xs text-cr-slate">Mon–Fri 8am–6pm</p>
              </div>
            </a>
            <a
              href="mailto:care@careroot.care"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-cr-mint border border-cr-forest rounded-xl flex items-center justify-center">
                <MessageCircle size={18} className="text-cr-forest" />
              </div>
              <div>
                <p className="text-sm font-body font-medium text-cr-charcoal">Send a message</p>
                <p className="text-xs text-cr-slate">We respond within 24 hours</p>
              </div>
            </a>
          </div>
        </CRCard>

        <p className="text-center text-xs text-cr-slate pb-4">
          Powered by Careroot · careroot.care
        </p>
      </div>
    </div>
  );
}
