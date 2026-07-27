"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarClock, ClipboardList, HeartPulse, LogOut, MessageSquare,
  Pill, ShieldCheck, Users, Loader2, CheckCircle2, AlertTriangle,
  Leaf, ChevronRight,
} from "lucide-react";
import { formatDateTimeUK, formatDateUK } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "today" | "care" | "medication" | "history" | "rights" | "team";

type Props = {
  client: Record<string, unknown>;
  todayVisits: Record<string, unknown>[];
  recentVisits: Record<string, unknown>[];
  carePlan: Record<string, unknown> | null;
  medicationSchedules: Record<string, unknown>[];
  medicationRecords: Record<string, unknown>[];
  nutritionRecords: Record<string, unknown>[];
  moodRecords: Record<string, unknown>[];
  consentRecords: Record<string, unknown>[];
  sarRequests: Record<string, unknown>[];
  complaints: Record<string, unknown>[];
  familyAccess: Record<string, unknown>[];
  userEmail: string | null;
};

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "today", label: "Today", icon: <CalendarClock size={18} /> },
  { id: "care", label: "My Care", icon: <ClipboardList size={18} /> },
  { id: "medication", label: "Medication", icon: <Pill size={18} /> },
  { id: "history", label: "History", icon: <HeartPulse size={18} /> },
  { id: "rights", label: "My Rights", icon: <ShieldCheck size={18} /> },
  { id: "team", label: "My Team", icon: <Users size={18} /> },
];

function statusClass(status?: string) {
  if (status === "completed" || status === "administered" || status === "given") return "bg-green-100 text-green-700";
  if (status === "missed" || status === "refused" || status === "overdue") return "bg-red-100 text-red-700";
  if (status === "in_progress" || status === "received" || status === "scheduled") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export function ClientPortalClient(props: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("today");
  const [sarReason, setSarReason] = useState("");
  const [complaint, setComplaint] = useState({ category: "care_quality", description: "", desired_outcome: "" });
  const [busy, setBusy] = useState<"sar" | "complaint" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clientName = `${props.client.first_name ?? ""} ${props.client.last_name ?? ""}`.trim();
  const assignedCarers = new Map<string, { first_name?: string; last_name?: string }>();
  for (const visit of [...props.todayVisits, ...props.recentVisits]) {
    const user = visit.users as { first_name?: string; last_name?: string; id?: string } | null;
    const id = String(visit.carer_id ?? `${user?.first_name}-${user?.last_name}`);
    if (user) assignedCarers.set(id, user);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  async function submitSar() {
    setBusy("sar"); setMessage(""); setError("");
    const res = await fetch("/api/client/sar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: props.client.id, reason: sarReason }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not submit SAR"); return; }
    setSarReason("");
    setMessage("Subject Access Request submitted. Your care provider has 30 days to respond.");
    router.refresh();
  }

  async function submitComplaint() {
    if (!complaint.description.trim()) { setError("Please describe the concern."); return; }
    setBusy("complaint"); setMessage(""); setError("");
    const res = await fetch("/api/client/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: props.client.id, ...complaint }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not submit concern"); return; }
    setComplaint({ category: "care_quality", description: "", desired_outcome: "" });
    setMessage("Concern submitted. Your care provider will respond within 28 days.");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cr-ivory flex">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-cr-forest text-white h-screen fixed left-0 top-0 z-40 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf size={18} className="text-cr-forest" />
          </div>
          <span className="font-display text-xl font-semibold text-white">Careroot</span>
        </div>

        {/* Client identity */}
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-[10px] font-body font-semibold text-white/40 uppercase tracking-widest mb-1">Client Portal</p>
          <p className="font-display text-base font-semibold text-white leading-snug">{clientName}</p>
          <p className="text-xs font-body text-white/50 capitalize mt-0.5">{String(props.client.status ?? "active")} care record</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <p className="px-3 mb-2 text-xs font-body font-medium text-white/40 uppercase tracking-widest">My Dashboard</p>
          {navItems.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150 mb-0.5 text-left",
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-cr-forest text-white flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <Leaf size={15} className="text-cr-forest" />
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-none">{clientName}</p>
            <p className="text-[10px] text-white/50">Client Portal</p>
          </div>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg hover:bg-white/10">
          <LogOut size={16} />
        </button>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cr-forest border-t border-white/10 flex overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 min-w-fit flex flex-col items-center gap-0.5 py-2.5 px-2 text-[10px] font-body transition-all",
              tab === item.id ? "text-white" : "text-white/50"
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="md:ml-64 flex-1 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="font-display text-xl font-semibold text-cr-charcoal">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            <p className="text-xs font-body text-cr-slate mt-0.5">{clientName}&apos;s care portal</p>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-5">
          {message && (
            <div className="flex items-center gap-2 bg-cr-mint border border-cr-forest/20 rounded-xl p-4 text-sm text-cr-charcoal">
              <CheckCircle2 size={16} className="text-cr-forest flex-shrink-0" />{message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <AlertTriangle size={16} className="flex-shrink-0" />{error}
            </div>
          )}

          {/* TODAY */}
          {tab === "today" && (
            <section className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Visits today" value={props.todayVisits.length} />
                <StatCard label="Completed" value={props.todayVisits.filter((v) => v.status === "completed").length} />
                <StatCard label="Next visit" value={props.todayVisits[0]?.scheduled_start ? formatDateTimeUK(String(props.todayVisits[0].scheduled_start)) : "None"} />
              </div>
              <Panel title="Today&apos;s Care Visits">
                <RecordList empty="No visits scheduled today.">
                  {props.todayVisits.map((visit) => {
                    const carer = visit.users as { first_name?: string; last_name?: string } | null;
                    return (
                      <Row key={String(visit.id)} title={formatDateTimeUK(String(visit.scheduled_start))} meta={carer ? `Carer: ${carer.first_name} ${carer.last_name}` : "Carer not yet assigned"} badge={String(visit.status ?? "scheduled")} />
                    );
                  })}
                </RecordList>
              </Panel>
            </section>
          )}

          {/* MY CARE */}
          {tab === "care" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Panel title="Current Care Plan">
                {props.carePlan ? (
                  <>
                    <Info label="Status" value={String(props.carePlan.status ?? "draft")} />
                    <Info label="Review date" value={formatDateUK(String(props.carePlan.review_date ?? ""))} />
                    <Info label="Authorised tasks" value={Array.isArray(props.carePlan.authorised_tasks) ? props.carePlan.authorised_tasks.join(", ") : String(props.carePlan.authorised_tasks ?? "Not recorded")} />
                    <Info label="Excluded tasks" value={Array.isArray(props.carePlan.excluded_tasks) ? props.carePlan.excluded_tasks.join(", ") : String(props.carePlan.excluded_tasks ?? "None recorded")} />
                  </>
                ) : <Empty text="No current care plan is available in the portal yet." />}
              </Panel>
              <Panel title="Nutrition Preferences">
                <Info label="Dietary requirements" value={String(props.client.dietary_requirements ?? "Not recorded")} />
                <Info label="Food preferences" value={String(props.client.food_preferences ?? "Not recorded")} />
                <Info label="Meal timetable" value={String(props.client.food_timetable ?? "Not recorded")} />
              </Panel>
            </section>
          )}

          {/* MEDICATION */}
          {tab === "medication" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Panel title="Medication Schedule">
                <RecordList empty="No active medication schedule recorded.">
                  {props.medicationSchedules.map((med) => (
                    <Row key={String(med.id)} title={`${med.medication_name ?? ""} ${med.dose ?? ""}`} meta={`${med.route ?? ""} ${Array.isArray(med.scheduled_times) ? med.scheduled_times.join(", ") : ""}`} badge={med.is_prn ? "PRN" : med.is_controlled ? "Controlled" : "Scheduled"} />
                  ))}
                </RecordList>
              </Panel>
              <Panel title="Recent Administration">
                <RecordList empty="No medication records yet.">
                  {props.medicationRecords.map((rec) => (
                    <Row key={String(rec.id)} title={String((rec.medication_schedules as Record<string, unknown> | null)?.medication_name ?? "Medication")} meta={formatDateTimeUK(String(rec.administered_at ?? rec.scheduled_time ?? rec.created_at))} badge={String(rec.status ?? "recorded")} />
                  ))}
                </RecordList>
              </Panel>
            </section>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Panel title="Recent Visits">
                <RecordList empty="No visit history.">
                  {props.recentVisits.map((visit) => (
                    <Row key={String(visit.id)} title={formatDateTimeUK(String(visit.scheduled_start))} meta={String(visit.ai_summary ?? visit.notes ?? "Care visit")} badge={String(visit.status ?? "scheduled")} />
                  ))}
                </RecordList>
              </Panel>
              <Panel title="Nutrition Records">
                <RecordList empty="No nutrition records.">
                  {props.nutritionRecords.map((rec) => (
                    <Row key={String(rec.id)} title={String(rec.meal_type)} meta={`${rec.consumed ?? "Not recorded"} consumed${rec.fluid_intake_ml ? `, ${rec.fluid_intake_ml}ml fluids` : ""}`} badge={rec.concerns ? "Concern" : "Recorded"} />
                  ))}
                </RecordList>
              </Panel>
              <Panel title="Mood Records">
                <RecordList empty="No mood records.">
                  {props.moodRecords.map((rec) => (
                    <Row key={String(rec.id)} title={String(rec.mood_term)} meta={String(rec.context_notes ?? formatDateTimeUK(String(rec.server_timestamp)))} badge={String(rec.mood_category ?? "mood")} />
                  ))}
                </RecordList>
              </Panel>
            </section>
          )}

          {/* MY RIGHTS */}
          {tab === "rights" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Panel title="Subject Access Request">
                <textarea value={sarReason} onChange={(e) => setSarReason(e.target.value)} rows={4} placeholder="Optional reason for the request" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none mb-3" />
                <button onClick={submitSar} disabled={busy === "sar"} className="inline-flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-semibold font-body mb-4">
                  {busy === "sar" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Submit SAR
                </button>
                <RecordList empty="No SAR requests yet.">
                  {props.sarRequests.map((sar) => (
                    <Row key={String(sar.id)} title={`Requested ${formatDateUK(String(sar.request_date))}`} meta={`Deadline: ${formatDateUK(String(sar.deadline_date))}`} badge={String(sar.status)} />
                  ))}
                </RecordList>
              </Panel>
              <div className="space-y-5">
                <Panel title="Consent Records">
                  <RecordList empty="No consent records published yet.">
                    {props.consentRecords.map((consent) => (
                      <Row key={String(consent.id)} title={String(consent.consent_type).replaceAll("_", " ")} meta={consent.granted ? "Granted" : "Withdrawn"} badge={consent.granted ? "Active" : "Withdrawn"} />
                    ))}
                  </RecordList>
                </Panel>
                <Panel title="Raise a Concern">
                  <select value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body bg-white mb-2">
                    <option value="care_quality">Care quality</option>
                    <option value="communication">Communication</option>
                    <option value="medication">Medication</option>
                    <option value="food">Food or nutrition</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} rows={3} placeholder="Describe the concern" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none mb-2" />
                  <input value={complaint.desired_outcome} onChange={(e) => setComplaint({ ...complaint, desired_outcome: e.target.value })} placeholder="Desired outcome (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body mb-3 focus:outline-none focus:border-cr-forest" />
                  <button onClick={submitComplaint} disabled={busy === "complaint"} className="inline-flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-semibold font-body">
                    {busy === "complaint" ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Raise concern
                  </button>
                  {props.complaints.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {props.complaints.map((row) => (
                        <Row key={String(row.id)} title={String(row.category ?? row.complaint_type ?? "Concern")} meta={formatDateTimeUK(String(row.created_at))} badge={String(row.status)} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </section>
          )}

          {/* MY TEAM */}
          {tab === "team" && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Panel title="Assigned Care Team">
                <RecordList empty="No carers have visited yet.">
                  {Array.from(assignedCarers.entries()).map(([id, carer]) => (
                    <Row key={id} title={`${carer.first_name ?? ""} ${carer.last_name ?? ""}`.trim()} meta="Care team member" />
                  ))}
                </RecordList>
              </Panel>
              <Panel title="Family Members with Access">
                <RecordList empty="No family members linked yet.">
                  {props.familyAccess.map((row) => {
                    const familyUser = row.users as Record<string, unknown> | null;
                    return (
                      <Row key={String(row.id)} title={`${familyUser?.first_name ?? ""} ${familyUser?.last_name ?? ""}`.trim()} meta={String(row.relationship ?? "Family")} badge={String(row.access_level ?? "standard")} />
                    );
                  })}
                </RecordList>
              </Panel>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={cn("bg-white rounded-xl border p-4 shadow-sm", accent ? "border-red-200" : "border-gray-100")}>
      <p className="text-xs font-body text-cr-slate uppercase tracking-wide">{label}</p>
      <p className={cn("font-display text-2xl font-semibold mt-1", accent ? "text-red-600" : "text-cr-charcoal")}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <h2 className="font-display text-base font-semibold text-cr-charcoal mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-body font-semibold text-cr-slate uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-body text-cr-charcoal whitespace-pre-wrap">{value || "Not recorded"}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm font-body text-cr-slate py-3">{text}</p>;
}

function RecordList({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return <div className="space-y-2">{children.length ? children : <Empty text={empty} />}</div>;
}

function Row({ title, meta, badge }: { title: string; meta?: string; badge?: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3.5 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-body font-semibold text-cr-charcoal capitalize">{title}</p>
          {meta && <p className="text-xs font-body text-cr-slate mt-1 line-clamp-2">{meta}</p>}
        </div>
        {badge && (
          <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full whitespace-nowrap capitalize flex-shrink-0 ${statusClass(badge)}`}>
            {badge.replaceAll("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}
