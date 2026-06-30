"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Heart, AlertTriangle, CheckCircle, Loader2, Plus } from "lucide-react";

type Check = {
  id: string;
  check_type: string;
  wellbeing_status: string;
  notes: string | null;
  flagged_for_manager: boolean;
  server_timestamp: string;
  manager_acknowledged_at: string | null;
  staff: { id: string; first_name: string; last_name: string } | null;
};

type StaffMember = { id: string; first_name: string; last_name: string };

const STATUS_COLOR: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  concerned: "bg-amber-100 text-amber-700",
  distressed: "bg-red-100 text-red-700",
};

export function WellbeingDashboard({ checks, staff }: { checks: unknown[]; staff: StaffMember[] }) {
  const list = checks as Check[];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_id: "", check_type: "post_incident", wellbeing_status: "good", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const flagged = list.filter(c => c.flagged_for_manager && !c.manager_acknowledged_at).length;

  async function submitCheck(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/staff-wellbeing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setShowForm(false);
    window.location.reload();
  }

  async function acknowledge(id: string) {
    setAcknowledging(id);
    await fetch(`/api/staff-wellbeing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_acknowledged_at: new Date().toISOString() }),
    });
    setAcknowledging(null);
    window.location.reload();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CRPageHeader
        title="Staff Wellbeing"
        subtitle="Track staff wellbeing checks, especially after incidents."
        action={
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-cr-forest text-white rounded-lg text-sm font-semibold">
            <Plus size={16} /> Log Check
          </button>
        }
      />

      {flagged > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={16} /> {flagged} wellbeing check{flagged > 1 ? "s" : ""} flagged and awaiting your acknowledgement
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-cr-charcoal mb-4">Log Wellbeing Check</h3>
          <form onSubmit={submitCheck} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">Staff Member</label>
              <select required value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-cr-forest bg-white">
                <option value="">Select staff member</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cr-slate mb-1.5">Check Type</label>
                <select value={form.check_type} onChange={e => setForm(f => ({ ...f, check_type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-cr-forest bg-white">
                  <option value="post_incident">Post Incident</option>
                  <option value="post_pi">Post PI</option>
                  <option value="routine">Routine</option>
                  <option value="return_to_work">Return to Work</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cr-slate mb-1.5">Status</label>
                <select value={form.wellbeing_status} onChange={e => setForm(f => ({ ...f, wellbeing_status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-cr-forest bg-white">
                  <option value="good">Good</option>
                  <option value="concerned">Concerned</option>
                  <option value="distressed">Distressed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-cr-slate mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
            </div>
            <button type="submit" disabled={submitting || !form.staff_id}
              className="px-5 py-2.5 bg-cr-forest text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />} Save Check
            </button>
          </form>
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Heart size={32} className="mx-auto mb-2 text-cr-slate opacity-40" />
          <p className="text-sm text-cr-slate">No wellbeing checks recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(check => (
            <div key={check.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-3 ${check.flagged_for_manager && !check.manager_acknowledged_at ? "border-red-200" : "border-gray-100"}`}>
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${STATUS_COLOR[check.wellbeing_status] || "bg-gray-100 text-gray-500"}`}>
                  <Heart size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-cr-charcoal">
                    {check.staff ? `${check.staff.first_name} ${check.staff.last_name}` : "Unknown"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[check.wellbeing_status] || "bg-gray-100 text-gray-500"}`}>
                      {check.wellbeing_status}
                    </span>
                    <span className="text-[10px] text-cr-slate capitalize">{check.check_type.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-cr-slate">{new Date(check.server_timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {check.notes && <p className="text-xs text-cr-slate mt-1">{check.notes}</p>}
                </div>
              </div>
              <div className="flex-shrink-0">
                {check.flagged_for_manager && !check.manager_acknowledged_at ? (
                  <button onClick={() => acknowledge(check.id)} disabled={acknowledging === check.id}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
                    {acknowledging === check.id ? <Loader2 size={10} className="animate-spin" /> : null}
                    Acknowledge
                  </button>
                ) : check.manager_acknowledged_at ? (
                  <div className="flex items-center gap-1 text-xs text-green-700"><CheckCircle size={12} /> Acknowledged</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
