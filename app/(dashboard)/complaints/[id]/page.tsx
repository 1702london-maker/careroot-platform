"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { formatDateUK, getDaysSince } from "@/lib/utils";

type Complaint = {
  id: string;
  reference_number: string;
  category: string;
  description: string;
  desired_outcome: string | null;
  incident_date: string | null;
  is_anonymous: boolean;
  wants_cqc_escalation: boolean;
  status: string;
  investigation_notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  clients: { first_name: string; last_name: string } | null;
  users: { first_name: string; last_name: string } | null;
};

const STATUS_OPTIONS = ["open", "acknowledged", "investigating", "escalated", "resolved", "closed"];

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    status: "",
    investigation_notes: "",
    resolution_notes: "",
    wants_cqc_escalation: false,
  });

  useEffect(() => {
    fetch(`/api/complaints/${id}`)
      .then((r) => r.json())
      .then(({ complaint }) => {
        setComplaint(complaint);
        setForm({
          status: complaint.status,
          investigation_notes: complaint.investigation_notes ?? "",
          resolution_notes: complaint.resolution_notes ?? "",
          wants_cqc_escalation: complaint.wants_cqc_escalation ?? false,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { complaint: updated } = await res.json();
      setComplaint(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-cr-forest" />
    </div>
  );

  if (!complaint) return (
    <div className="py-24 text-center">
      <p className="text-cr-slate font-body">Complaint not found.</p>
      <Link href="/complaints" className="text-cr-forest text-sm underline mt-2 inline-block">Back to complaints</Link>
    </div>
  );

  const days = getDaysSince(complaint.created_at);
  const isOverdue = !["resolved", "closed"].includes(complaint.status) && days >= 28;

  const statusVariant = (s: string) =>
    s === "resolved" || s === "closed" ? "green"
    : s === "escalated" ? "red"
    : s === "investigating" ? "amber"
    : "slate";

  const ta = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/complaints" className="text-cr-slate hover:text-cr-forest transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display font-semibold text-2xl text-cr-charcoal">{complaint.reference_number}</h1>
          <p className="text-sm text-cr-slate font-body capitalize">{complaint.category?.replace(/_/g, " ")} · {formatDateUK(complaint.created_at)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isOverdue && (
            <span className="flex items-center gap-1 text-xs font-body font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              <AlertTriangle size={12} /> Overdue ({days}d)
            </span>
          )}
          <CRBadge variant={statusVariant(complaint.status) as "green" | "red" | "amber" | "slate"}>
            {complaint.status}
          </CRBadge>
        </div>
      </div>

      {complaint.wants_cqc_escalation && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-body text-red-700">
          <AlertTriangle size={16} /> This complaint is flagged for CQC escalation.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <CRCard className="p-4">
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Client</p>
          <p className="text-sm font-body text-cr-charcoal font-medium">
            {complaint.is_anonymous ? "Anonymous" : complaint.clients ? `${complaint.clients.first_name} ${complaint.clients.last_name}` : "—"}
          </p>
        </CRCard>
        <CRCard className="p-4">
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Submitted by</p>
          <p className="text-sm font-body text-cr-charcoal font-medium">
            {complaint.is_anonymous ? "Anonymous" : complaint.users ? `${complaint.users.first_name} ${complaint.users.last_name}` : "—"}
          </p>
        </CRCard>
        <CRCard className="p-4">
          <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Days open</p>
          <p className={`text-sm font-body font-medium ${isOverdue ? "text-red-600" : "text-cr-charcoal"}`}>{days} days</p>
        </CRCard>
      </div>

      <CRCard className="p-6 mb-4">
        <h2 className="font-body font-semibold text-cr-charcoal mb-2">Complaint description</h2>
        <p className="text-sm font-body text-cr-charcoal leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        {complaint.desired_outcome && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Desired outcome</p>
            <p className="text-sm font-body text-cr-charcoal">{complaint.desired_outcome}</p>
          </div>
        )}
        {complaint.incident_date && (
          <div className="mt-3">
            <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Incident date</p>
            <p className="text-sm font-body text-cr-charcoal">{formatDateUK(complaint.incident_date)}</p>
          </div>
        )}
      </CRCard>

      <CRCard className="p-6 mb-4">
        <h2 className="font-body font-semibold text-cr-charcoal mb-4">Investigation & resolution</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest bg-white capitalize"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Investigation notes</label>
            <textarea
              rows={4}
              value={form.investigation_notes}
              onChange={(e) => setForm({ ...form, investigation_notes: e.target.value })}
              placeholder="Document steps taken, interviews conducted, evidence reviewed…"
              className={ta}
            />
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Resolution notes</label>
            <textarea
              rows={3}
              value={form.resolution_notes}
              onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })}
              placeholder="Outcome, actions taken, apology issued, process changes…"
              className={ta}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.wants_cqc_escalation}
              onChange={(e) => setForm({ ...form, wants_cqc_escalation: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cr-forest focus:ring-cr-forest"
            />
            <span className="text-sm font-body text-cr-charcoal">Escalate to CQC / notify compliance lead</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-body text-cr-forest">
                <CheckCircle2 size={16} /> Saved
              </span>
            )}
          </div>
        </div>
      </CRCard>
    </div>
  );
}
