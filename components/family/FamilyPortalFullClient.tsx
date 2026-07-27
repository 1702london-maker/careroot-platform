"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CalendarClock, ClipboardList, Heart, LogOut, MessageSquare, Pill, ShieldCheck, Utensils, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDateTimeUK, formatDateUK } from "@/lib/utils";

type Tab = "overview" | "visits" | "care" | "medication" | "nutrition" | "rights";

type Props = {
  client: Record<string, unknown>;
  accessLevel: string;
  accessId: string;
  familyUser: { first_name: string; last_name: string; email: string; phone?: string | null } | null;
  recentVisits: Record<string, unknown>[];
  complaints: Record<string, unknown>[];
  briefings: Record<string, unknown>[];
  carePlan: Record<string, unknown> | null;
  medicationSchedules: Record<string, unknown>[];
  medicationRecords: Record<string, unknown>[];
  nutritionRecords: Record<string, unknown>[];
  moodRecords: Record<string, unknown>[];
  consentRecords: Record<string, unknown>[];
  sarRequests: Record<string, unknown>[];
};

const tabs: { id: Tab; label: string; icon: React.ReactNode; minAccess?: string }[] = [
  { id: "overview", label: "Overview", icon: <Heart size={17} /> },
  { id: "visits", label: "Visits", icon: <CalendarClock size={17} /> },
  { id: "care", label: "Care Plan", icon: <ClipboardList size={17} />, minAccess: "standard" },
  { id: "medication", label: "Medication", icon: <Pill size={17} />, minAccess: "standard" },
  { id: "nutrition", label: "Nutrition", icon: <Utensils size={17} /> },
  { id: "rights", label: "Documents", icon: <ShieldCheck size={17} />, minAccess: "full" },
];

function canShow(accessLevel: string, min?: string) {
  if (!min) return true;
  if (accessLevel === "full") return true;
  if (min === "standard" && accessLevel === "standard") return true;
  return false;
}

function statusClass(status?: string) {
  if (status === "completed" || status === "administered" || status === "given") return "bg-green-100 text-green-700";
  if (status === "missed" || status === "refused" || status === "withdrawn") return "bg-red-100 text-red-700";
  if (status === "scheduled" || status === "received" || status === "open") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export function FamilyPortalFullClient(props: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [sarReason, setSarReason] = useState("");
  const [complaint, setComplaint] = useState({ complaint_type: "care_quality", description: "", priority: "medium" });
  const [busy, setBusy] = useState<"sar" | "complaint" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clientName = `${props.client.first_name ?? ""} ${props.client.last_name ?? ""}`.trim();
  const latestVisit = props.recentVisits[0];
  const medicationMisses = props.medicationRecords.filter((r) => ["refused", "missed", "unavailable"].includes(String(r.status))).length;
  const nutritionConcerns = props.nutritionRecords.filter((r) => Boolean(r.concerns)).length;
  const visibleTabs = tabs.filter((t) => canShow(props.accessLevel, t.minAccess));

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/family/login");
  }

  async function submitSar() {
    setBusy("sar"); setError(""); setMessage("");
    const res = await fetch("/api/family/sar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: props.client.id,
        requester_name: `${props.familyUser?.first_name ?? ""} ${props.familyUser?.last_name ?? ""}`.trim(),
        requester_email: props.familyUser?.email,
        reason: sarReason,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not submit SAR"); return; }
    setSarReason("");
    setMessage("SAR submitted. The care provider has 30 days to respond.");
    router.refresh();
  }

  async function submitComplaint() {
    if (!complaint.description.trim()) {
      setError("Please describe the concern.");
      return;
    }
    setBusy("complaint"); setError(""); setMessage("");
    const res = await fetch("/api/family/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: props.client.id,
        organisation_id: props.client.organisation_id,
        complainant_name: `${props.familyUser?.first_name ?? ""} ${props.familyUser?.last_name ?? ""}`.trim(),
        complainant_email: props.familyUser?.email,
        complainant_phone: props.familyUser?.phone,
        ...complaint,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not submit complaint"); return; }
    setComplaint({ complaint_type: "care_quality", description: "", priority: "medium" });
    setMessage("Concern submitted. The manager will respond within 28 days.");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-cr-forest text-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs opacity-70 font-body">Family Portal</p>
            <h1 className="font-display font-semibold text-xl">{clientName}</h1>
            <p className="text-xs opacity-70 font-body capitalize">{props.accessLevel} access</p>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 text-sm font-body"><LogOut size={16} /> Sign out</button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {visibleTabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-body font-medium border-b-2 whitespace-nowrap ${tab === item.id ? "border-cr-forest text-cr-forest" : "border-transparent text-cr-slate"}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {message && <div className="flex items-center gap-2 bg-cr-mint border border-cr-forest/20 rounded-lg p-3 text-sm text-cr-charcoal"><CheckCircle2 size={16} className="text-cr-forest" />{message}</div>}
        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-cr-red"><AlertTriangle size={16} />{error}</div>}

        {tab === "overview" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Summary label="Latest visit" value={latestVisit?.scheduled_start ? formatDateTimeUK(String(latestVisit.scheduled_start)) : "None"} />
              <Summary label="Medication issues" value={medicationMisses} />
              <Summary label="Nutrition concerns" value={nutritionConcerns} />
              <Summary label="Open concerns" value={props.complaints.filter((c) => c.status !== "resolved").length} />
            </div>
            {props.briefings[0] && <Panel title="Latest Care Update"><p className="text-sm font-body text-cr-charcoal whitespace-pre-wrap">{String(props.briefings[0].content)}</p><p className="text-xs text-cr-slate mt-2">{formatDateTimeUK(String(props.briefings[0].created_at))}</p></Panel>}
            <Panel title="Wellbeing Snapshot">
              <RecordList empty="No recent wellbeing records.">
                {props.moodRecords.slice(0, 5).map((row) => <Row key={String(row.id)} title={String(row.mood_term)} meta={String(row.context_notes ?? formatDateTimeUK(String(row.server_timestamp)))} badge={String(row.mood_category ?? "mood")} />)}
              </RecordList>
            </Panel>
          </section>
        )}

        {tab === "visits" && <Panel title="Visit History"><RecordList empty="No visits recorded yet.">{props.recentVisits.map((visit) => <Row key={String(visit.id)} title={formatDateTimeUK(String(visit.scheduled_start))} meta={String(visit.ai_summary ?? visit.notes ?? "Care visit")} badge={String(visit.status)} />)}</RecordList></Panel>}

        {tab === "care" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Care Plan">{props.carePlan ? <><Info label="Status" value={String(props.carePlan.status ?? "draft")} /><Info label="Authorised tasks" value={Array.isArray(props.carePlan.authorised_tasks) ? props.carePlan.authorised_tasks.join(", ") : String(props.carePlan.authorised_tasks ?? "Not recorded")} /><Info label="Excluded tasks" value={Array.isArray(props.carePlan.excluded_tasks) ? props.carePlan.excluded_tasks.join(", ") : String(props.carePlan.excluded_tasks ?? "None recorded")} /></> : <Empty text="No current care plan is available yet." />}</Panel>
            <Panel title="Care Preferences"><Info label="Dietary requirements" value={String(props.client.dietary_requirements ?? "Not recorded")} /><Info label="Food preferences" value={String(props.client.food_preferences ?? "Not recorded")} /><Info label="Meal timetable" value={String(props.client.food_timetable ?? "Not recorded")} /></Panel>
          </section>
        )}

        {tab === "medication" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Medication Schedule"><RecordList empty="No active medication schedule.">{props.medicationSchedules.map((med) => <Row key={String(med.id)} title={`${med.medication_name ?? ""} ${med.dose ?? ""}`} meta={`${med.route ?? ""}`} badge={med.is_prn ? "PRN" : med.is_controlled ? "Controlled" : "Scheduled"} />)}</RecordList></Panel>
            <Panel title="Administration History"><RecordList empty="No medication records yet.">{props.medicationRecords.map((rec) => <Row key={String(rec.id)} title={String((rec.medication_schedules as Record<string, unknown> | null)?.medication_name ?? "Medication")} meta={formatDateTimeUK(String(rec.administered_at ?? rec.scheduled_time ?? rec.created_at))} badge={String(rec.status ?? "recorded")} />)}</RecordList></Panel>
          </section>
        )}

        {tab === "nutrition" && <Panel title="Nutrition Records"><RecordList empty="No nutrition records yet.">{props.nutritionRecords.map((rec) => <Row key={String(rec.id)} title={String(rec.meal_type)} meta={`${rec.offered ?? "Offered not recorded"} / ${rec.consumed ?? "consumed not recorded"}${rec.fluid_intake_ml ? ` / ${rec.fluid_intake_ml}ml fluids` : ""}`} badge={rec.concerns ? "Concern" : "Recorded"} />)}</RecordList></Panel>}

        {tab === "rights" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Documents & Consents"><RecordList empty="No consent records visible yet.">{props.consentRecords.map((row) => <Row key={String(row.id)} title={String(row.consent_type).replaceAll("_", " ")} meta={row.granted ? `Granted ${formatDateUK(String(row.granted_at ?? ""))}` : `Withdrawn ${formatDateUK(String(row.withdrawn_at ?? ""))}`} badge={row.granted ? "Active" : "Withdrawn"} />)}</RecordList></Panel>
            <Panel title="SAR & Concerns">
              <textarea value={sarReason} onChange={(e) => setSarReason(e.target.value)} rows={3} placeholder="Optional SAR reason" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none mb-2" />
              <button onClick={submitSar} disabled={busy === "sar"} className="inline-flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-semibold mb-4">{busy === "sar" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Submit SAR</button>
              <RecordList empty="No SAR requests yet.">{props.sarRequests.map((row) => <Row key={String(row.id)} title={`SAR ${formatDateUK(String(row.request_date))}`} meta={`Deadline ${formatDateUK(String(row.deadline_date))}`} badge={String(row.status)} />)}</RecordList>
              <div className="border-t border-gray-100 mt-4 pt-4">
                <select value={complaint.complaint_type} onChange={(e) => setComplaint({ ...complaint, complaint_type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body bg-white mb-2"><option value="care_quality">Care quality</option><option value="communication">Communication</option><option value="medication">Medication</option><option value="food">Food</option><option value="other">Other</option></select>
                <textarea value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} rows={3} placeholder="Describe concern" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none mb-2" />
                <button onClick={submitComplaint} disabled={busy === "complaint"} className="inline-flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-semibold">{busy === "complaint" ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Raise concern</button>
              </div>
            </Panel>
          </section>
        )}
      </main>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs font-body text-cr-slate uppercase tracking-wide">{label}</p><p className="font-display text-xl font-semibold text-cr-charcoal mt-1">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"><h2 className="font-display text-lg font-semibold text-cr-charcoal mb-3">{title}</h2>{children}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-3"><p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">{label}</p><p className="text-sm font-body text-cr-charcoal whitespace-pre-wrap">{value || "Not recorded"}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm font-body text-cr-slate py-3">{text}</p>;
}

function RecordList({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return <div className="space-y-2">{children.length ? children : <Empty text={empty} />}</div>;
}

function Row({ title, meta, badge }: { title: string; meta?: string; badge?: string }) {
  return <div className="border border-gray-100 rounded-lg p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-body font-semibold text-cr-charcoal capitalize">{title}</p>{meta && <p className="text-xs font-body text-cr-slate mt-1 line-clamp-2">{meta}</p>}</div>{badge && <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${statusClass(badge)}`}>{badge.replaceAll("_", " ")}</span>}</div></div>;
}
