"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { FileText, Plus, X, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface Client { id: string; first_name: string; last_name: string; }
interface SAR {
  id: string;
  client_id: string;
  requester_name: string;
  requester_relationship: string | null;
  requester_email: string | null;
  request_date: string;
  deadline_date: string;
  status: string;
  data_provided_at: string | null;
  notes: string | null;
  client: Client | null;
}

const STATUS_FLOW = ["received", "in_progress", "completed", "refused"] as const;

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function deadlineVariant(deadline: string, status: string) {
  if (status === "completed" || status === "refused") return "green";
  const days = daysUntil(deadline);
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return "slate";
}

export function SARDashboard({ sars, clients }: { sars: unknown[]; clients: unknown[] }) {
  const records = sars as SAR[];
  const clientList = clients as Client[];

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: "", requester_name: "", requester_relationship: "", requester_email: "", request_date: new Date().toISOString().split("T")[0], notes: "" });
  const [error, setError] = useState<string | null>(null);

  const open = records.filter(r => r.status === "received" || r.status === "in_progress");
  const overdue = records.filter(r => (r.status === "received" || r.status === "in_progress") && daysUntil(r.deadline_date) < 0);
  const completed = records.filter(r => r.status === "completed");

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/sar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/sar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CRStatCard label="Total SARs" value={records.length} icon={<FileText size={20} />} />
        <CRStatCard label="Open" value={open.length} icon={<Clock size={20} />} />
        <CRStatCard label="Overdue" value={overdue.length} icon={<AlertTriangle size={20} />} variant="danger" />
        <CRStatCard label="Completed" value={completed.length} icon={<CheckCircle size={20} />} variant="success" />
      </div>

      <div className="flex justify-end">
        <CRButton onClick={() => setShowForm(v => !v)} size="sm"><Plus size={14} className="mr-1" />Log SAR</CRButton>
      </div>

      {showForm && (
        <CRCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-cr-charcoal">New Subject Access Request</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-cr-slate" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Client *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Select…</option>
                {clientList.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Requester name *</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} placeholder="Full name of requester" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Relationship to client</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.requester_relationship} onChange={e => setForm(f => ({ ...f, requester_relationship: e.target.value }))} placeholder="e.g. Self, Parent, Solicitor" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Requester email</label>
              <input type="email" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.requester_email} onChange={e => setForm(f => ({ ...f, requester_email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Request received date *</label>
              <input type="date" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.request_date} onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Notes</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <CRButton onClick={save} loading={saving} disabled={!form.client_id || !form.requester_name}>Log SAR</CRButton>
          </div>
        </CRCard>
      )}

      <div className="space-y-3">
        {records.map(r => {
          const days = daysUntil(r.deadline_date);
          const isActive = r.status === "received" || r.status === "in_progress";
          const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(r.status as typeof STATUS_FLOW[number]) + 1];
          return (
            <CRCard key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-body font-semibold text-cr-charcoal">{r.client?.first_name} {r.client?.last_name}</span>
                    <CRBadge variant={deadlineVariant(r.deadline_date, r.status)} size="sm">
                      {r.status === "completed" ? "Completed" : r.status === "refused" ? "Refused" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                    </CRBadge>
                    <CRBadge variant="slate" size="sm">{r.status.replace("_", " ")}</CRBadge>
                  </div>
                  <p className="text-sm font-body text-cr-charcoal">{r.requester_name}{r.requester_relationship ? ` (${r.requester_relationship})` : ""}</p>
                  <p className="text-xs text-cr-slate mt-0.5">Received {formatDateUK(r.request_date)} · Deadline {formatDateUK(r.deadline_date)}</p>
                  {r.notes && <p className="text-xs text-cr-slate mt-1 italic">{r.notes}</p>}
                </div>
                {isActive && nextStatus && (
                  <CRButton
                    size="sm"
                    variant="secondary"
                    loading={updatingId === r.id}
                    onClick={() => updateStatus(r.id, nextStatus)}
                  >
                    Mark {nextStatus.replace("_", " ")}
                  </CRButton>
                )}
              </div>
            </CRCard>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-16">
            <FileText className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-cr-slate font-body">No subject access requests logged.</p>
          </div>
        )}
      </div>
    </div>
  );
}
