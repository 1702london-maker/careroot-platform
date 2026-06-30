"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { ChevronDown, ChevronUp, Plus, X, AlertTriangle, Clock, Users } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface Staff { id: string; first_name: string; last_name: string; role: string; }
interface Supervision {
  id: string;
  staff_id: string;
  supervision_date: string;
  supervision_type: string;
  topics_discussed: string | null;
  action_points: string | null;
  next_supervision_due: string | null;
  staff_signature_obtained: boolean;
  staff: Staff | null;
  supervisor: Staff | null;
}

const SUPERVISION_TYPES = ["Regular 1-2-1", "Probation Review", "Performance Review", "Return to Work", "Post-Incident Debrief", "Annual Appraisal"];

export function SupervisionsDashboard({ supervisions, staff }: { supervisions: unknown[]; staff: unknown[] }) {
  const records = supervisions as Supervision[];
  const staffList = staff as Staff[];

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ staff_id: "", supervision_date: new Date().toISOString().split("T")[0], supervision_type: "Regular 1-2-1", topics_discussed: "", action_points: "", next_supervision_due: "", staff_signature_obtained: false });
  const [error, setError] = useState<string | null>(null);

  const overdue = records.filter(r => r.next_supervision_due && new Date(r.next_supervision_due) < new Date());
  const dueSoon = records.filter(r => r.next_supervision_due && new Date(r.next_supervision_due) >= new Date() && new Date(r.next_supervision_due) < new Date(Date.now() + 14 * 86400000));
  const thisMonth = records.filter(r => {
    const d = new Date(r.supervision_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/supervisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CRStatCard label="Total" value={records.length} icon={<Users size={20} />} />
        <CRStatCard label="This Month" value={thisMonth.length} icon={<Clock size={20} />} />
        <CRStatCard label="Due Soon (14d)" value={dueSoon.length} icon={<Clock size={20} />} variant="warning" />
        <CRStatCard label="Overdue" value={overdue.length} icon={<AlertTriangle size={20} />} variant="danger" />
      </div>

      <div className="flex justify-end">
        <CRButton onClick={() => setShowForm(v => !v)} size="sm">
          <Plus size={14} className="mr-1" /> Record Supervision
        </CRButton>
      </div>

      {showForm && (
        <CRCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-cr-charcoal">New Supervision Record</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-cr-slate" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Staff member *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                <option value="">Select…</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Supervision type *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.supervision_type} onChange={e => setForm(f => ({ ...f, supervision_type: e.target.value }))}>
                {SUPERVISION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Date *</label>
              <input type="date" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.supervision_date} onChange={e => setForm(f => ({ ...f, supervision_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Next supervision due</label>
              <input type="date" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.next_supervision_due} onChange={e => setForm(f => ({ ...f, next_supervision_due: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Topics discussed</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-body" rows={3} value={form.topics_discussed} onChange={e => setForm(f => ({ ...f, topics_discussed: e.target.value }))} placeholder="Key topics covered in this supervision…" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Action points</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-body" rows={2} value={form.action_points} onChange={e => setForm(f => ({ ...f, action_points: e.target.value }))} placeholder="Actions to be completed by…" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sig" checked={form.staff_signature_obtained} onChange={e => setForm(f => ({ ...f, staff_signature_obtained: e.target.checked }))} className="rounded" />
              <label htmlFor="sig" className="text-sm font-body text-cr-charcoal">Staff signature obtained</label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <CRButton onClick={save} loading={saving} disabled={!form.staff_id || !form.supervision_date}>Save</CRButton>
          </div>
        </CRCard>
      )}

      <div className="space-y-3">
        {records.map(r => {
          const isOverdue = Boolean(r.next_supervision_due && new Date(r.next_supervision_due) < new Date());
          const expanded = expandedId === r.id;
          return (
            <CRCard key={r.id}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expanded ? null : r.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cr-mint flex items-center justify-center text-cr-forest font-semibold text-sm flex-shrink-0">
                    {r.staff?.first_name?.[0]}{r.staff?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-body font-semibold text-cr-charcoal">{r.staff?.first_name} {r.staff?.last_name}</p>
                    <p className="text-xs text-cr-slate">{r.supervision_type} · {formatDateUK(r.supervision_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.next_supervision_due && (
                    <CRBadge variant={isOverdue ? "red" : "slate"} size="sm">
                      Next: {formatDateUK(r.next_supervision_due)}
                    </CRBadge>
                  )}
                  {r.staff_signature_obtained && <CRBadge variant="green" size="sm">Signed</CRBadge>}
                  {expanded ? <ChevronUp size={16} className="text-cr-slate" /> : <ChevronDown size={16} className="text-cr-slate" />}
                </div>
              </div>
              {expanded && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-xs text-cr-slate">Supervisor: {r.supervisor?.first_name} {r.supervisor?.last_name}</p>
                  {r.topics_discussed && (
                    <div>
                      <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Topics discussed</p>
                      <p className="text-sm font-body text-cr-charcoal whitespace-pre-wrap">{r.topics_discussed}</p>
                    </div>
                  )}
                  {r.action_points && (
                    <div>
                      <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Action points</p>
                      <p className="text-sm font-body text-cr-charcoal whitespace-pre-wrap">{r.action_points}</p>
                    </div>
                  )}
                </div>
              )}
            </CRCard>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-16">
            <Users className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-cr-slate font-body">No supervision records yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
