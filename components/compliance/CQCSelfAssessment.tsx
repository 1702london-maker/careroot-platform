"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, CheckCircle, Plus, Trash2 } from "lucide-react";

type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate" | "";

interface SectionState {
  rating: Rating;
  notes: string;
  actionPoints: { text: string; owner: string; due_date: string }[];
  open: boolean;
  saving: boolean;
  saved: boolean;
}

interface CQCSection {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  statements: string[];
}

interface Props {
  orgId: string;
  sections: CQCSection[];
  existingSelfAssessments: Record<string, { rating: string; notes: string; action_points?: unknown[] }>;
}

const RATINGS: { value: Rating; label: string; color: string }[] = [
  { value: "outstanding", label: "Outstanding", color: "text-green-700 bg-green-50 border-green-200" },
  { value: "good", label: "Good", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "requires_improvement", label: "Requires Improvement", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "inadequate", label: "Inadequate", color: "text-red-700 bg-red-50 border-red-200" },
];

function ratingBadge(rating: string) {
  const r = RATINGS.find(r => r.value === rating);
  if (!r) return null;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${r.color}`}>
      {r.label}
    </span>
  );
}

export function CQCSelfAssessment({ orgId, sections, existingSelfAssessments }: Props) {
  const supabase = createClient();

  const [states, setStates] = useState<Record<string, SectionState>>(() => {
    const init: Record<string, SectionState> = {};
    sections.forEach(s => {
      const existing = existingSelfAssessments[s.id];
      init[s.id] = {
        rating: (existing?.rating as Rating) ?? "",
        notes: existing?.notes ?? "",
        actionPoints: (existing?.action_points as never[]) ?? [],
        open: false,
        saving: false,
        saved: false,
      };
    });
    return init;
  });

  const update = (sectionId: string, patch: Partial<SectionState>) => {
    setStates(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], ...patch } }));
  };

  const addActionPoint = (sectionId: string) => {
    update(sectionId, {
      actionPoints: [...states[sectionId].actionPoints, { text: "", owner: "", due_date: "" }],
    });
  };

  const updateActionPoint = (sectionId: string, i: number, k: string, v: string) => {
    const aps = states[sectionId].actionPoints.map((ap, idx) =>
      idx === i ? { ...ap, [k]: v } : ap
    );
    update(sectionId, { actionPoints: aps });
  };

  const removeActionPoint = (sectionId: string, i: number) => {
    update(sectionId, {
      actionPoints: states[sectionId].actionPoints.filter((_, idx) => idx !== i),
    });
  };

  const save = async (sectionId: string) => {
    const s = states[sectionId];
    update(sectionId, { saving: true, saved: false });

    const existing = existingSelfAssessments[sectionId];
    const payload = {
      organisation_id: orgId,
      framework: "cqc",
      category: sectionId,
      requirement: "_self_assessment",
      status: s.rating || "not_assessed",
      notes: s.notes,
      action_points: s.actionPoints.filter(ap => ap.text.trim()),
    };

    if (existing) {
      await supabase
        .from("compliance_evidence")
        .update(payload)
        .eq("organisation_id", orgId)
        .eq("framework", "cqc")
        .eq("category", sectionId)
        .eq("requirement", "_self_assessment");
    } else {
      await supabase.from("compliance_evidence").insert(payload);
    }

    update(sectionId, { saving: false, saved: true });
    setTimeout(() => update(sectionId, { saved: false }), 2000);
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="font-display text-lg font-semibold text-cr-charcoal">Self-Assessment by Key Question</h2>
      <p className="text-sm text-cr-slate">
        Record your organisation&apos;s self-assessed rating and action plan for each CQC key question.
      </p>

      {sections.map(section => {
        const s = states[section.id];
        return (
          <div key={section.id} className={`border rounded-card ${section.border}`}>
            <button
              onClick={() => update(section.id, { open: !s.open })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-card text-left ${section.bg}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`font-display text-base font-semibold ${section.color}`}>{section.label}</span>
                  {s.rating && ratingBadge(s.rating)}
                </div>
              </div>
              {s.open ? <ChevronUp size={16} className={section.color} /> : <ChevronDown size={16} className={section.color} />}
            </button>

            {s.open && (
              <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100">
                {/* Rating */}
                <div>
                  <p className="text-sm font-semibold text-cr-charcoal mb-2">Our self-assessed rating</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {RATINGS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => update(section.id, { rating: r.value })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                          s.rating === r.value ? r.color : "border-gray-200 text-cr-slate hover:bg-gray-50"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-semibold text-cr-charcoal mb-2">Evidence & rationale</p>
                  <textarea
                    value={s.notes}
                    onChange={e => update(section.id, { notes: e.target.value })}
                    rows={3}
                    placeholder="Describe the evidence supporting this rating..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 resize-none"
                  />
                </div>

                {/* Action points */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-cr-charcoal">Action Plan</p>
                    <button
                      onClick={() => addActionPoint(section.id)}
                      className="text-xs text-cr-forest font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> Add action
                    </button>
                  </div>
                  {s.actionPoints.length === 0 ? (
                    <p className="text-xs text-cr-slate">No actions added</p>
                  ) : (
                    <div className="space-y-3">
                      {s.actionPoints.map((ap, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cr-slate font-medium">Action {i + 1}</span>
                            <button onClick={() => removeActionPoint(section.id, i)} className="text-cr-slate hover:text-cr-red">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={ap.text}
                            onChange={e => updateActionPoint(section.id, i, "text", e.target.value)}
                            placeholder="Action required..."
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cr-forest/30"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={ap.owner}
                              onChange={e => updateActionPoint(section.id, i, "owner", e.target.value)}
                              placeholder="Owner"
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cr-forest/30"
                            />
                            <input
                              type="date"
                              value={ap.due_date}
                              onChange={e => updateActionPoint(section.id, i, "due_date", e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cr-forest/30"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => save(section.id)}
                    disabled={s.saving}
                    className="cr-btn-primary text-sm px-5 py-2"
                  >
                    {s.saving ? "Saving..." : "Save"}
                  </button>
                  {s.saved && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle size={13} /> Saved
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
