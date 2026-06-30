"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRButton } from "@/components/ui/CRButton";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { Shield, Plus, X, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface Client { id: string; first_name: string; last_name: string; }
interface ConsentRecord {
  id: string;
  client_id: string;
  consent_type: string;
  granted: boolean;
  granted_by: string | null;
  granted_at: string | null;
  withdrawn_at: string | null;
  notes: string | null;
  review_due: string | null;
  client: Client | null;
}

const CONSENT_TYPES = [
  "Care and support plan",
  "Data processing (GDPR)",
  "Sharing with GP",
  "Sharing with family",
  "Sharing with commissioner",
  "Photography and media",
  "Emergency medical treatment",
  "Mental capacity assessment",
  "CCTV in home",
  "Research and auditing",
];

export function ConsentDashboard({ consents, clients }: { consents: unknown[]; clients: unknown[] }) {
  const records = consents as ConsentRecord[];
  const clientList = clients as Client[];

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: "", consent_type: "", granted: true, granted_by: "", notes: "", review_due: "" });
  const [error, setError] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState("");

  const granted = records.filter(r => r.granted && !r.withdrawn_at);
  const withdrawn = records.filter(r => r.withdrawn_at || !r.granted);
  const reviewDue = records.filter(r => r.review_due && new Date(r.review_due) < new Date(Date.now() + 14 * 86400000) && !r.withdrawn_at && r.granted);

  const filtered = filterClient ? records.filter(r => r.client_id === filterClient) : records;

  // Group by client
  const byClient: Record<string, ConsentRecord[]> = {};
  for (const r of filtered) {
    if (!byClient[r.client_id]) byClient[r.client_id] = [];
    byClient[r.client_id].push(r);
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function withdraw(id: string) {
    setWithdrawingId(id);
    await fetch(`/api/consent/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ granted: false }) });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CRStatCard label="Total Records" value={records.length} icon={<Shield size={20} />} />
        <CRStatCard label="Consents Granted" value={granted.length} icon={<CheckCircle size={20} />} variant="success" />
        <CRStatCard label="Review Due" value={reviewDue.length} icon={<AlertTriangle size={20} />} variant="warning" />
        <CRStatCard label="Withdrawn" value={withdrawn.length} icon={<X size={20} />} variant="danger" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <select className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-body min-w-48" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">All clients</option>
          {clientList.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
        <CRButton onClick={() => setShowForm(v => !v)} size="sm"><Plus size={14} className="mr-1" />Add Consent Record</CRButton>
      </div>

      {showForm && (
        <CRCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-cr-charcoal">New Consent Record</h3>
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
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Consent type *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.consent_type} onChange={e => setForm(f => ({ ...f, consent_type: e.target.value }))}>
                <option value="">Select…</option>
                {CONSENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Granted by</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.granted_by} onChange={e => setForm(f => ({ ...f, granted_by: e.target.value }))} placeholder="Client, Advocate, or Legal Guardian name" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Review due date</label>
              <input type="date" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.review_due} onChange={e => setForm(f => ({ ...f, review_due: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-body font-medium text-cr-slate mb-1 block">Notes</label>
              <input type="text" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-body" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any conditions, context, or capacity notes…" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-body text-cr-charcoal">Consent status:</span>
              <button onClick={() => setForm(f => ({ ...f, granted: true }))} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${form.granted ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-500"}`}>Granted</button>
              <button onClick={() => setForm(f => ({ ...f, granted: false }))} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!form.granted ? "bg-red-100 text-red-700 border border-red-300" : "bg-gray-100 text-gray-500"}`}>Refused</button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <CRButton onClick={save} loading={saving} disabled={!form.client_id || !form.consent_type}>Save Record</CRButton>
          </div>
        </CRCard>
      )}

      <div className="space-y-4">
        {Object.entries(byClient).map(([clientId, clientRecords]) => {
          const clientName = clientRecords[0]?.client;
          return (
            <CRCard key={clientId}>
              <p className="font-body font-semibold text-cr-charcoal mb-3">{clientName?.first_name} {clientName?.last_name}</p>
              <div className="space-y-2">
                {clientRecords.map(r => {
                  const active = r.granted && !r.withdrawn_at;
                  const reviewOverdue = Boolean(r.review_due && new Date(r.review_due) < new Date() && active);
                  return (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3 flex-wrap">
                      <span className="text-sm font-body text-cr-charcoal flex-1">{r.consent_type}</span>
                      <div className="flex items-center gap-2">
                        {reviewOverdue && <CRBadge variant="amber" size="sm">Review overdue</CRBadge>}
                        <CRBadge variant={active ? "green" : "red"} size="sm">{active ? "Granted" : r.withdrawn_at ? "Withdrawn" : "Refused"}</CRBadge>
                        {r.granted_at && <span className="text-xs text-cr-slate">{formatDateUK(r.granted_at)}</span>}
                        {active && (
                          <button
                            onClick={() => withdraw(r.id)}
                            disabled={withdrawingId === r.id}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CRCard>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-16">
            <Shield className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-cr-slate font-body">No consent records logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
