"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmergencyButton } from "@/components/ui/CREmergencyButton";
import { CRStepList } from "@/components/ui/CRStepList";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { formatTimeUK } from "@/lib/utils";
import {
  Play, CheckCircle, Mic, MicOff, Loader2, ChevronDown, ChevronUp,
  Pill, Utensils, FileText, Phone, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Tasks", "Care Plan", "Medications", "Meals", "Notes"];

interface Props {
  visit: Record<string, unknown>;
  client: Record<string, unknown>;
  carePlan: Record<string, unknown> | null;
  medications: Record<string, unknown>[];
  mealPreferences: Record<string, unknown>[];
  nutritionProfile: Record<string, unknown> | null;
  carerRole: string;
}

export function VisitActiveScreen({ visit, client, carePlan, medications, mealPreferences, nutritionProfile, carerRole }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("Tasks");
  const [visitStatus, setVisitStatus] = useState(String(visit.status));
  const [noteText, setNoteText] = useState("");
  const [recording, setRecording] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [aiSummary, setAiSummary] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const [medRecords, setMedRecords] = useState<Record<string, string>>({});

  const allergies = (client.allergies as Array<Record<string, string>>) || [];
  const careNeeds = client.care_needs as Record<string, unknown> | null;
  const emergencyContacts = (client.emergency_contact as Array<Record<string, string>>) || [];
  const gpDetails = client.gp_details as Record<string, string> | null;

  const startVisit = async () => {
    await supabase.from("visits").update({
      status: "in_progress",
      actual_start: new Date().toISOString(),
    }).eq("id", String(visit.id));
    setVisitStatus("in_progress");
  };

  const transcribeVoice = async () => {
    // In production: record audio, send to /api/voice/transcribe
    setRecording(!recording);
  };

  const summariseWithAI = async () => {
    if (!noteText.trim()) return;
    setSummarising(true);
    try {
      const res = await fetch("/api/ai/summarise-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: noteText, client_id: client.id, visit_id: visit.id }),
      });
      const data = await res.json();
      setAiSummary(data.structured);
    } finally {
      setSummarising(false);
    }
  };

  const completeVisit = async () => {
    setSaving(true);
    try {
      // Save note
      if (noteText.trim()) {
        await supabase.from("visit_notes").insert({
          visit_id: String(visit.id),
          client_id: String(client.id),
          content: noteText,
          ai_structured: aiSummary,
          sentiment: aiSummary ? String((aiSummary as Record<string, string>).sentiment || "neutral") : null,
          is_family_visible: true,
          is_internal: false,
        });
      }

      // Save medication records
      for (const [medId, status] of Object.entries(medRecords)) {
        await supabase.from("medication_records").insert({
          medication_id: medId,
          client_id: String(client.id),
          visit_id: String(visit.id),
          status,
          administered_at: new Date().toISOString(),
        });
      }

      // Complete visit
      await supabase.from("visits").update({
        status: "completed",
        actual_end: new Date().toISOString(),
        tasks_completed: checkedTasks,
      }).eq("id", String(visit.id));

      router.push("/carer");
    } finally {
      setSaving(false);
    }
  };

  const triggerEmergency = async () => {
    const confirmed = window.confirm("⚠️ TRIGGER EMERGENCY SOS? This will alert your on-call manager and the client's emergency contacts.");
    if (!confirmed) return;

    await fetch("/api/emergency/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: client.id,
        visit_id: visit.id,
        organisation_id: visit.organisation_id,
      }),
    });
    alert("Emergency SOS sent. Help is on the way.");
  };

  return (
    <div className="pb-4">
      {/* DNR banner */}
      {Boolean(client.dnr_status) && (
        <div className="-mx-4 -mt-4 mb-4">
          <CRAlertBanner
            variant="red"
            title="⚠️ DNR ORDER IN PLACE"
            description="Do Not Resuscitate. Confirm with GP before any attempt."
          />
        </div>
      )}

      {/* Anaphylactic allergy warning */}
      {allergies.some((a) => a.severity === "anaphylactic") && (
        <div className="-mx-4 mb-4">
          <CRAlertBanner
            variant="red"
            title="ANAPHYLACTIC ALLERGY"
            description={allergies.filter((a) => a.severity === "anaphylactic").map((a) => a.name).join(", ")}
          />
        </div>
      )}

      {/* Client + visit header */}
      <CRCard className="!p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <h1 className="font-display text-xl font-semibold text-cr-charcoal">
              {String(client.first_name)} {String(client.last_name)}
            </h1>
            <p className="text-xs text-cr-slate">
              {formatTimeUK(String(visit.scheduled_start))} — {formatTimeUK(String(visit.scheduled_end))}
            </p>
          </div>
          <CRBadge variant={visitStatus === "completed" ? "green" : visitStatus === "in_progress" ? "forest" : "slate"}>
            {visitStatus}
          </CRBadge>
        </div>

        {visitStatus === "scheduled" && (
          <button
            onClick={startVisit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cr-forest text-white rounded-xl font-body font-semibold text-sm"
          >
            <Play size={16} /> Start Visit
          </button>
        )}

        {visitStatus === "in_progress" && (
          <div className="flex gap-2">
            <button
              onClick={completeVisit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-cr-forest text-white rounded-xl font-body font-semibold text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {saving ? "Saving..." : "Complete Visit"}
            </button>
          </div>
        )}
      </CRCard>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-body font-medium whitespace-nowrap transition-all",
              activeTab === tab
                ? "bg-cr-forest text-white"
                : "bg-white text-cr-charcoal border border-gray-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === "Tasks" && (
        <div className="space-y-3">
          {careNeeds && (
            <>
              {([
                { key: "personal_care", label: "Personal Care" },
                { key: "meal_tasks", label: "Meals & Nutrition" },
                { key: "mobility_tasks", label: "Mobility" },
                { key: "domestic_tasks", label: "Domestic & Social" },
              ] as const).map(({ key, label }) => {
                const tasks = (careNeeds[key] as string[]) || [];
                if (tasks.length === 0) return null;
                return (
                  <CRCard key={key} className="!p-4">
                    <h3 className="font-body font-semibold text-cr-charcoal mb-3">{label}</h3>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <label key={task} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checkedTasks.includes(task)}
                            onChange={() => setCheckedTasks((prev) =>
                              prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
                            )}
                            className="w-5 h-5 accent-cr-forest"
                          />
                          <span className={cn("text-sm font-body", checkedTasks.includes(task) ? "line-through text-cr-slate" : "text-cr-charcoal")}>
                            {task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </CRCard>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Care Plan tab — logs view to care_plan_views on first open */}
      {activeTab === "Care Plan" && (
        <CarePlanTabWithLogging
          carePlan={carePlan}
          visit={visit}
          supabase={supabase}
        />
      )}

      {/* Medications tab */}
      {activeTab === "Medications" && (
        <div className="space-y-3">
          {allergies.length > 0 && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-xs font-body font-bold text-cr-red mb-1">ALLERGIES</p>
              {allergies.map((a, i) => (
                <p key={i} className="text-sm font-body">
                  {a.name} — <span className="font-semibold capitalize">{a.severity}</span>
                </p>
              ))}
            </div>
          )}
          {medications.length === 0 ? (
            <p className="text-sm text-cr-slate text-center py-8">No medications to administer</p>
          ) : (
            medications.map((med) => (
              <CRCard key={String(med.id)} className="!p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-body font-semibold text-cr-charcoal">{String(med.name)}</p>
                    <p className="text-xs text-cr-slate">{String(med.dosage || "")} · {String(med.frequency || "")}</p>
                  </div>
                  <Pill size={16} className="text-cr-forest" />
                </div>
                <div className="flex gap-2">
                  {["given", "refused", "not_available"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMedRecords((prev) => ({ ...prev, [String(med.id)]: s }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-body font-medium transition-all",
                        medRecords[String(med.id)] === s
                          ? s === "given" ? "bg-cr-forest text-white" : "bg-cr-red text-white"
                          : "bg-gray-100 text-cr-charcoal"
                      )}
                    >
                      {s === "given" ? "Given" : s === "refused" ? "Refused" : "N/A"}
                    </button>
                  ))}
                </div>
              </CRCard>
            ))
          )}
        </div>
      )}

      {/* Meals tab */}
      {activeTab === "Meals" && (
        <div className="space-y-3">
          {nutritionProfile && (
            <div className="p-3 bg-cr-mint rounded-xl">
              <p className="text-xs font-body font-semibold text-cr-forest mb-1">Dietary Notes</p>
              <div className="flex flex-wrap gap-1">
                {(nutritionProfile.diet_types as string[] || []).map((d) => (
                  <CRBadge key={d} variant="forest">{d}</CRBadge>
                ))}
                {!!nutritionProfile.texture_level && String(nutritionProfile.texture_level) !== "regular" && (
                  <CRBadge variant="amber">Texture: {String(nutritionProfile.texture_level).replace(/_/g, " ")}</CRBadge>
                )}
              </div>
            </div>
          )}
          {mealPreferences.map((pref) => {
            const steps = (pref.preparation_steps as string[]) || [];
            return (
              <CRCard key={String(pref.id)} className="!p-4">
                <h3 className="font-body font-semibold text-cr-charcoal mb-2">{String(pref.meal_time)}</h3>
                {pref.preferred_items != null && (
                  <p className="text-sm font-body text-cr-slate mb-3">{String(pref.preferred_items)}</p>
                )}
                {steps.length > 0 && <CRStepList steps={steps.map((s: string, i: number) => ({ step: i + 1, instruction: s }))} large />}
              </CRCard>
            );
          })}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === "Notes" && (
        <div className="space-y-4">
          <CRCard className="!p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-body font-semibold text-cr-charcoal">Visit Note</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={transcribeVoice}
                  className={cn("p-2 rounded-full", recording ? "bg-cr-red text-white" : "bg-gray-100 text-cr-charcoal")}
                >
                  {recording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={6}
              placeholder="Record what happened during this visit: how the client was feeling, what tasks were completed, any concerns..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 resize-none"
            />
            <button
              onClick={summariseWithAI}
              disabled={summarising || !noteText.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-cr-forest text-cr-forest rounded-lg text-sm font-body hover:bg-cr-mint disabled:opacity-50"
            >
              {summarising ? <Loader2 size={14} className="animate-spin" /> : null}
              {summarising ? "Summarising..." : "Summarise"}
            </button>
          </CRCard>

          {aiSummary && (
            <CRCard className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-body font-semibold text-cr-charcoal">Summary</p>
                <CRAIBadge size="sm" />
              </div>
              {Object.entries(aiSummary).map(([key, val]) => !!val && (
                <div key={key} className="mb-2">
                  <p className="text-xs font-body font-semibold text-cr-charcoal capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-sm font-body text-cr-slate">{String(val)}</p>
                </div>
              ))}
            </CRCard>
          )}

          {/* Emergency contacts quick access */}
          {emergencyContacts.length > 0 && (
            <CRCard className="!p-4">
              <p className="text-xs font-body font-semibold text-cr-charcoal mb-2">Emergency Contacts</p>
              {emergencyContacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-2 py-2 text-sm font-body"
                >
                  <Phone size={14} className="text-cr-forest" />
                  <span className="text-cr-charcoal">{c.name}</span>
                  <span className="text-cr-forest ml-auto">{c.phone}</span>
                </a>
              ))}
            </CRCard>
          )}
        </div>
      )}

      {/* Emergency SOS button */}
      <CREmergencyButton
        onClick={triggerEmergency}
      />
    </div>
  );
}

// Logs care_plan_views when carer opens the care plan tab
function CarePlanTabWithLogging({
  carePlan,
  visit,
  supabase,
}: {
  carePlan: Record<string, unknown> | null;
  visit: Record<string, unknown>;
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>;
}) {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!carePlan || logged) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("care_plan_views").insert({
        care_plan_id: carePlan.id as string,
        client_id: carePlan.client_id as string,
        carer_id: user.id,
        visit_id: visit.id as string,
        viewed_at: new Date().toISOString(),
      }).then(() => setLogged(true));
    });
  }, [carePlan, logged, supabase, visit.id]);

  if (!carePlan) {
    return (
      <CRCard className="!p-4 text-center">
        <FileText size={32} className="mx-auto mb-2 text-cr-slate" />
        <p className="text-sm text-cr-slate">No approved care plan</p>
        <p className="text-xs text-cr-slate mt-1">Care plan is pending manager approval</p>
      </CRCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <CRBadge variant="green">Active</CRBadge>
        <CRAIBadge size="sm" />
      </div>
      {Object.entries((carePlan.content as Record<string, string>) || {}).map(([key, val]) => (
        <CRCard key={key} className="!p-4">
          <h4 className="text-sm font-body font-semibold text-cr-charcoal mb-1 capitalize">{key.replace(/_/g, " ")}</h4>
          <p className="text-sm font-body text-cr-charcoal leading-relaxed">{val}</p>
        </CRCard>
      ))}
    </div>
  );
}
