"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import {
  User, FileText, BookOpen, Award, AlertTriangle,
  Banknote, CheckCircle, XCircle, Upload, Plus,
  AlertCircle, Shield, FileCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────
type StaffMember = Record<string, unknown>;
type Document = {
  id: string; document_key: string; document_label: string;
  document_category: string; status: string; file_url?: string;
  file_name?: string; issue_date?: string; expiry_date?: string;
  is_mandatory: boolean; notes?: string;
};
type Training = {
  id: string; training_key: string; training_name: string;
  training_category: string; status: string; is_mandatory: boolean;
  completed_date?: string; expiry_date?: string; certificate_number?: string;
  renewal_frequency_months?: number; booked_date?: string;
};
type Supervision = {
  id: string; supervision_type: string; scheduled_date?: string;
  completed_date?: string; duration_minutes?: number; status: string;
  notes?: string; action_points?: unknown[]; next_due_date?: string;
  supervisor?: { first_name: string; last_name: string } | null;
};
type Incident = {
  id: string; title: string; severity: string; status: string; created_at: string;
};
type Policy = {
  id: string; policy_key: string; policy_name: string; policy_version?: string;
  acknowledged_at?: string; is_new?: boolean; policy_url?: string;
};

interface Props {
  staffMember: StaffMember;
  documents: Document[];
  training: Training[];
  supervisions: Supervision[];
  incidents: Incident[];
  policies: Policy[];
  viewerRole: string;
}

// ─── Constants ───────────────────────────────────────────
const DOCUMENT_LIBRARY: Record<string, { label: string; category: string; mandatory: boolean; hasExpiry: boolean }[]> = {
  employment: [
    { label: "Signed employment contract", category: "employment", mandatory: true, hasExpiry: false },
    { label: "Job description", category: "employment", mandatory: true, hasExpiry: false },
    { label: "Right to work evidence", category: "employment", mandatory: true, hasExpiry: true },
    { label: "Bank details form", category: "employment", mandatory: true, hasExpiry: false },
    { label: "Tax code declaration (P45/P46)", category: "employment", mandatory: true, hasExpiry: false },
    { label: "Pension auto-enrolment letter", category: "employment", mandatory: true, hasExpiry: false },
  ],
  compliance: [
    { label: "DBS enhanced disclosure certificate", category: "compliance", mandatory: true, hasExpiry: true },
    { label: "DBS update service consent", category: "compliance", mandatory: true, hasExpiry: false },
    { label: "DBS barring list check confirmation", category: "compliance", mandatory: true, hasExpiry: false },
    { label: "Reference 1 (most recent employer)", category: "compliance", mandatory: true, hasExpiry: false },
    { label: "Reference 2", category: "compliance", mandatory: true, hasExpiry: false },
    { label: "Reference verification log", category: "compliance", mandatory: true, hasExpiry: false },
  ],
  identity_health: [
    { label: "Photo ID (passport / driving licence)", category: "identity_health", mandatory: true, hasExpiry: true },
    { label: "Proof of address", category: "identity_health", mandatory: true, hasExpiry: false },
    { label: "Occupational health questionnaire", category: "identity_health", mandatory: true, hasExpiry: false },
    { label: "Immunisation records (Hep B, COVID, Flu)", category: "identity_health", mandatory: true, hasExpiry: false },
    { label: "Manual handling assessment", category: "identity_health", mandatory: true, hasExpiry: true },
  ],
  care_specific: [
    { label: "Care Certificate (15 Standards)", category: "care_specific", mandatory: true, hasExpiry: false },
    { label: "NVQ / QCF / RQF Certificate", category: "care_specific", mandatory: false, hasExpiry: false },
    { label: "Moving & Handling certificate", category: "care_specific", mandatory: true, hasExpiry: true },
    { label: "First aid certificate", category: "care_specific", mandatory: true, hasExpiry: true },
    { label: "Medication administration certificate", category: "care_specific", mandatory: false, hasExpiry: true },
    { label: "Food hygiene certificate", category: "care_specific", mandatory: true, hasExpiry: true },
    { label: "Safeguarding adults certificate", category: "care_specific", mandatory: true, hasExpiry: true },
    { label: "Safeguarding children certificate", category: "care_specific", mandatory: false, hasExpiry: true },
    { label: "Mental Capacity Act training", category: "care_specific", mandatory: true, hasExpiry: false },
    { label: "DoLS training", category: "care_specific", mandatory: true, hasExpiry: false },
    { label: "Fire safety certificate", category: "care_specific", mandatory: true, hasExpiry: true },
    { label: "Infection prevention & control certificate", category: "care_specific", mandatory: true, hasExpiry: true },
  ],
  policies_signed: [
    { label: "Confidentiality & data protection policy", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Social media policy", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Whistleblowing policy", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Lone working policy", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Code of conduct", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Safeguarding policy", category: "policies_signed", mandatory: true, hasExpiry: false },
    { label: "Medication policy", category: "policies_signed", mandatory: true, hasExpiry: false },
  ],
};

const TRAINING_MATRIX = [
  { key: "induction_care_cert", name: "Induction — Care Certificate (15 Standards)", category: "mandatory_all", mandatory: true, renewalMonths: 0 },
  { key: "health_safety", name: "Health & Safety", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "fire_safety", name: "Fire Safety", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "ipc", name: "Infection Prevention & Control", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "manual_handling", name: "Manual Handling (theory + practical)", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "safeguarding_adults", name: "Safeguarding Adults (Level 2)", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "information_governance", name: "Information Governance / GDPR", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "equality_diversity", name: "Equality & Diversity", category: "mandatory_all", mandatory: true, renewalMonths: 24 },
  { key: "complaints_whistleblowing", name: "Complaints & Whistleblowing", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "mca_dols", name: "Mental Capacity Act & DoLS", category: "mandatory_all", mandatory: true, renewalMonths: 12 },
  { key: "first_aid", name: "First Aid at Work / Basic Life Support", category: "mandatory_all", mandatory: true, renewalMonths: 36 },
  { key: "food_safety", name: "Food Safety & Hygiene", category: "mandatory_all", mandatory: true, renewalMonths: 36 },
  { key: "medication_admin", name: "Safe Handling of Medication (Level 2)", category: "medication", mandatory: false, renewalMonths: 12 },
  { key: "medication_competency", name: "Annual Medication Competency Assessment", category: "medication", mandatory: false, renewalMonths: 12 },
  { key: "oral_care", name: "Oral Care", category: "dom_care", mandatory: false, renewalMonths: 24 },
  { key: "continence_care", name: "Continence Care", category: "dom_care", mandatory: false, renewalMonths: 24 },
  { key: "nutrition_hydration", name: "Nutrition & Hydration", category: "dom_care", mandatory: false, renewalMonths: 24 },
  { key: "pressure_ulcer", name: "Pressure Ulcer Prevention & Awareness", category: "dom_care", mandatory: false, renewalMonths: 24 },
  { key: "dementia_awareness", name: "Dementia Awareness", category: "dom_care", mandatory: false, renewalMonths: 24 },
  { key: "safeguarding_children", name: "Safeguarding Children (Level 2+)", category: "childrens", mandatory: false, renewalMonths: 12 },
  { key: "pmva", name: "PMVA / Therapeutic Crisis Intervention", category: "childrens", mandatory: false, renewalMonths: 12 },
  { key: "childrens_rights", name: "Children's Rights", category: "childrens", mandatory: false, renewalMonths: 24 },
  { key: "county_lines", name: "County Lines & CSE Awareness", category: "childrens", mandatory: false, renewalMonths: 12 },
  { key: "prevent", name: "Prevent (Anti-Radicalisation)", category: "childrens", mandatory: false, renewalMonths: 12 },
];

const CATEGORY_LABELS: Record<string, string> = {
  employment: "Employment",
  compliance: "Compliance & DBS",
  identity_health: "Identity & Health",
  care_specific: "Care-Specific Certificates",
  policies_signed: "Policies Signed",
  mandatory_all: "Mandatory — All Staff",
  medication: "Medication",
  dom_care: "Domiciliary Care",
  childrens: "Children's Services",
  management: "Management",
};

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "training", label: "Training", icon: Award },
  { key: "policies", label: "Policies", icon: Shield },
  { key: "supervision", label: "Supervision", icon: BookOpen },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
  { key: "payroll", label: "Payroll", icon: Banknote },
];

// ─── Status helpers ───────────────────────────────────────
function docStatusIcon(status: string) {
  if (status === "verified") return <CheckCircle size={15} className="text-green-500 flex-shrink-0" />;
  if (status === "uploaded") return <CheckCircle size={15} className="text-blue-400 flex-shrink-0" />;
  if (status === "expired" || status === "expiring_soon") return <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />;
  return <XCircle size={15} className="text-gray-300 flex-shrink-0" />;
}

function trainingStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    renewal_due: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
    not_started: "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    completed: "Completed", in_progress: "In Progress",
    renewal_due: "Renewal Due", overdue: "Overdue", not_started: "Not Started",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {label[status] ?? status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────
export function StaffProfileClient({ staffMember, documents, training, supervisions, incidents, policies, viewerRole }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [uploading, setUploading] = useState<string | null>(null);
  const supabase = createClient();

  const isManager = ["org_admin", "manager", "superadmin"].includes(viewerRole);

  // Document lookup by key
  const docMap = Object.fromEntries(documents.map(d => [d.document_key, d]));
  const trainingMap = Object.fromEntries(training.map(t => [t.training_key, t]));

  // Upload a document
  const handleUpload = async (docKey: string, category: string, label: string, file: File) => {
    setUploading(docKey);
    try {
      const payload = new FormData();
      payload.append("staff_id", String(staffMember.id));
      payload.append("document_key", docKey);
      payload.append("document_label", label);
      payload.append("document_category", category);
      payload.append("file", file);

      const res = await fetch("/api/staff/documents", { method: "POST", body: payload });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  // Update training status
  const updateTraining = async (trainingKey: string, trainingName: string, category: string, updates: Partial<Training>) => {
    const existing = trainingMap[trainingKey];
    if (existing) {
      await supabase.from("staff_training").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("staff_training").insert({
        organisation_id: staffMember.organisation_id,
        staff_id: staffMember.id,
        training_key: trainingKey,
        training_name: trainingName,
        training_category: category,
        is_mandatory: true,
        ...updates,
      });
    }
    window.location.reload();
  };

  const fm = staffMember;
  const fullName = `${fm.first_name} ${fm.last_name}`;

  // Stats for documents
  const totalMandatoryDocs = Object.values(DOCUMENT_LIBRARY).flat().filter(d => d.mandatory).length;
  const uploadedDocs = documents.filter(d => ["uploaded", "verified"].includes(d.status)).length;
  const trainingCompleted = training.filter(t => t.status === "completed").length;
  const totalTraining = TRAINING_MATRIX.length;
  const trainingPct = Math.round((trainingCompleted / totalTraining) * 100);

  return (
    <div>
      {/* Profile header card */}
      <CRCard className="mb-4">
        <div className="flex items-start gap-4">
          <CRAvatar
            src={fm.avatar_url as string}
            name={fullName}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-semibold text-cr-charcoal">{fullName}</h2>
              <CRBadge variant={fm.is_active ? "green" : "slate"}>
                {fm.is_active ? "Active" : "Inactive"}
              </CRBadge>
            </div>
            <p className="text-sm text-cr-slate capitalize mt-0.5">{String(fm.role ?? "").replace(/_/g, " ")}</p>
            {Boolean(fm.email) && <p className="text-xs text-cr-slate mt-1">{String(fm.email)}</p>}
            {Boolean(fm.phone) && <p className="text-xs text-cr-slate">{String(fm.phone)}</p>}
          </div>
          <div className="text-right flex-shrink-0 space-y-1">
            <div className="text-xs text-cr-slate">Docs uploaded</div>
            <div className="font-bold text-cr-charcoal">{uploadedDocs}/{totalMandatoryDocs}</div>
            <div className="text-xs text-cr-slate mt-2">Training</div>
            <div className={`font-bold ${trainingPct >= 80 ? "text-green-600" : trainingPct >= 50 ? "text-amber-600" : "text-cr-red"}`}>
              {trainingPct}%
            </div>
          </div>
        </div>
      </CRCard>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${activeTab === key
                ? "bg-cr-forest text-white"
                : "bg-white border border-gray-200 text-cr-slate hover:text-cr-forest"}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <CRCard>
            <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Personal Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Full name", fullName],
                ["Role", String(fm.role ?? "").replace(/_/g, " ")],
                ["Email", String(fm.email ?? "—")],
                ["Phone", String(fm.phone ?? "—")],
                ["Start date", fm.created_at ? new Date(String(fm.created_at)).toLocaleDateString("en-GB") : "—"],
                ["Contract type", String(fm.contract_type ?? "—")],
                ["Staff ID", String(fm.id ?? "—").slice(0, 8) + "..."],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <dt className="text-cr-slate text-xs mb-0.5">{label as string}</dt>
                  <dd className="font-medium text-cr-charcoal capitalize">{val as string}</dd>
                </div>
              ))}
            </dl>
          </CRCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CRCard>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-cr-forest" />
                <span className="text-sm font-semibold text-cr-charcoal">DBS Status</span>
              </div>
              <p className={`text-sm font-medium ${fm.dbs_expiry ? "text-green-600" : "text-gray-400"}`}>
                {fm.dbs_number ? `Disclosed: ${String(fm.dbs_number).slice(0, 6)}...` : "Not recorded"}
              </p>
              {Boolean(fm.dbs_expiry) && (
                <p className="text-xs text-cr-slate mt-0.5">
                  Expires: {new Date(String(fm.dbs_expiry)).toLocaleDateString("en-GB")}
                </p>
              )}
            </CRCard>
            <CRCard>
              <div className="flex items-center gap-2 mb-1">
                <FileCheck size={16} className="text-cr-forest" />
                <span className="text-sm font-semibold text-cr-charcoal">Documents</span>
              </div>
              <p className="text-2xl font-bold text-cr-charcoal">{uploadedDocs}<span className="text-sm font-normal text-cr-slate">/{totalMandatoryDocs}</span></p>
              <p className="text-xs text-cr-slate">mandatory uploaded</p>
            </CRCard>
            <CRCard>
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className="text-cr-forest" />
                <span className="text-sm font-semibold text-cr-charcoal">Training</span>
              </div>
              <p className={`text-2xl font-bold ${trainingPct >= 80 ? "text-green-600" : trainingPct >= 50 ? "text-amber-600" : "text-cr-red"}`}>
                {trainingPct}%
              </p>
              <p className="text-xs text-cr-slate">{trainingCompleted} of {totalTraining} complete</p>
            </CRCard>
          </div>

          {/* Next supervision due */}
          {supervisions.length > 0 && (
            <CRCard>
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Supervision</h3>
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-cr-forest" />
                <div>
                  <p className="text-sm font-medium text-cr-charcoal">
                    Last: {supervisions[0].completed_date
                      ? new Date(supervisions[0].completed_date).toLocaleDateString("en-GB")
                      : "Not completed yet"}
                  </p>
                  {supervisions[0].next_due_date && (
                    <p className="text-xs text-cr-slate">
                      Next due: {new Date(supervisions[0].next_due_date).toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
              </div>
            </CRCard>
          )}
        </div>
      )}

      {/* ── TAB: Documents ── */}
      {activeTab === "documents" && (
        <div className="space-y-5">
          <CRAlertBanner
            variant="blue"
            title="Document Library"
            description="Upload, verify and track expiry dates for all compliance documents. Red = missing/expired. Amber = expiring within 60 days."
          />

          {Object.entries(DOCUMENT_LIBRARY).map(([catKey, items]) => (
            <CRCard key={catKey}>
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">{CATEGORY_LABELS[catKey]}</h3>
              <div className="space-y-2">
                {items.map(item => {
                  const docKey = item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                  const existing = docMap[docKey];
                  const status = existing?.status ?? "not_uploaded";
                  return (
                    <div key={docKey} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      {docStatusIcon(status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cr-charcoal">{item.label}
                          {item.mandatory && <span className="ml-1.5 text-[10px] text-cr-red font-semibold">REQUIRED</span>}
                        </p>
                        {existing?.expiry_date && (
                          <p className="text-xs text-cr-slate">
                            Expires: {new Date(existing.expiry_date).toLocaleDateString("en-GB")}
                          </p>
                        )}
                        {existing?.file_name && (
                          <p className="text-xs text-cr-slate truncate">{existing.file_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {existing?.file_url && (
                          <a href={existing.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cr-forest hover:underline">View</a>
                        )}
                        {isManager && (
                          <label className="cursor-pointer">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="sr-only"
                              disabled={uploading === docKey}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(docKey, item.category, item.label, f);
                              }} />
                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium
                              ${uploading === docKey
                                ? "bg-gray-100 text-gray-400 border-gray-200"
                                : "bg-white text-cr-forest border-cr-forest/30 hover:bg-cr-mint"}`}>
                              <Upload size={12} />
                              {uploading === docKey ? "Uploading..." : "Upload"}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CRCard>
          ))}
        </div>
      )}

      {/* ── TAB: Training ── */}
      {activeTab === "training" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cr-slate">
                {trainingCompleted} of {totalTraining} modules complete
              </p>
            </div>
            <div className={`text-2xl font-bold ${trainingPct >= 80 ? "text-green-600" : trainingPct >= 50 ? "text-amber-600" : "text-cr-red"}`}>
              {trainingPct}%
            </div>
          </div>

          {(["mandatory_all", "medication", "dom_care", "childrens"] as const).map(catKey => {
            const items = TRAINING_MATRIX.filter(t => t.category === catKey);
            if (!items.length) return null;
            return (
              <CRCard key={catKey}>
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">{CATEGORY_LABELS[catKey]}</h3>
                <div className="space-y-2">
                  {items.map(item => {
                    const existing = trainingMap[item.key];
                    const status = existing?.status ?? "not_started";
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-cr-charcoal">{item.name}</p>
                            {item.mandatory && <span className="text-[10px] text-cr-red font-semibold">MANDATORY</span>}
                          </div>
                          {existing?.completed_date && (
                            <p className="text-xs text-cr-slate">
                              Completed: {new Date(existing.completed_date).toLocaleDateString("en-GB")}
                              {existing.expiry_date && ` · Expires: ${new Date(existing.expiry_date).toLocaleDateString("en-GB")}`}
                            </p>
                          )}
                          {existing?.certificate_number && (
                            <p className="text-xs text-cr-slate">Cert: {existing.certificate_number}</p>
                          )}
                        </div>
                        {trainingStatusBadge(status)}
                        {isManager && status !== "completed" && (
                          <button
                            onClick={() => updateTraining(item.key, item.name, item.category, {
                              status: "completed",
                              completed_date: new Date().toISOString().split("T")[0],
                              expiry_date: item.renewalMonths > 0
                                ? new Date(Date.now() + item.renewalMonths * 30 * 24 * 3600 * 1000)
                                    .toISOString().split("T")[0]
                                : undefined,
                            })}
                            className="text-xs px-2 py-1 rounded-lg border border-cr-forest/30 text-cr-forest hover:bg-cr-mint whitespace-nowrap"
                          >
                            Mark done
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CRCard>
            );
          })}
        </div>
      )}

      {/* ── TAB: Policies ── */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-cr-slate">
              {policies.filter(p => p.acknowledged_at).length} of {policies.length} policies signed
            </p>
            {policies.filter(p => !p.acknowledged_at).length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-full">
                {policies.filter(p => !p.acknowledged_at).length} awaiting signature
              </span>
            )}
          </div>

          {policies.length === 0 ? (
            <CRCard>
              <div className="text-center py-8">
                <Shield className="mx-auto mb-2 text-cr-slate opacity-40" size={32} />
                <p className="text-sm text-cr-slate">No policies assigned yet</p>
                <p className="text-xs text-cr-slate mt-1">Policies are assigned and sent to staff for acknowledgement</p>
              </div>
            </CRCard>
          ) : (
            <div className="space-y-3">
              {/* Unsigned */}
              {policies.filter(p => !p.acknowledged_at).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-cr-charcoal mb-2">Awaiting signature</p>
                  {policies.filter(p => !p.acknowledged_at).map(p => (
                    <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-cr-charcoal">{p.policy_name}</p>
                          {p.policy_version && <p className="text-xs text-cr-slate">Version {p.policy_version}</p>}
                          {p.is_new && (
                            <span className="text-[10px] bg-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">UPDATED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.policy_url && (
                            <a href={p.policy_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-cr-forest hover:underline">View</a>
                          )}
                          <span className="text-[10px] bg-red-100 text-cr-red font-semibold px-2 py-0.5 rounded-full">Unsigned</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Signed */}
              {policies.filter(p => p.acknowledged_at).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-cr-charcoal mb-2">Signed policies</p>
                  {policies.filter(p => p.acknowledged_at).map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 mb-2">
                      <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cr-charcoal font-medium">{p.policy_name}</p>
                        {p.acknowledged_at && (
                          <p className="text-xs text-cr-slate">
                            Signed: {new Date(p.acknowledged_at).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>
                      {p.policy_url && (
                        <a href={p.policy_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-cr-forest hover:underline flex-shrink-0">View</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Supervision ── */}
      {activeTab === "supervision" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {isManager && (
              <a href={`/staff/supervisions/new?staff_id=${String(fm.id)}`}
                className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
                <Plus size={16} /> Log Supervision
              </a>
            )}
          </div>

          {supervisions.length === 0 ? (
            <CRCard>
              <div className="text-center py-8">
                <BookOpen className="mx-auto mb-2 text-cr-slate opacity-40" size={32} />
                <p className="text-sm text-cr-slate">No supervision records yet</p>
              </div>
            </CRCard>
          ) : (
            <div className="space-y-3">
              {supervisions.map(s => (
                <CRCard key={s.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-cr-charcoal text-sm capitalize">
                          {s.supervision_type.replace(/_/g, " ")}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                          ${s.status === "completed" ? "bg-green-100 text-green-700"
                          : s.status === "missed" ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"}`}>
                          {s.status}
                        </span>
                      </div>
                      {s.supervisor && (
                        <p className="text-xs text-cr-slate">
                          Supervisor: {(s.supervisor as { first_name: string; last_name: string }).first_name} {(s.supervisor as { first_name: string; last_name: string }).last_name}
                        </p>
                      )}
                      {s.completed_date && (
                        <p className="text-xs text-cr-slate">
                          Completed: {new Date(s.completed_date).toLocaleDateString("en-GB")}
                          {s.duration_minutes && ` · ${s.duration_minutes} mins`}
                        </p>
                      )}
                      {s.next_due_date && (
                        <p className="text-xs text-cr-slate">Next due: {new Date(s.next_due_date).toLocaleDateString("en-GB")}</p>
                      )}
                      {s.notes && <p className="text-xs text-cr-slate mt-1 line-clamp-2">{s.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.scheduled_date && (
                        <p className="text-xs text-cr-slate">
                          {new Date(s.scheduled_date).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>
                  </div>
                  {Array.isArray(s.action_points) && s.action_points.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-cr-charcoal mb-1">Action points:</p>
                      <ul className="space-y-0.5">
                        {(s.action_points as string[]).map((ap, i) => (
                          <li key={i} className="text-xs text-cr-slate flex items-start gap-1">
                            <span className="text-cr-forest mt-0.5">•</span> {ap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CRCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Incidents ── */}
      {activeTab === "incidents" && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <CRCard>
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto mb-2 text-cr-slate opacity-40" size={32} />
                <p className="text-sm text-cr-slate">No incidents reported</p>
              </div>
            </CRCard>
          ) : incidents.map(inc => (
            <CRCard key={inc.id} hover>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm text-cr-charcoal">{inc.title}</p>
                  <p className="text-xs text-cr-slate">{new Date(inc.created_at).toLocaleDateString("en-GB")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${inc.severity === "serious" || inc.severity === "critical" ? "bg-red-100 text-red-700"
                    : inc.severity === "significant" ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"}`}>
                    {inc.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
            </CRCard>
          ))}
        </div>
      )}

      {/* ── TAB: Payroll ── */}
      {activeTab === "payroll" && (
        <CRCard>
          <div className="text-center py-8">
            <Banknote className="mx-auto mb-2 text-cr-slate opacity-40" size={32} />
            <p className="font-medium text-cr-charcoal">Payroll module</p>
            <p className="text-sm text-cr-slate mt-1">Hours, mileage, holiday entitlement and Bradford Factor tracker are managed in the Payroll section</p>
            <a href="/payroll" className="cr-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm mt-4">
              Go to Payroll
            </a>
          </div>
        </CRCard>
      )}
    </div>
  );
}
