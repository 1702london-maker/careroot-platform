"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { AlertTriangle, CheckCircle, Clock, Plus, X } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface Staff { id: string; first_name: string; last_name: string; role: string; }
interface ComplianceRecord {
  id: string;
  staff_id: string;
  compliance_item: string;
  status: string;
  valid_until: string | null;
  document_url: string | null;
  notes: string | null;
  verified_at: string | null;
  staff: Staff | null;
}

const COMPLIANCE_ITEMS = ["DBS Check", "Right to Work", "Manual Handling", "Safeguarding Adults", "First Aid", "Medication Administration", "Fire Safety", "Infection Control", "Mental Capacity Act", "Health & Safety Induction"];

function statusVariant(s: string, validUntil: string | null) {
  if (s === "expired" || (validUntil && new Date(validUntil) < new Date())) return "red";
  if (s === "expiring_soon" || (validUntil && new Date(validUntil) < new Date(Date.now() + 30 * 86400000))) return "amber";
  if (s === "compliant") return "green";
  return "slate";
}

function statusLabel(s: string, validUntil: string | null) {
  if (validUntil && new Date(validUntil) < new Date()) return "Expired";
  if (validUntil && new Date(validUntil) < new Date(Date.now() + 30 * 86400000)) return "Expiring Soon";
  if (s === "compliant") return "Compliant";
  if (s === "pending") return "Pending";
  return s;
}

export function StaffComplianceDashboard({ compliance, staff }: { compliance: unknown[]; staff: unknown[] }) {
  const records = compliance as ComplianceRecord[];
  const staffList = staff as Staff[];

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ staff_id: "", compliance_item: "", status: "compliant", valid_until: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  const expired = records.filter(r => r.valid_until && new Date(r.valid_until) < new Date());
  const expiringSoon = records.filter(r => r.valid_until && new Date(r.valid_until) >= new Date() && new Date(r.valid_until) < new Date(Date.now() + 30 * 86400000));
  const compliant = records.filter(r => r.status === "compliant" && (!r.valid_until || new Date(r.valid_until) >= new Date()));

  // Group by staff member
  const byStaff: Record<string, ComplianceRecord[]> = {};
  for (const r of records) {
    if (!byStaff[r.staff_id]) byStaff[r.staff_id] = [];
    byStaff[r.staff_id].push(r);
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/staff-compliance", {
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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CRStatCard label="Total Records" value={records.length} icon={<CheckCircle size={20} />} />
        <CRStatCard label="Compliant" value={compliant.length} icon={<CheckCircle size={20} />} variant="success" />
        <CRStatCard label="Expiring Soon" value={expiringSoon.length} icon={<Clock size={20} />} variant="warning" />
        <CRStatCard label="Expired" value={expired.length} icon={<AlertTriangle size={20} />} variant="danger" />
      </div>

      {/* Add record */}
      <div className="flex justify-end">
        <CRButton onClick={() => setShowForm(v => !v)} size="sm">
          <Plus size={14} className="mr-1" /> Add Compliance Record
        </CRButton>
      </div>

      {showForm && (
        <CRCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-cr-charcoal">New Compliance Record</h3>
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
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Compliance item *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.compliance_item} onChange={e => setForm(f => ({ ...f, compliance_item: e.target.value }))}>
                <option value="">Select…</option>
                {COMPLIANCE_ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Status *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="compliant">Compliant</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Valid until</label>
              <input type="date" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Notes</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <CRButton onClick={save} loading={saving} disabled={!form.staff_id || !form.compliance_item}>Save Record</CRButton>
          </div>
        </CRCard>
      )}

      {/* Records by staff */}
      {Object.entries(byStaff).map(([staffId, staffRecords]) => {
        const member = staffRecords[0]?.staff;
        const hasIssues = staffRecords.some(r => r.valid_until && new Date(r.valid_until) < new Date(Date.now() + 30 * 86400000));
        return (
          <CRCard key={staffId}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-cr-mint flex items-center justify-center text-cr-forest font-semibold text-sm">
                {member?.first_name?.[0]}{member?.last_name?.[0]}
              </div>
              <div>
                <p className="font-body font-semibold text-cr-charcoal">{member?.first_name} {member?.last_name}</p>
                <p className="text-xs text-cr-slate capitalize">{member?.role}</p>
              </div>
              {hasIssues && <CRBadge variant="amber" size="sm" className="ml-auto">Attention needed</CRBadge>}
            </div>
            <div className="space-y-2">
              {staffRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-body text-cr-charcoal">{r.compliance_item}</span>
                  <div className="flex items-center gap-3">
                    {r.valid_until && <span className="text-xs text-cr-slate">Until {formatDateUK(r.valid_until)}</span>}
                    <CRBadge variant={statusVariant(r.status, r.valid_until)} size="sm">{statusLabel(r.status, r.valid_until)}</CRBadge>
                  </div>
                </div>
              ))}
            </div>
          </CRCard>
        );
      })}

      {records.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-cr-slate font-body">No compliance records yet. Add the first one above.</p>
        </div>
      )}
    </div>
  );
}
