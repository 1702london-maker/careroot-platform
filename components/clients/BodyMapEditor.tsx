"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CheckCircle, AlertCircle, XCircle, Trash2 } from "lucide-react";

export type BodyRegion = {
  id: string;
  region_key: string;
  region_label: string;
  alert_level: "normal" | "monitor" | "attention";
  care_instruction: string;
  notes?: string;
};

interface Props {
  clientId: string;
  orgId: string;
  solutionType?: string;
  initialInjuries?: BodyRegion[];
  readonly?: boolean;
}

const BODY_REGIONS = [
  // Front
  { key: "head", label: "Head / Face", side: "front", x: 160, y: 30, r: 28 },
  { key: "neck", label: "Neck", side: "front", x: 160, y: 75, r: 14 },
  { key: "chest", label: "Chest", side: "front", x: 160, y: 115, r: 28 },
  { key: "abdomen", label: "Abdomen", side: "front", x: 160, y: 165, r: 22 },
  { key: "l_shoulder", label: "Left Shoulder", side: "front", x: 110, y: 100, r: 16 },
  { key: "r_shoulder", label: "Right Shoulder", side: "front", x: 210, y: 100, r: 16 },
  { key: "l_arm", label: "Left Arm", side: "front", x: 90, y: 145, r: 14 },
  { key: "r_arm", label: "Right Arm", side: "front", x: 230, y: 145, r: 14 },
  { key: "l_hand", label: "Left Hand", side: "front", x: 75, y: 195, r: 12 },
  { key: "r_hand", label: "Right Hand", side: "front", x: 245, y: 195, r: 12 },
  { key: "l_hip", label: "Left Hip", side: "front", x: 125, y: 210, r: 16 },
  { key: "r_hip", label: "Right Hip", side: "front", x: 195, y: 210, r: 16 },
  { key: "l_thigh", label: "Left Thigh", side: "front", x: 130, y: 255, r: 16 },
  { key: "r_thigh", label: "Right Thigh", side: "front", x: 190, y: 255, r: 16 },
  { key: "l_knee", label: "Left Knee", side: "front", x: 130, y: 295, r: 12 },
  { key: "r_knee", label: "Right Knee", side: "front", x: 190, y: 295, r: 12 },
  { key: "l_calf", label: "Left Calf", side: "front", x: 130, y: 335, r: 12 },
  { key: "r_calf", label: "Right Calf", side: "front", x: 190, y: 335, r: 12 },
  { key: "l_foot", label: "Left Foot", side: "front", x: 125, y: 370, r: 12 },
  { key: "r_foot", label: "Right Foot", side: "front", x: 195, y: 370, r: 12 },
  // Back
  { key: "upper_back", label: "Upper Back", side: "back", x: 160, y: 110, r: 26 },
  { key: "lower_back", label: "Lower Back", side: "back", x: 160, y: 165, r: 22 },
  { key: "sacrum", label: "Sacrum / Coccyx", side: "back", x: 160, y: 205, r: 16 },
  { key: "l_buttock", label: "Left Buttock", side: "back", x: 125, y: 220, r: 16 },
  { key: "r_buttock", label: "Right Buttock", side: "back", x: 195, y: 220, r: 16 },
  { key: "l_heel", label: "Left Heel", side: "back", x: 125, y: 375, r: 12 },
  { key: "r_heel", label: "Right Heel", side: "back", x: 195, y: 375, r: 12 },
  { key: "l_elbow", label: "Left Elbow", side: "back", x: 82, y: 165, r: 12 },
  { key: "r_elbow", label: "Right Elbow", side: "back", x: 238, y: 165, r: 12 },
];

const ALERT_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  attention: { fill: "#FEE2E2", stroke: "#DC2626", text: "text-cr-red" },
  monitor: { fill: "#FEF3C7", stroke: "#F59E0B", text: "text-amber-600" },
  normal: { fill: "#D1FAE5", stroke: "#10B981", text: "text-green-600" },
  none: { fill: "#F3F4F6", stroke: "#D1D5DB", text: "text-cr-slate" },
};

export function BodyMapEditor({ clientId, orgId, initialInjuries = [], readonly = false }: Props) {
  const supabase = createClient();
  const [view, setView] = useState<"front" | "back">("front");
  const [injuries, setInjuries] = useState<BodyRegion[]>(initialInjuries);
  const [selected, setSelected] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BodyRegion> | null>(null);
  const [saving, setSaving] = useState(false);

  const injuryMap = Object.fromEntries(injuries.map(i => [i.region_key, i]));

  const handleRegionClick = (regionKey: string, regionLabel: string) => {
    if (readonly) {
      setSelected(regionKey);
      return;
    }
    const existing = injuryMap[regionKey];
    setSelected(regionKey);
    setEditForm(existing ?? {
      region_key: regionKey,
      region_label: regionLabel,
      alert_level: "monitor",
      care_instruction: "",
      notes: "",
    });
  };

  const handleSave = async () => {
    if (!editForm?.region_key) return;
    setSaving(true);
    const existing = injuryMap[editForm.region_key];

    if (existing) {
      await supabase.from("body_map_injuries").update({
        alert_level: editForm.alert_level,
        care_instruction: editForm.care_instruction,
        notes: editForm.notes,
      }).eq("id", existing.id);
      setInjuries(prev => prev.map(i => i.region_key === editForm.region_key ? { ...i, ...editForm } as BodyRegion : i));
    } else {
      const { data } = await supabase.from("body_map_injuries").insert({
        client_id: clientId,
        organisation_id: orgId,
        region_key: editForm.region_key,
        region_label: editForm.region_label,
        alert_level: editForm.alert_level,
        care_instruction: editForm.care_instruction,
        notes: editForm.notes,
      }).select().single();
      if (data) setInjuries(prev => [...prev, data]);
    }

    setSaving(false);
    setEditForm(null);
  };

  const handleDelete = async (regionKey: string) => {
    const existing = injuryMap[regionKey];
    if (!existing) return;
    await supabase.from("body_map_injuries").delete().eq("id", existing.id);
    setInjuries(prev => prev.filter(i => i.region_key !== regionKey));
    setSelected(null);
    setEditForm(null);
  };

  const visibleRegions = BODY_REGIONS.filter(r => r.side === view);
  const markedCount = injuries.length;
  const attentionCount = injuries.filter(i => i.alert_level === "attention").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-cr-charcoal">{markedCount}</p>
          <p className="text-xs text-cr-slate">Areas marked</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className={`text-2xl font-bold ${attentionCount > 0 ? "text-cr-red" : "text-green-600"}`}>{attentionCount}</p>
          <p className="text-xs text-cr-slate">Need attention</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{injuries.filter(i => i.alert_level === "monitor").length}</p>
          <p className="text-xs text-cr-slate">Monitor</p>
        </CRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SVG Body Map */}
        <CRCard>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-cr-charcoal text-sm">Body Map</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setView("front")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${view === "front" ? "bg-cr-forest text-white" : "border border-gray-200 text-cr-slate"}`}
              >
                Front
              </button>
              <button
                onClick={() => setView("back")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${view === "back" ? "bg-cr-forest text-white" : "border border-gray-200 text-cr-slate"}`}
              >
                Back
              </button>
            </div>
          </div>

          {!readonly && (
            <p className="text-xs text-cr-slate mb-3">Tap a body area to mark it</p>
          )}

          <svg viewBox="0 0 320 400" className="w-full max-w-[280px] mx-auto">
            {/* Simple body outline */}
            <ellipse cx="160" cy="30" rx="24" ry="26" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="130" y="68" width="60" height="8" rx="4" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="108" y="80" width="84" height="100" rx="12" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="70" y="85" width="34" height="80" rx="8" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="216" y="85" width="34" height="80" rx="8" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <ellipse cx="75" cy="195" rx="14" ry="16" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <ellipse cx="245" cy="195" rx="14" ry="16" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="110" y="182" width="80" height="80" rx="8" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="112" y="264" width="36" height="80" rx="8" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <rect x="172" y="264" width="36" height="80" rx="8" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <ellipse cx="130" cy="355" rx="18" ry="22" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />
            <ellipse cx="190" cy="355" rx="18" ry="22" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />

            {/* Clickable regions */}
            {visibleRegions.map(region => {
              const inj = injuryMap[region.key];
              const colors = inj ? ALERT_COLORS[inj.alert_level] : ALERT_COLORS.none;
              const isSelected = selected === region.key;
              return (
                <circle
                  key={region.key}
                  cx={region.x}
                  cy={region.y}
                  r={region.r}
                  fill={inj ? colors.fill : "transparent"}
                  stroke={isSelected ? "#1B4332" : inj ? colors.stroke : "transparent"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="cursor-pointer transition-all"
                  onClick={() => handleRegionClick(region.key, region.label)}
                >
                  <title>{region.label}{inj ? `: ${inj.alert_level}` : ""}</title>
                </circle>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 justify-center text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-200 border border-cr-red inline-block" /> Needs attention</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400 inline-block" /> Monitor</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-400 inline-block" /> Normal</span>
          </div>
        </CRCard>

        {/* Edit panel */}
        <div className="space-y-3">
          {/* All marked areas */}
          <CRCard>
            <h3 className="font-semibold text-cr-charcoal text-sm mb-3">Care Areas</h3>
            {injuries.length === 0 ? (
              <p className="text-xs text-cr-slate text-center py-4">No areas marked{!readonly ? " — tap the body to add" : ""}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {injuries.map(inj => (
                  <div
                    key={inj.id}
                    onClick={() => { setSelected(inj.region_key); if (!readonly) setEditForm(inj); }}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer border transition-colors
                      ${selected === inj.region_key ? "border-cr-forest bg-cr-mint" : "border-gray-100 hover:bg-gray-50"}`}
                  >
                    {inj.alert_level === "attention" && <XCircle size={14} className="text-cr-red flex-shrink-0 mt-0.5" />}
                    {inj.alert_level === "monitor" && <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                    {inj.alert_level === "normal" && <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-cr-charcoal">{inj.region_label}</p>
                      <p className="text-xs text-cr-slate truncate">{inj.care_instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CRCard>

          {/* Edit form */}
          {editForm && !readonly && (
            <CRCard>
              <h3 className="font-semibold text-cr-charcoal text-sm mb-3">{editForm.region_label}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-cr-charcoal mb-1">Alert Level</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["attention", "monitor", "normal"] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setEditForm(f => f ? { ...f, alert_level: level } : f)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors capitalize
                          ${editForm.alert_level === level
                            ? level === "attention" ? "bg-red-100 border-cr-red text-cr-red"
                              : level === "monitor" ? "bg-amber-100 border-amber-400 text-amber-700"
                              : "bg-green-100 border-green-400 text-green-700"
                            : "border-gray-200 text-cr-slate"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-cr-charcoal mb-1">Care instruction <span className="text-cr-red">*</span></label>
                  <textarea
                    value={editForm.care_instruction ?? ""}
                    onChange={e => setEditForm(f => f ? { ...f, care_instruction: e.target.value } : f)}
                    rows={2}
                    placeholder="What care is required for this area?"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cr-forest/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cr-charcoal mb-1">Additional notes</label>
                  <input
                    type="text"
                    value={editForm.notes ?? ""}
                    onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)}
                    placeholder="e.g. wound size, dressing type"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cr-forest/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editForm.care_instruction?.trim()}
                    className="cr-btn-primary text-xs px-4 py-1.5 flex-1"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  {injuryMap[editForm.region_key ?? ""] && (
                    <button
                      onClick={() => handleDelete(editForm.region_key!)}
                      className="px-3 py-1.5 border border-cr-red text-cr-red rounded-lg text-xs hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditForm(null); setSelected(null); }}
                    className="px-3 py-1.5 border border-gray-200 text-cr-slate rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </CRCard>
          )}

          {/* Readonly selected detail */}
          {readonly && selected && injuryMap[selected] && (
            <CRCard>
              <h3 className="font-semibold text-cr-charcoal text-sm mb-2">{injuryMap[selected].region_label}</h3>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2 capitalize
                ${injuryMap[selected].alert_level === "attention" ? "bg-red-100 text-cr-red"
                  : injuryMap[selected].alert_level === "monitor" ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"}`}>
                {injuryMap[selected].alert_level}
              </div>
              <p className="text-sm text-cr-charcoal font-medium">{injuryMap[selected].care_instruction}</p>
              {injuryMap[selected].notes && (
                <p className="text-xs text-cr-slate mt-1">{injuryMap[selected].notes}</p>
              )}
            </CRCard>
          )}
        </div>
      </div>
    </div>
  );
}
