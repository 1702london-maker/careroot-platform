"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { Plus, Trash2, CheckCircle } from "lucide-react";

type StaffMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  job_title?: string;
};

interface Props {
  staffMembers: StaffMember[];
  defaultStaffId: string;
  defaultStaffMember: StaffMember | null;
  supervisorId: string;
  supervisorName: string;
  orgId: string;
}

const SUPERVISION_TYPES = [
  { value: "one_to_one", label: "One-to-One" },
  { value: "group", label: "Group Supervision" },
  { value: "reflective_practice", label: "Reflective Practice" },
  { value: "peer", label: "Peer Supervision" },
  { value: "clinical", label: "Clinical Supervision" },
  { value: "probationary", label: "Probationary Review" },
  { value: "return_to_work", label: "Return to Work" },
];

export function SupervisionNewForm({
  staffMembers, defaultStaffId, supervisorId, supervisorName, orgId
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    staff_id: defaultStaffId,
    supervision_type: "one_to_one",
    scheduled_date: new Date().toISOString().slice(0, 10),
    completed_date: new Date().toISOString().slice(0, 10),
    duration_minutes: 60,
    notes: "",
    next_due_date: "",
    status: "completed",
  });
  const [actionPoints, setActionPoints] = useState<{ text: string; owner: string; due_date: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const addActionPoint = () => {
    setActionPoints(prev => [...prev, { text: "", owner: "", due_date: "" }]);
  };

  const updateActionPoint = (i: number, k: string, v: string) => {
    setActionPoints(prev => prev.map((ap, idx) => idx === i ? { ...ap, [k]: v } : ap));
  };

  const removeActionPoint = (i: number) => {
    setActionPoints(prev => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.staff_id) e.staff_id = "Please select a staff member";
    if (!form.completed_date) e.completed_date = "Completion date is required";
    if (!form.notes.trim()) e.notes = "Notes are required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const filledActionPoints = actionPoints.filter(ap => ap.text.trim());

    const { error } = await supabase.from("staff_supervision").insert({
      organisation_id: orgId,
      staff_id: form.staff_id,
      supervisor_id: supervisorId,
      supervision_type: form.supervision_type,
      scheduled_date: form.scheduled_date || null,
      completed_date: form.completed_date,
      duration_minutes: Number(form.duration_minutes),
      notes: form.notes,
      action_points: filledActionPoints,
      next_due_date: form.next_due_date || null,
      status: form.status,
    });

    setSaving(false);

    if (error) {
      setErrors({ _: "Failed to save supervision. Please try again." });
      return;
    }

    setSaved(true);
    setTimeout(() => {
      router.push(form.staff_id ? `/staff/${form.staff_id}` : "/staff/supervisions");
    }, 1200);
  };

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto">
        <CRCard>
          <div className="text-center py-10">
            <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-1">Supervision Logged</h2>
            <p className="text-sm text-cr-slate">Redirecting to staff profile...</p>
          </div>
        </CRCard>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      {errors._ && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-cr-red">
          {errors._}
        </div>
      )}

      {/* Staff & Type */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-4">Session Details</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">
              Staff Member <span className="text-cr-red">*</span>
            </label>
            <select
              value={form.staff_id}
              onChange={e => set("staff_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            >
              <option value="">Select staff member</option>
              {staffMembers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} — {s.job_title ?? s.role}
                </option>
              ))}
            </select>
            {errors.staff_id && <p className="text-xs text-cr-red mt-1">{errors.staff_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">Supervision Type</label>
            <select
              value={form.supervision_type}
              onChange={e => set("supervision_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            >
              {SUPERVISION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">Scheduled Date</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={e => set("scheduled_date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">
                Completed Date <span className="text-cr-red">*</span>
              </label>
              <input
                type="date"
                value={form.completed_date}
                onChange={e => set("completed_date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
              {errors.completed_date && <p className="text-xs text-cr-red mt-1">{errors.completed_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={e => set("duration_minutes", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">Supervisor</label>
              <input
                type="text"
                value={supervisorName}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-cr-slate"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            >
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="dna">Did Not Attend</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </CRCard>

      {/* Notes */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-4">Supervision Notes</h3>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          rows={6}
          placeholder="Record key discussion points, concerns raised, progress reviewed, and any wellbeing matters discussed during this supervision session..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 resize-none"
        />
        {errors.notes && <p className="text-xs text-cr-red mt-1">{errors.notes}</p>}
      </CRCard>

      {/* Action Points */}
      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-cr-charcoal">Action Points</h3>
          <button
            type="button"
            onClick={addActionPoint}
            className="flex items-center gap-1.5 text-xs text-cr-forest font-medium hover:underline"
          >
            <Plus size={13} /> Add action
          </button>
        </div>

        {actionPoints.length === 0 ? (
          <p className="text-sm text-cr-slate text-center py-4">No action points added</p>
        ) : (
          <div className="space-y-4">
            {actionPoints.map((ap, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cr-slate">Action {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeActionPoint(i)}
                    className="text-cr-slate hover:text-cr-red transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={ap.text}
                  onChange={e => updateActionPoint(i, "text", e.target.value)}
                  placeholder="Describe the action required..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-cr-slate mb-1">Owner</label>
                    <input
                      type="text"
                      value={ap.owner}
                      onChange={e => updateActionPoint(i, "owner", e.target.value)}
                      placeholder="Name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-slate mb-1">Due Date</label>
                    <input
                      type="date"
                      value={ap.due_date}
                      onChange={e => updateActionPoint(i, "due_date", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CRCard>

      {/* Next supervision */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-4">Next Supervision</h3>
        <div>
          <label className="block text-sm font-medium text-cr-charcoal mb-1">Next due date</label>
          <input
            type="date"
            value={form.next_due_date}
            onChange={e => set("next_due_date", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
          />
          <p className="text-xs text-cr-slate mt-1">Recommended: monthly for first 3 months, then quarterly</p>
        </div>
      </CRCard>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-6">
        <button
          type="submit"
          disabled={saving}
          className="cr-btn-primary flex-1 py-3"
        >
          {saving ? "Saving..." : "Save Supervision Record"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 border border-gray-300 rounded-btn text-sm font-medium text-cr-slate hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
