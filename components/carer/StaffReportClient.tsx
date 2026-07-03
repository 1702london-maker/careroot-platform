"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Shield, AlertTriangle, CheckCircle, ChevronLeft } from "lucide-react";

type Manager = { id: string; first_name: string; last_name: string; role: string };

interface Props {
  userId: string;
  userName: string;
  orgId: string;
  managers: Manager[];
}

const REPORT_TYPES = [
  {
    key: "boundary_family",
    label: "Boundary violation — Family member",
    description: "Inappropriate behaviour, harassment, or boundary crossing by a client's family member",
    icon: "👨‍👩‍👧",
    escalate: "manager",
  },
  {
    key: "boundary_client",
    label: "Boundary violation — Client",
    description: "Inappropriate behaviour or boundary crossing by a client during care delivery",
    icon: "🛡️",
    escalate: "manager",
  },
  {
    key: "unsafe_conditions",
    label: "Unsafe working conditions",
    description: "Environmental hazards, equipment failures, or unsafe practices during a shift",
    icon: "⚠️",
    escalate: "manager",
  },
  {
    key: "manager_conduct",
    label: "Concern about line manager",
    description: "Misconduct, bullying, unfair treatment, or failure to act on a safety concern by a line manager",
    icon: "📋",
    escalate: "org_admin",
  },
  {
    key: "whistleblowing",
    label: "Whistleblowing concern",
    description: "Serious concern about care standards, financial irregularities, or criminal activity within the organisation",
    icon: "🔔",
    escalate: "org_admin",
  },
  {
    key: "discrimination",
    label: "Discrimination / Harassment",
    description: "Racial, gender, disability, or any other form of discrimination or harassment",
    icon: "🤝",
    escalate: "org_admin",
  },
];

export function StaffReportClient({ userId, userName, orgId, managers }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"type" | "detail" | "done">("type");
  const [reportType, setReportType] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    incident_date: new Date().toISOString().slice(0, 10),
    location: "",
    witnesses: "",
    is_anonymous: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = REPORT_TYPES.find(t => t.key === reportType);

  // Determine who receives this — escalate "manager_conduct" / "whistleblowing" / "discrimination" to org_admin
  const recipients = managers.filter(m => {
    if (selectedType?.escalate === "org_admin") return m.role === "org_admin";
    return ["manager", "org_admin"].includes(m.role);
  });

  const handleSubmit = async () => {
    if (!form.description.trim() || !reportType) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("staff_complaints").insert({
      organisation_id: orgId,
      reported_by: form.is_anonymous ? null : userId,
      reporter_name: form.is_anonymous ? "Anonymous" : userName,
      complaint_type: reportType,
      subject: form.subject || selectedType?.label,
      description: form.description,
      incident_date: form.incident_date,
      location: form.location,
      witnesses: form.witnesses,
      is_anonymous: form.is_anonymous,
      escalate_to: selectedType?.escalate,
      status: "submitted",
    });

    setSaving(false);

    if (err) {
      setError("Failed to submit report. Please try again or speak to a manager directly.");
      return;
    }

    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="text-center py-12">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Report Submitted</h2>
        <p className="text-sm text-cr-slate max-w-xs mx-auto">
          Your report has been securely submitted to{" "}
          {selectedType?.escalate === "org_admin" ? "senior management" : "your management team"}.
          {form.is_anonymous ? " Your identity has been kept confidential." : ""}
        </p>
        <p className="text-xs text-cr-slate mt-4">You should receive an acknowledgement within 2 working days.</p>
        <button
          onClick={() => router.push("/carer")}
          className="cr-btn-primary mt-6 px-6 py-2.5"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (step === "type") {
    return (
      <div className="space-y-3">
        <CRAlertBanner
          variant="blue"
          title="Your report is confidential"
          description="All reports are handled in accordance with our Whistleblowing and Grievance policies. You may choose to report anonymously."
        />

        <p className="text-sm font-semibold text-cr-charcoal">What would you like to report?</p>

        {REPORT_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => { setReportType(type.key); setStep("detail"); }}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-cr-forest hover:bg-cr-mint transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{type.icon}</span>
              <div>
                <p className="font-semibold text-cr-charcoal text-sm">{type.label}</p>
                <p className="text-xs text-cr-slate mt-0.5">{type.description}</p>
                {type.escalate === "org_admin" && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
                    Goes to senior management
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setStep("type")}
        className="flex items-center gap-1 text-sm text-cr-slate hover:text-cr-forest transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <CRCard>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">{selectedType?.icon}</span>
          <div>
            <p className="font-semibold text-cr-charcoal">{selectedType?.label}</p>
            <p className="text-xs text-cr-slate">{selectedType?.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">Date of incident <span className="text-cr-red">*</span></label>
            <input
              type="date"
              value={form.incident_date}
              onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">Location / setting</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Client's home, office, telephone call"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">
              Full description <span className="text-cr-red">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              placeholder="Describe what happened in as much detail as possible — what was said, what actions were taken, how it made you feel..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cr-charcoal mb-1">Witnesses (if any)</label>
            <input
              type="text"
              value={form.witnesses}
              onChange={e => setForm(f => ({ ...f, witnesses: e.target.value }))}
              placeholder="Names of anyone who witnessed this"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>

          {/* Anonymous option */}
          <label className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
              className="mt-0.5 accent-cr-forest"
            />
            <div>
              <p className="text-sm font-medium text-cr-charcoal">Submit anonymously</p>
              <p className="text-xs text-cr-slate">Your name will not be included in the report. Note: this may limit our ability to follow up with you.</p>
            </div>
          </label>

          {/* Who receives it */}
          <div className="bg-cr-mint rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-cr-forest mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cr-forest">
                  This report will go to {selectedType?.escalate === "org_admin" ? "senior management" : "your management team"}
                </p>
                <p className="text-xs text-cr-slate mt-0.5">
                  {recipients.map(m => `${m.first_name} ${m.last_name}`).join(", ") || "Management"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} className="text-cr-red mt-0.5 flex-shrink-0" />
              <p className="text-xs text-cr-red">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || !form.description.trim()}
            className="w-full cr-btn-primary py-3"
          >
            {saving ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </CRCard>
    </div>
  );
}
