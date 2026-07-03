"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, FileText, Award, BookOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";

type Document = { id: string; document_label: string; document_category: string; status: string; file_url?: string; expiry_date?: string; file_name?: string };
type Training = { id: string; training_name: string; training_category: string; status: string; completed_date?: string; expiry_date?: string };
type Policy = { id: string; policy_key: string; policy_name: string; policy_version?: string; acknowledged_at?: string; is_new?: boolean; policy_url?: string };
type User = Record<string, unknown>;

interface Props {
  user: User | null;
  documents: Document[];
  training: Training[];
  policies: Policy[];
}

const TABS = [
  { key: "documents", label: "My Documents", icon: FileText },
  { key: "training", label: "My Training", icon: Award },
  { key: "policies", label: "Policies to Sign", icon: BookOpen },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "verified" || status === "uploaded") return <CheckCircle size={15} className="text-green-500" />;
  if (status === "expiring_soon") return <AlertCircle size={15} className="text-amber-500" />;
  if (status === "expired") return <AlertCircle size={15} className="text-cr-red" />;
  return <XCircle size={15} className="text-gray-300" />;
}

const TRAINING_STATUS_LABEL: Record<string, string> = {
  completed: "Completed", in_progress: "In Progress",
  renewal_due: "Renewal Due", overdue: "Overdue", not_started: "Not Started",
};
const TRAINING_STATUS_CLASS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  renewal_due: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  not_started: "bg-gray-100 text-gray-500",
};

export function CarerMyDocumentsClient({ user, documents, training, policies }: Props) {
  const [activeTab, setActiveTab] = useState("documents");
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const supabase = createClient();

  const unsigned = policies.filter(p => !p.acknowledged_at);
  const signed = policies.filter(p => p.acknowledged_at);

  const handleAcknowledge = async (policyId: string) => {
    setAcknowledging(policyId);
    await supabase.from("policy_acknowledgements").update({
      acknowledged_at: new Date().toISOString(),
      is_new: false,
    }).eq("id", policyId);
    window.location.reload();
  };

  const trainingCompleted = training.filter(t => t.status === "completed").length;
  const docsUploaded = documents.filter(d => ["uploaded", "verified"].includes(d.status)).length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <CRCard className="text-center !p-3">
          <p className="text-2xl font-bold text-cr-charcoal">{docsUploaded}/{documents.length}</p>
          <p className="text-xs text-cr-slate">Documents</p>
        </CRCard>
        <CRCard className="text-center !p-3">
          <p className={`text-2xl font-bold ${trainingCompleted === training.length && training.length > 0 ? "text-green-600" : "text-cr-charcoal"}`}>
            {trainingCompleted}/{training.length}
          </p>
          <p className="text-xs text-cr-slate">Training</p>
        </CRCard>
        <CRCard className="text-center !p-3">
          <p className={`text-2xl font-bold ${unsigned.length > 0 ? "text-cr-red" : "text-green-600"}`}>
            {unsigned.length}
          </p>
          <p className="text-xs text-cr-slate">To sign</p>
        </CRCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors
              ${activeTab === key
                ? "bg-cr-forest text-white"
                : "bg-white border border-gray-200 text-cr-slate"}`}
          >
            <Icon size={13} /> {label}
            {key === "policies" && unsigned.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-cr-red text-white text-[10px] flex items-center justify-center">
                {unsigned.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents tab */}
      {activeTab === "documents" && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <CRCard>
              <div className="text-center py-6">
                <FileText className="mx-auto mb-2 text-cr-slate opacity-40" size={28} />
                <p className="text-sm text-cr-slate">No documents on file yet</p>
                <p className="text-xs text-cr-slate mt-1">Ask your manager to upload your compliance documents</p>
              </div>
            </CRCard>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                <StatusIcon status={doc.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cr-charcoal font-medium truncate">{doc.document_label}</p>
                  {doc.expiry_date && (
                    <p className="text-xs text-cr-slate">Expires: {new Date(doc.expiry_date).toLocaleDateString("en-GB")}</p>
                  )}
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-cr-forest">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Training tab */}
      {activeTab === "training" && (
        <div className="space-y-2">
          {training.length === 0 ? (
            <CRCard>
              <div className="text-center py-6">
                <Award className="mx-auto mb-2 text-cr-slate opacity-40" size={28} />
                <p className="text-sm text-cr-slate">No training records yet</p>
              </div>
            </CRCard>
          ) : (
            training.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cr-charcoal font-medium">{t.training_name}</p>
                  {t.completed_date && (
                    <p className="text-xs text-cr-slate">
                      Completed: {new Date(t.completed_date).toLocaleDateString("en-GB")}
                      {t.expiry_date && ` · Expires: ${new Date(t.expiry_date).toLocaleDateString("en-GB")}`}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TRAINING_STATUS_CLASS[t.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {TRAINING_STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Policies tab */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {unsigned.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-cr-charcoal">Action required</p>
              {unsigned.map(p => (
                <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-cr-charcoal">{p.policy_name}</p>
                      {p.policy_version && <p className="text-xs text-cr-slate">Version {p.policy_version}</p>}
                      {p.is_new && <span className="text-[10px] bg-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">UPDATED</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {p.policy_url && (
                      <a href={p.policy_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-cr-forest hover:underline flex items-center gap-1">
                        <ExternalLink size={11} /> Read policy
                      </a>
                    )}
                    <button
                      onClick={() => handleAcknowledge(p.id)}
                      disabled={acknowledging === p.id}
                      className="ml-auto cr-btn-primary text-xs px-3 py-1.5"
                    >
                      {acknowledging === p.id ? "Saving..." : "I have read and agree"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {signed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-cr-charcoal">Signed policies</p>
              {signed.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cr-charcoal">{p.policy_name}</p>
                    {p.acknowledged_at && (
                      <p className="text-xs text-cr-slate">
                        Signed: {new Date(p.acknowledged_at).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {unsigned.length === 0 && signed.length === 0 && (
            <CRCard>
              <div className="text-center py-6">
                <BookOpen className="mx-auto mb-2 text-cr-slate opacity-40" size={28} />
                <p className="text-sm text-cr-slate">No policies assigned yet</p>
              </div>
            </CRCard>
          )}
        </div>
      )}
    </div>
  );
}
