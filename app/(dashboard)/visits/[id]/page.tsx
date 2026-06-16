import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge, statusVariant, riskVariant } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { formatDateTimeUK, formatTimeUK, formatDateUK } from "@/lib/utils";
import {
  Clock, MapPin, User2, FileText, Pill,
  Utensils, AlertTriangle, CheckCircle2, XCircle,
  Mic, Sparkles, ArrowLeft
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VisitDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: visit, error } = await supabase
    .from("visits")
    .select(`
      *,
      clients(id, first_name, last_name, avatar_url, dnr_status, risk_level, address, phone),
      users!visits_carer_id_fkey(id, first_name, last_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error || !visit) notFound();

  const [
    { data: notes },
    { data: medications },
    { data: medRecords },
    { data: mealRecords },
    { data: incidents },
  ] = await Promise.all([
    supabase.from("visit_notes").select("*").eq("visit_id", id).order("created_at"),
    supabase.from("medications").select("*").eq("client_id", visit.client_id).eq("is_active", true).order("name"),
    supabase.from("medication_records").select("*, medications(name, dosage, route)").eq("visit_id", id),
    supabase.from("meal_records").select("*").eq("visit_id", id),
    supabase.from("incidents").select("*").eq("visit_id", id).order("reported_at", { ascending: false }),
  ]);

  const client = visit.clients as Record<string, unknown> | null;
  const carer = visit.users as Record<string, string> | null;
  const address = client?.address as Record<string, string> | null;

  const statusColors: Record<string, string> = {
    completed: "text-green-600 bg-green-50 border-green-200",
    in_progress: "text-blue-600 bg-blue-50 border-blue-200",
    scheduled: "text-gray-600 bg-gray-50 border-gray-200",
    missed: "text-cr-red bg-red-50 border-red-200",
    cancelled: "text-cr-slate bg-gray-50 border-gray-200",
  };

  const duration = visit.actual_start && visit.actual_end
    ? Math.round((new Date(visit.actual_end).getTime() - new Date(visit.actual_start).getTime()) / 60000)
    : null;

  return (
    <div>
      {/* DNR banner */}
      {Boolean(client?.dnr_status) && (
        <CRAlertBanner
          variant="red"
          title="⚠️ DNR ORDER IN PLACE — Do Not Resuscitate"
          description="This client has a valid Do Not Resuscitate order."
          className="mb-4"
        />
      )}

      {visit.status === "missed" && (
        <CRAlertBanner
          variant="red"
          title="Missed visit"
          description="No check-in was recorded for this visit. Please investigate and document actions taken."
          className="mb-4"
        />
      )}

      <CRPageHeader
        title="Visit Detail"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Visits", href: "/visits" },
        ]}
        action={
          <Link href="/visits" className="flex items-center gap-1.5 text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">
            <ArrowLeft size={16} /> Back to visits
          </Link>
        }
      />

      {/* Visit header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Client */}
        <CRCard>
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-3">Client</p>
          <div className="flex items-center gap-3">
            <CRAvatar
              src={client?.avatar_url as string}
              firstName={client?.first_name as string}
              lastName={client?.last_name as string}
              size="md"
            />
            <div>
              <Link
                href={`/clients/${client?.id}`}
                className="font-body font-semibold text-cr-charcoal hover:text-cr-forest transition-colors"
              >
                {client?.first_name as string} {client?.last_name as string}
              </Link>
              {client?.risk_level && client.risk_level !== "low" && (
                <div className="mt-1">
                  <CRBadge variant={riskVariant(client.risk_level as string)} size="sm">
                    {client.risk_level as string} risk
                  </CRBadge>
                </div>
              )}
              {address?.line1 && (
                <p className="text-xs font-body text-cr-slate mt-1 flex items-center gap-1">
                  <MapPin size={10} />
                  {[address.line1, address.city, address.postcode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        </CRCard>

        {/* Carer */}
        <CRCard>
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-3">Carer</p>
          {carer ? (
            <div className="flex items-center gap-3">
              <CRAvatar firstName={carer.first_name} lastName={carer.last_name} size="md" />
              <div>
                <p className="font-body font-semibold text-cr-charcoal">{carer.first_name} {carer.last_name}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-body text-cr-slate">Unassigned</p>
          )}
        </CRCard>

        {/* Timing */}
        <CRCard>
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-3">Timing</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-cr-slate">Status</span>
              <CRBadge variant={statusVariant(visit.status)}>{visit.status.replace("_", " ")}</CRBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-cr-slate flex items-center gap-1"><Clock size={11} /> Scheduled</span>
              <span className="text-xs font-body text-cr-charcoal">
                {formatTimeUK(visit.scheduled_start)} – {formatTimeUK(visit.scheduled_end)}
              </span>
            </div>
            {visit.actual_start && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-cr-slate">Actual</span>
                <span className="text-xs font-body text-cr-charcoal">
                  {formatTimeUK(visit.actual_start)} – {visit.actual_end ? formatTimeUK(visit.actual_end) : "in progress"}
                </span>
              </div>
            )}
            {duration !== null && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-cr-slate">Duration</span>
                <span className="text-xs font-body text-cr-charcoal font-semibold">{duration} min</span>
              </div>
            )}
            {(visit.check_in_lat || visit.check_in_lng) && (
              <p className="text-xs font-body text-green-600 flex items-center gap-1 pt-1">
                <MapPin size={10} /> GPS check-in recorded
              </p>
            )}
          </div>
        </CRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: notes + AI summary */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI visit summary */}
          {visit.ai_summary && (
            <CRCard>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-cr-gold" />
                <h2 className="font-display text-lg font-semibold text-cr-charcoal">AI Summary</h2>
              </div>
              <p className="text-sm font-body text-cr-charcoal leading-relaxed">{visit.ai_summary}</p>
            </CRCard>
          )}

          {/* Visit notes */}
          <CRCard noPadding>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-semibold text-cr-charcoal flex items-center gap-2">
                <FileText size={18} className="text-cr-slate" /> Visit Notes
              </h2>
              <span className="text-xs font-body text-cr-slate">{notes?.length ?? 0} note{notes?.length !== 1 ? "s" : ""}</span>
            </div>
            {!notes?.length ? (
              <div className="p-8">
                <CREmptyState
                  icon={<FileText size={32} className="text-cr-slate opacity-30" />}
                  title="No notes recorded"
                  description="Notes will appear here when the carer completes the visit"
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notes.map((note) => {
                  const sentimentColors: Record<string, string> = {
                    positive: "border-l-green-400",
                    neutral: "border-l-gray-300",
                    concerning: "border-l-amber-400",
                    urgent: "border-l-cr-red",
                  };
                  return (
                    <div key={note.id} className={`p-6 border-l-4 ${sentimentColors[note.sentiment ?? "neutral"] ?? "border-l-gray-200"}`}>
                      {note.voice_transcript && (
                        <p className="text-xs font-body text-cr-slate flex items-center gap-1 mb-2">
                          <Mic size={10} /> Voice note transcribed
                        </p>
                      )}
                      <p className="text-sm font-body text-cr-charcoal leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                      {note.ai_structured && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(note.ai_structured as Record<string, string>).filter(([k, v]) => v && k !== "sentiment").map(([key, val]) => (
                            <div key={key} className="bg-cr-mint/50 rounded-lg p-3">
                              <p className="text-xs font-body font-semibold text-cr-forest uppercase tracking-wide mb-1">
                                {key.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs font-body text-cr-charcoal leading-relaxed">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs font-body text-cr-slate">{formatDateTimeUK(note.created_at)}</p>
                        {note.sentiment && (
                          <CRBadge
                            variant={note.sentiment === "urgent" ? "red" : note.sentiment === "concerning" ? "amber" : note.sentiment === "positive" ? "green" : "slate"}
                            size="sm"
                          >
                            {note.sentiment}
                          </CRBadge>
                        )}
                      </div>
                      {note.is_internal && (
                        <p className="text-xs font-body text-cr-slate mt-1 italic">Internal note — not visible to family</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CRCard>

          {/* Meals */}
          {(mealRecords?.length ?? 0) > 0 && (
            <CRCard noPadding>
              <div className="flex items-center gap-2 p-6 border-b border-gray-100">
                <Utensils size={18} className="text-cr-slate" />
                <h2 className="font-display text-lg font-semibold text-cr-charcoal">Meals & Nutrition</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {mealRecords?.map((meal) => {
                  const consumptionVariant = {
                    all: "green", most: "green", half: "amber", little: "amber", refused: "red",
                  }[meal.consumption_level ?? ""] ?? "slate";
                  return (
                    <div key={meal.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1">
                        <p className="text-sm font-body font-semibold text-cr-charcoal">{meal.meal_name ?? "Meal"}</p>
                        <p className="text-xs font-body text-cr-slate capitalize">{meal.meal_time?.replace("_", " ")}</p>
                        {meal.notes && <p className="text-xs font-body text-cr-slate mt-0.5">{meal.notes}</p>}
                      </div>
                      <div className="text-right">
                        <CRBadge variant={consumptionVariant as "green" | "amber" | "red" | "slate"} size="sm">
                          {meal.consumption_level ?? "—"}
                        </CRBadge>
                        {meal.fluid_intake_ml && (
                          <p className="text-xs font-body text-cr-slate mt-1">{meal.fluid_intake_ml} ml fluid</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CRCard>
          )}

          {/* Incidents */}
          {(incidents?.length ?? 0) > 0 && (
            <CRCard noPadding>
              <div className="flex items-center gap-2 p-6 border-b border-gray-100">
                <AlertTriangle size={18} className="text-cr-red" />
                <h2 className="font-display text-lg font-semibold text-cr-charcoal">Incidents</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {incidents?.map((inc) => (
                  <div key={inc.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-body font-semibold text-cr-charcoal">{inc.title}</p>
                        {inc.description && <p className="text-xs font-body text-cr-slate mt-0.5 leading-relaxed">{inc.description}</p>}
                      </div>
                      <CRBadge variant={riskVariant(inc.severity ?? "low")} size="sm">{inc.severity}</CRBadge>
                    </div>
                    <p className="text-xs font-body text-cr-slate mt-2">{formatDateTimeUK(inc.reported_at)}</p>
                  </div>
                ))}
              </div>
            </CRCard>
          )}
        </div>

        {/* Right: medications + tasks */}
        <div className="space-y-6">
          {/* Medications */}
          <CRCard noPadding>
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <Pill size={16} className="text-cr-slate" />
              <h2 className="font-display text-base font-semibold text-cr-charcoal">Medications</h2>
            </div>
            {!medications?.length ? (
              <div className="p-6 text-center">
                <p className="text-xs font-body text-cr-slate">No active medications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {medications.map((med) => {
                  const record = medRecords?.find(r => r.medication_id === med.id);
                  const statusIcon = !record ? null :
                    record.status === "given" ? <CheckCircle2 size={14} className="text-green-500" /> :
                    record.status === "refused" ? <XCircle size={14} className="text-cr-red" /> :
                    <XCircle size={14} className="text-cr-amber" />;
                  return (
                    <div key={med.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-body font-semibold text-cr-charcoal">{med.name}</p>
                        <p className="text-xs font-body text-cr-slate">{med.dosage} · {med.frequency}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {statusIcon}
                        {record && (
                          <span className="text-xs font-body text-cr-slate capitalize">{record.status}</span>
                        )}
                        {!record && <span className="text-xs font-body text-cr-slate">Not recorded</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CRCard>

          {/* Tasks completed */}
          {Array.isArray(visit.tasks_completed) && (visit.tasks_completed as unknown[]).length > 0 && (
            <CRCard>
              <h2 className="font-display text-base font-semibold text-cr-charcoal mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cr-sage" /> Tasks Completed
              </h2>
              <div className="space-y-2">
                {(visit.tasks_completed as Array<{ task: string; completed: boolean }>).map((task, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {task.completed
                      ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      : <XCircle size={14} className="text-cr-slate shrink-0" />
                    }
                    <p className="text-xs font-body text-cr-charcoal">{task.task}</p>
                  </div>
                ))}
              </div>
            </CRCard>
          )}

          {/* General notes */}
          {visit.notes && (
            <CRCard>
              <h2 className="font-display text-base font-semibold text-cr-charcoal mb-2">Manager Notes</h2>
              <p className="text-sm font-body text-cr-charcoal leading-relaxed">{visit.notes}</p>
            </CRCard>
          )}
        </div>
      </div>
    </div>
  );
}
