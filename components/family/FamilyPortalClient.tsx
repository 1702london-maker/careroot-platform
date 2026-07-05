"use client";

import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Heart, Clock, FileText, MessageSquare, Shield, ChevronRight,
  Loader2, CheckCircle2, AlertTriangle, Utensils, Pill, LogOut, User2
} from "lucide-react";
import { formatDateTimeUK } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Tab = "overview" | "visits" | "care" | "complaint" | "sar";

const statusColour = (s: string) => {
  if (s === "completed") return "bg-green-100 text-green-700";
  if (s === "missed") return "bg-red-100 text-red-700";
  if (s === "in_progress") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
};

export function FamilyPortalClient({
  client, accessLevel, accessId, familyUser, recentVisits, complaints, briefings,
}: {
  client: Record<string, unknown>;
  accessLevel: string;
  accessId: string;
  familyUser: { first_name: string; last_name: string; email: string; phone?: string | null } | null;
  recentVisits: unknown[];
  complaints: unknown[];
  briefings: unknown[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  // Care info update state
  const [careForm, setCareForm] = useState({
    dietary_requirements: String(client.dietary_requirements ?? ""),
    food_timetable: String(client.food_timetable ?? ""),
    food_preferences: String(client.food_preferences ?? ""),
    care_notes: String(client.care_notes_family ?? ""),
    medications_summary: String(client.medications_summary ?? ""),
    allergies: Array.isArray(client.allergies) ? (client.allergies as string[]).join(", ") : String(client.allergies ?? ""),
  });
  const [careSaving, setCareSaving] = useState(false);
  const [careSaved, setCareSaved] = useState(false);
  const [careError, setCareError] = useState("");

  // Complaint state
  const [complaintForm, setComplaintForm] = useState({ complaint_type: "care_quality", description: "", priority: "medium" });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState("");
  const [complaintError, setComplaintError] = useState("");

  // SAR state
  const [sarReason, setSarReason] = useState("");
  const [submittingSar, setSubmittingSar] = useState(false);
  const [sarSuccess, setSarSuccess] = useState("");
  const [sarError, setSarError] = useState("");

  const clientName = `${client.first_name} ${client.last_name}`;

  const handleSaveCare = async () => {
    setCareSaving(true); setCareError(""); setCareSaved(false);
    const res = await fetch("/api/family/update-care", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_id: accessId, client_id: client.id, ...careForm }),
    });
    const data = await res.json().catch(() => ({}));
    setCareSaving(false);
    if (!res.ok) { setCareError(data.error ?? "Failed to save"); return; }
    setCareSaved(true);
    setTimeout(() => setCareSaved(false), 3000);
  };

  const handleComplaint = async () => {
    if (!complaintForm.description.trim()) { setComplaintError("Please describe the complaint"); return; }
    setSubmittingComplaint(true); setComplaintError(""); setComplaintSuccess("");
    const res = await fetch("/api/family/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: client.id, organisation_id: client.organisation_id,
        complainant_name: `${familyUser?.first_name} ${familyUser?.last_name}`,
        complainant_email: familyUser?.email,
        complainant_phone: familyUser?.phone,
        ...complaintForm,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmittingComplaint(false);
    if (!res.ok) { setComplaintError(data.error ?? "Failed to submit"); return; }
    setComplaintSuccess("Complaint submitted. The manager will respond within 28 days.");
    setComplaintForm({ complaint_type: "care_quality", description: "", priority: "medium" });
  };

  const handleSar = async () => {
    setSubmittingSar(true); setSarError(""); setSarSuccess("");
    const res = await fetch("/api/family/sar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: client.id, organisation_id: client.organisation_id,
        requester_name: `${familyUser?.first_name} ${familyUser?.last_name}`,
        requester_email: familyUser?.email,
        reason: sarReason,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmittingSar(false);
    if (!res.ok) { setSarError(data.error ?? "Failed to submit"); return; }
    setSarSuccess("SAR request submitted. You will receive a response within 30 days.");
    setSarReason("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/family/login");
  };

  const TAB_CONFIG: { id: Tab; label: string; icon: ReactNode; show: boolean }[] = (
    [
      { id: "overview" as Tab, label: "Overview", icon: <Heart size={18} />, show: true },
      { id: "visits" as Tab, label: "Visits", icon: <Clock size={18} />, show: true },
      { id: "care" as Tab, label: "Care Info", icon: <Utensils size={18} />, show: accessLevel === "full" },
      { id: "complaint" as Tab, label: "Raise Concern", icon: <MessageSquare size={18} />, show: accessLevel !== "limited" },
      { id: "sar" as Tab, label: "Request SAR", icon: <Shield size={18} />, show: accessLevel === "full" },
    ] satisfies { id: Tab; label: string; icon: ReactNode; show: boolean }[]
  ).filter(t => t.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cr-forest text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70 font-body">Family Portal</p>
            <p className="font-display font-semibold text-lg">{clientName}</p>
            <p className="text-xs opacity-70 font-body capitalize">{client.status as string} · {client.risk_level as string} risk</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs opacity-70 font-body">Signed in as</p>
              <p className="text-sm font-body font-medium">{familyUser?.first_name} {familyUser?.last_name}</p>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {TAB_CONFIG.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-body font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? "border-cr-forest text-cr-forest" : "border-transparent text-cr-slate hover:text-cr-charcoal"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            {/* Latest briefing from manager */}
            {briefings.length > 0 && (
              <div className="bg-cr-mint border border-cr-forest/20 rounded-xl p-4">
                <p className="text-xs font-body font-semibold text-cr-forest uppercase tracking-wide mb-2">Latest update from care team</p>
                <p className="text-sm font-body text-cr-charcoal leading-relaxed">
                  {(briefings[0] as Record<string, unknown>).content as string}
                </p>
                <p className="text-xs text-cr-slate font-body mt-2">{formatDateTimeUK((briefings[0] as Record<string, unknown>).created_at as string)}</p>
              </div>
            )}

            {/* Key care info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              <div className="px-4 py-3">
                <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Service user</p>
                <p className="text-sm font-body font-semibold text-cr-charcoal">{clientName}</p>
              </div>
              {Boolean(client.primary_diagnosis) && (
                <div className="px-4 py-3">
                  <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Primary diagnosis</p>
                  <p className="text-sm font-body text-cr-charcoal">{client.primary_diagnosis as string}</p>
                </div>
              )}
              {Boolean(client.dietary_requirements) && (
                <div className="px-4 py-3 flex items-start gap-2">
                  <Utensils size={14} className="text-cr-forest mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Dietary requirements</p>
                    <p className="text-sm font-body text-cr-charcoal">{client.dietary_requirements as string}</p>
                  </div>
                </div>
              )}
              {Boolean(client.medications_summary) && (
                <div className="px-4 py-3 flex items-start gap-2">
                  <Pill size={14} className="text-cr-forest mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1">Medications</p>
                    <p className="text-sm font-body text-cr-charcoal">{client.medications_summary as string}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {TAB_CONFIG.filter(t => t.id !== "overview").map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-cr-forest/30 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-cr-forest">{t.icon}</span>
                    <span className="text-sm font-body font-medium text-cr-charcoal">{t.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-cr-slate" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISITS ── */}
        {tab === "visits" && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Visit log</h2>
            {recentVisits.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={36} className="mx-auto text-cr-slate opacity-30 mb-2" />
                <p className="text-sm font-body text-cr-slate">No visits recorded yet</p>
              </div>
            ) : (recentVisits as Record<string, unknown>[]).map(v => {
              const carer = v.users as { first_name: string; last_name: string } | null;
              return (
                <div key={v.id as string} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-body font-semibold text-cr-charcoal">{formatDateTimeUK(v.scheduled_start as string)}</p>
                      {carer && <p className="text-xs font-body text-cr-slate">Carer: {carer.first_name} {carer.last_name}</p>}
                    </div>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full capitalize ${statusColour(v.status as string)}`}>
                      {(v.status as string)?.replace("_", " ")}
                    </span>
                  </div>
                  {Boolean(v.notes) && (
                    <p className="text-xs font-body text-cr-slate border-t border-gray-50 pt-2 mt-2 leading-relaxed">{v.notes as string}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CARE INFO ── */}
        {tab === "care" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Care information</h2>
            <p className="text-sm font-body text-cr-slate">Update information about {clientName}&apos;s care needs. Changes are sent to the care manager for review.</p>

            {[
              { key: "dietary_requirements", label: "Dietary requirements & restrictions", rows: 3, placeholder: "e.g. Vegetarian, no nuts, soft food only..." },
              { key: "food_timetable", label: "Preferred meal timetable", rows: 4, placeholder: "e.g. Breakfast 8am — porridge, Lunch 12:30pm — soup and sandwich..." },
              { key: "food_preferences", label: "Food preferences & dislikes", rows: 3, placeholder: "e.g. Loves shepherd's pie, dislikes fish..." },
              { key: "medications_summary", label: "Medication information", rows: 3, placeholder: "e.g. Metformin 500mg twice daily with food..." },
              { key: "allergies", label: "Known allergies (comma separated)", rows: 2, placeholder: "e.g. Penicillin, latex, eggs..." },
              { key: "care_notes", label: "How to care for {name} — important notes", rows: 5, placeholder: "e.g. Needs reassurance when anxious. Responds well to classical music. Prefers female carers for personal care..." },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">
                  {field.label.replace("{name}", clientName as string)}
                </label>
                <textarea
                  rows={field.rows}
                  value={careForm[field.key as keyof typeof careForm]}
                  onChange={e => setCareForm({ ...careForm, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none"
                />
              </div>
            ))}

            {careError && <p className="text-xs text-cr-red font-body">{careError}</p>}
            <button
              onClick={handleSaveCare}
              disabled={careSaving}
              className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg font-body font-semibold text-sm disabled:opacity-60"
            >
              {careSaving ? <Loader2 size={14} className="animate-spin" /> : careSaved ? <CheckCircle2 size={14} /> : <FileText size={14} />}
              {careSaving ? "Saving…" : careSaved ? "Saved — sent to manager" : "Save & send to care team"}
            </button>
          </div>
        )}

        {/* ── COMPLAINT ── */}
        {tab === "complaint" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Raise a concern</h2>
            <p className="text-sm font-body text-cr-slate">Complaints are sent directly to the care manager and coordinator. We aim to respond within 28 days.</p>

            {complaintSuccess ? (
              <div className="flex items-start gap-3 bg-cr-mint border border-cr-forest/20 rounded-xl p-4">
                <CheckCircle2 size={20} className="text-cr-forest flex-shrink-0 mt-0.5" />
                <p className="text-sm font-body text-cr-charcoal">{complaintSuccess}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Type of concern</label>
                  <select
                    value={complaintForm.complaint_type}
                    onChange={e => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest bg-white"
                  >
                    <option value="care_quality">Care quality</option>
                    <option value="staff_conduct">Staff conduct</option>
                    <option value="communication">Communication</option>
                    <option value="scheduling">Scheduling / missed visits</option>
                    <option value="billing">Billing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Urgency</label>
                  <select
                    value={complaintForm.priority}
                    onChange={e => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest bg-white"
                  >
                    <option value="low">Low — general concern</option>
                    <option value="medium">Medium — needs attention soon</option>
                    <option value="high">High — urgent issue</option>
                    <option value="urgent">Urgent — immediate risk to welfare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Describe the concern *</label>
                  <textarea
                    rows={6}
                    value={complaintForm.description}
                    onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    placeholder="Please describe what happened, when it occurred, and what outcome you would like..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none"
                  />
                </div>
                {complaintError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertTriangle size={14} className="text-cr-red flex-shrink-0" />
                    <p className="text-xs font-body text-cr-red">{complaintError}</p>
                  </div>
                )}
                <button
                  onClick={handleComplaint}
                  disabled={submittingComplaint}
                  className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg font-body font-semibold text-sm disabled:opacity-60"
                >
                  {submittingComplaint ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  {submittingComplaint ? "Submitting…" : "Submit complaint"}
                </button>

                {/* Previous complaints */}
                {(complaints as unknown[]).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-body text-sm font-semibold text-cr-charcoal mb-3">Your previous complaints</h3>
                    <div className="space-y-2">
                      {(complaints as Record<string, unknown>[]).map(c => (
                        <div key={c.id as string} className="bg-white border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-body text-cr-charcoal font-medium capitalize">{(c.complaint_type as string).replace("_", " ")}</p>
                            <p className="text-xs font-body text-cr-slate mt-0.5 line-clamp-2">{c.description as string}</p>
                            <p className="text-[10px] font-body text-cr-slate mt-1">{formatDateTimeUK(c.created_at as string)}</p>
                          </div>
                          <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${statusColour(c.status as string)}`}>
                            {c.status as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SAR ── */}
        {tab === "sar" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Request a Subject Access Report</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-body text-blue-800 leading-relaxed">
                Under GDPR, you have the right to request all personal data held about {clientName}. We will provide a full copy within <strong>30 days</strong>. There is no fee for this request.
              </p>
            </div>

            {sarSuccess ? (
              <div className="flex items-start gap-3 bg-cr-mint border border-cr-forest/20 rounded-xl p-4">
                <CheckCircle2 size={20} className="text-cr-forest flex-shrink-0 mt-0.5" />
                <p className="text-sm font-body text-cr-charcoal">{sarSuccess}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Reason for request (optional)</label>
                  <textarea
                    rows={4}
                    value={sarReason}
                    onChange={e => setSarReason(e.target.value)}
                    placeholder="e.g. Reviewing care quality over the past 6 months, or for legal purposes..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest resize-none"
                  />
                </div>
                {sarError && <p className="text-xs text-cr-red font-body">{sarError}</p>}
                <button
                  onClick={handleSar}
                  disabled={submittingSar}
                  className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg font-body font-semibold text-sm disabled:opacity-60"
                >
                  {submittingSar ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  {submittingSar ? "Submitting…" : "Submit SAR request"}
                </button>
                <p className="text-xs font-body text-cr-slate">
                  Request will be logged and sent to {clientName}&apos;s care manager. You will receive an email confirmation.
                </p>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
