"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarClock, ClipboardList, HeartPulse, LogOut, MessageSquare,
  Pill, ShieldCheck, Users, Loader2, CheckCircle2, AlertTriangle,
  Leaf, ChevronRight, PenLine,
} from "lucide-react";
import { formatDateTimeUK, formatDateUK } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "today" | "care" | "medication" | "history" | "rights" | "team" | "preferences";

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
  userEmail: string | null;
};

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "today", label: "Today", icon: <CalendarClock size={18} /> },
  { id: "care", label: "My Care", icon: <ClipboardList size={18} /> },
  { id: "medication", label: "Medication", icon: <Pill size={18} /> },
  { id: "history", label: "History", icon: <HeartPulse size={18} /> },
  { id: "rights", label: "My Rights", icon: <ShieldCheck size={18} /> },
  { id: "team", label: "Support", icon: <Users size={18} /> },
  { id: "preferences", label: "My Preferences", icon: <PenLine size={18} /> },
];

function statusClass(status?: string) {
  const normalised = status?.toLowerCase().replaceAll(" ", "_");
  if (normalised === "completed" || normalised === "administered" || normalised === "given") return "bg-green-100 text-green-700";
  if (normalised === "missed" || normalised === "refused" || normalised === "overdue" || normalised === "to_review") return "bg-amber-100 text-amber-700";
  if (normalised === "in_progress" || normalised === "received" || normalised === "scheduled" || normalised === "planned") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export function ClientPortalClient(props: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("today");
  const [sarReason, setSarReason] = useState("");
  const [complaint, setComplaint] = useState({ category: "care_quality", description: "", desired_outcome: "" });
  const [busy, setBusy] = useState<"sar" | "complaint" | "preferences" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [prefForm, setPrefForm] = useState({
    medications_summary: "",
    allergies: "",
    dietary_requirements: "",
    food_preferences: "",
    daily_routine: "",
    triggers: "",
    care_preferences: "",
    other_notes: "",
  });

  const clientName = `${props.client.first_name ?? ""} ${props.client.last_name ?? ""}`.trim() || "My";
  const displayName = clientName === "My" ? "My" : clientName;

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

  async function submitPreferences() {
    const hasContent = Object.values(prefForm).some((v) => v.trim());
    if (!hasContent) { setError("Please fill in at least one field."); return; }
    setBusy("preferences"); setError(""); setMessage("");
    const res = await fetch("/api/client/update-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: props.client.id, ...prefForm }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not save preferences"); return; }
    setPrefForm({ medications_summary: "", allergies: "", dietary_requirements: "", food_preferences: "", daily_routine: "", triggers: "", care_preferences: "", other_notes: "" });
    setMessage("Your information has been sent to your care manager. They will update your records within 48 hours.");
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
            <p className="font-display text-base font-semibold text-white leading-snug">{displayName}</p>
            <p className="text-xs font-body text-white/50 mt-0.5">Secure care portal</p>
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
          <span className="sr-only">Sign out</span>
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
            <p className="text-xs font-body text-cr-slate mt-0.5">{displayName === "My" ? "My care portal" : `${displayName}'s care portal`}</p>
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
                    return (
                      <Row
                        key={String(visit.id)}
                        title={formatDateTimeUK(String(visit.scheduled_start))}
                        meta="Your care provider will confirm the visit team directly."
                        badge={clientVisitStatus(String(visit.status ?? "scheduled"))}
                      />
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
                    <Info label="What this means" value="Your current care plan is available to the care team. Your provider will discuss any changes, restrictions, or review points with you directly." />
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
                    <Row
                      key={String(visit.id)}
                      title={formatDateTimeUK(String(visit.scheduled_start))}
                      meta={clientVisitSummary(visit)}
                      badge={clientVisitStatus(String(visit.status ?? "scheduled"))}
                    />
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

          {/* MY PREFERENCES */}
          {tab === "preferences" && (
            <section className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-body text-blue-800">
                  You know yourself best. Share your preferences, medication details, and daily routine below — your care manager will review everything and update your care records within 48 hours.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Panel title="Medications I Take">
                  <p className="text-xs font-body text-cr-slate mb-3">List any medications you take, even if you think the care team already knows.</p>
                  <textarea
                    value={prefForm.medications_summary}
                    onChange={(e) => setPrefForm({ ...prefForm, medications_summary: e.target.value })}
                    rows={4}
                    placeholder="e.g. Amlodipine 5mg once a day in the morning. Aspirin 75mg with breakfast."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                  />
                  <p className="text-xs font-body text-cr-slate mt-3 mb-1 font-semibold">Allergies / things that don&apos;t agree with me</p>
                  <textarea
                    value={prefForm.allergies}
                    onChange={(e) => setPrefForm({ ...prefForm, allergies: e.target.value })}
                    rows={2}
                    placeholder="e.g. Penicillin allergy. Lactose intolerant. Strong smells give me headaches."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                  />
                </Panel>

                <Panel title="Food & Nutrition">
                  <p className="text-xs font-body text-cr-slate mb-2 font-semibold">Dietary needs</p>
                  <textarea
                    value={prefForm.dietary_requirements}
                    onChange={(e) => setPrefForm({ ...prefForm, dietary_requirements: e.target.value })}
                    rows={2}
                    placeholder="e.g. Soft food only. No red meat. Low salt."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest mb-2"
                  />
                  <p className="text-xs font-body text-cr-slate mb-1 font-semibold">What I like and dislike</p>
                  <textarea
                    value={prefForm.food_preferences}
                    onChange={(e) => setPrefForm({ ...prefForm, food_preferences: e.target.value })}
                    rows={2}
                    placeholder="e.g. Love porridge and toast in the morning. Enjoy a cup of tea at 3pm. Don&apos;t like fish."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                  />
                </Panel>

                <Panel title="My Daily Routine">
                  <p className="text-xs font-body text-cr-slate mb-3">Describe your preferred daily routine so carers can follow what works for you.</p>
                  <textarea
                    value={prefForm.daily_routine}
                    onChange={(e) => setPrefForm({ ...prefForm, daily_routine: e.target.value })}
                    rows={5}
                    placeholder="e.g. I wake up around 7:30am. I like tea before getting up. I shower after breakfast. I have a nap after lunch. I like to be in bed by 9:30pm."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                  />
                </Panel>

                <Panel title="Things to Know About Me">
                  <p className="text-xs font-body text-cr-slate mb-1 font-semibold">Things that upset or stress me</p>
                  <textarea
                    value={prefForm.triggers}
                    onChange={(e) => setPrefForm({ ...prefForm, triggers: e.target.value })}
                    rows={2}
                    placeholder="e.g. I get anxious if rushed. Loud noises upset me. I don&apos;t like being talked about as if I&apos;m not in the room."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest mb-2"
                  />
                  <p className="text-xs font-body text-cr-slate mb-1 font-semibold">How I like to be cared for</p>
                  <textarea
                    value={prefForm.care_preferences}
                    onChange={(e) => setPrefForm({ ...prefForm, care_preferences: e.target.value })}
                    rows={3}
                    placeholder="e.g. I prefer a female carer for personal care. Please call me by my first name. I like to do as much as I can myself — only help when I ask."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                  />
                </Panel>
              </div>

              <Panel title="Anything Else You Want Us to Know">
                <textarea
                  value={prefForm.other_notes}
                  onChange={(e) => setPrefForm({ ...prefForm, other_notes: e.target.value })}
                  rows={4}
                  placeholder="Anything else — your background, interests, what brings you joy, communication needs, important people in your life, or anything you want carers to understand."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body resize-none focus:outline-none focus:border-cr-forest"
                />
              </Panel>

              <div className="flex justify-end">
                <button
                  onClick={submitPreferences}
                  disabled={busy === "preferences"}
                  className="inline-flex items-center gap-2 bg-cr-forest text-white px-6 py-2.5 rounded-lg text-sm font-semibold font-body hover:bg-cr-sage transition-colors disabled:opacity-60"
                >
                  {busy === "preferences" ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
                  {busy === "preferences" ? "Sending…" : "Send to my care manager"}
                </button>
              </div>
            </section>
          )}

          {/* SUPPORT */}
          {tab === "team" && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Panel title="Your Care Provider">
                <Info label="Care coordination" value="For questions about visits, carers, medication, nutrition, or your care plan, contact your care provider directly." />
                <Info label="Privacy" value="For safety and confidentiality, this portal does not show internal staffing allocations or other people who may have portal access." />
              </Panel>
              <Panel title="Need Help?">
                <Info label="Urgent concerns" value="If there is immediate danger, call emergency services. For care concerns, use My Rights to raise a concern with management." />
                <Info label="Portal account" value="Use Sign out when you finish, especially on a shared phone, tablet, or computer." />
              </Panel>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function clientVisitStatus(status: string) {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "in_progress") return "In progress";
  if (status === "missed" || status === "overdue") return "To review";
  return "Planned";
}

function clientVisitSummary(visit: Record<string, unknown>) {
  const status = String(visit.status ?? "scheduled");
  if (status === "completed") return String(visit.ai_summary ?? "Care visit completed.");
  if (status === "in_progress") return "Care visit is in progress.";
  if (status === "cancelled") return "This visit was cancelled by your care provider.";
  if (status === "missed" || status === "overdue") return "Your care provider is reviewing this visit record.";
  return "Care visit planned.";
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
