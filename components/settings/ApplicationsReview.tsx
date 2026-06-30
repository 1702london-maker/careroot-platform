"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Check, X, Loader2, Building2, Mail, Phone, Hash } from "lucide-react";

type Application = {
  id: string;
  org_name: string;
  org_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  cqc_provider_id: string | null;
  message: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
};

const typeLabel: Record<string, string> = {
  domiciliary: "Domiciliary",
  supported_living: "Supported Living",
  residential: "Residential",
  internal: "Internal",
};

export function ApplicationsReview({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  const approve = async (app: Application) => {
    setBusyId(app.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/applications/${app.id}/approve`, { method: "POST" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ id: app.id, text: result?.error || "Approval failed.", ok: false });
      } else if (result.emailFailed) {
        setNotice({ id: app.id, text: `Account created. Email failed — temp password: ${result.tempPassword}`, ok: true });
      } else {
        setNotice({ id: app.id, text: "Approved — temporary password emailed.", ok: true });
      }
      router.refresh();
    } catch {
      setNotice({ id: app.id, text: "Network error.", ok: false });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (app: Application) => {
    const reason = window.prompt("Reason for rejection (optional — included in the email):") ?? undefined;
    setBusyId(app.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/applications/${app.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) setNotice({ id: app.id, text: result?.error || "Rejection failed.", ok: false });
      else setNotice({ id: app.id, text: "Application rejected.", ok: true });
      router.refresh();
    } catch {
      setNotice({ id: app.id, text: "Network error.", ok: false });
    } finally {
      setBusyId(null);
    }
  };

  const Row = ({ app, actions }: { app: Application; actions: boolean }) => (
    <CRCard key={app.id} className="mb-3">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-cr-forest" />
            <span className="font-body font-semibold text-cr-charcoal">{app.org_name}</span>
            <CRBadge variant="slate" size="sm">{typeLabel[app.org_type] ?? app.org_type}</CRBadge>
            {app.status === "approved" && <CRBadge variant="green" size="sm">Approved</CRBadge>}
            {app.status === "rejected" && <CRBadge variant="red" size="sm">Rejected</CRBadge>}
          </div>
          <p className="text-sm font-body text-cr-charcoal mb-2">{app.first_name} {app.last_name}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-body text-cr-slate">
            <span className="flex items-center gap-1"><Mail size={12} /> {app.email}</span>
            {app.phone && <span className="flex items-center gap-1"><Phone size={12} /> {app.phone}</span>}
            {app.cqc_provider_id && <span className="flex items-center gap-1"><Hash size={12} /> CQC {app.cqc_provider_id}</span>}
          </div>
          {app.message && <p className="text-xs font-body text-cr-slate mt-2 italic">&ldquo;{app.message}&rdquo;</p>}
          {app.rejection_reason && <p className="text-xs font-body text-cr-red mt-2">Reason: {app.rejection_reason}</p>}
          {notice?.id === app.id && (
            <p className={`text-xs font-body mt-2 ${notice.ok ? "text-cr-forest" : "text-cr-red"}`}>{notice.text}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => approve(app)} disabled={busyId === app.id}
              className="flex items-center gap-1.5 bg-cr-forest text-white rounded-lg px-3.5 py-2 text-sm font-body font-semibold hover:bg-cr-sage transition-colors disabled:opacity-60">
              {busyId === app.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve
            </button>
            <button onClick={() => reject(app)} disabled={busyId === app.id}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-cr-red rounded-lg px-3.5 py-2 text-sm font-body font-semibold hover:bg-red-50 transition-colors disabled:opacity-60">
              <X size={15} /> Reject
            </button>
          </div>
        )}
      </div>
    </CRCard>
  );

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-3">
        Pending review {pending.length > 0 && <span className="text-cr-amber">({pending.length})</span>}
      </h2>
      {pending.length === 0 ? (
        <CRCard className="mb-8"><p className="text-sm font-body text-cr-slate text-center py-4">No applications waiting for review.</p></CRCard>
      ) : (
        <div className="mb-8">{pending.map((app) => <Row key={app.id} app={app} actions />)}</div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Reviewed</h2>
          <div>{reviewed.map((app) => <Row key={app.id} app={app} actions={false} />)}</div>
        </>
      )}
    </div>
  );
}
