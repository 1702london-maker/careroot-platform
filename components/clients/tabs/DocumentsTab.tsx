"use client";

import { useRef, useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { Upload, FileText, Download, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const DOC_CATEGORIES = [
  { key: "assessment", label: "Assessment Documents" },
  { key: "care_plan", label: "Care Plans" },
  { key: "risk_assessment", label: "Risk Assessments" },
  { key: "consent", label: "Consent Forms" },
  { key: "medical", label: "Medical Records" },
  { key: "correspondence", label: "Correspondence" },
  { key: "legal", label: "Legal & PoA Documents" },
];

type Doc = {
  id: string;
  file_name: string;
  file_url: string;
  category: string;
  uploaded_at: string;
  uploaded_by_name?: string;
};

interface Props {
  client: Record<string, unknown>;
  initialDocs?: Doc[];
}

export function ClientDocumentsTab({ client, initialDocs = [] }: Props) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [activeCategory, setActiveCategory] = useState("assessment");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredDocs = docs.filter((d) => d.category === activeCategory);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.append("client_id", String(client.id));
      payload.append("category", activeCategory);
      payload.append("file", file);

      const res = await fetch("/api/client/documents", {
        method: "POST",
        body: payload,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setDocs((prev) => [data.document, ...prev]);
      setSuccess(`${file.name} uploaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/client/documents/${doc.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setSuccess(`${doc.file_name} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DOC_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-cr-forest text-white"
                : "bg-white border border-gray-200 text-cr-slate hover:text-cr-charcoal"
            }`}
          >
            {cat.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({docs.filter((d) => d.category === cat.key).length})
            </span>
          </button>
        ))}
      </div>

      <CRCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-cr-charcoal text-sm">
            {DOC_CATEGORIES.find((c) => c.key === activeCategory)?.label}
          </h3>
          <label className="cr-btn-primary flex items-center gap-1.5 text-sm cursor-pointer">
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload File"}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <AlertCircle size={14} className="text-cr-red mt-0.5 flex-shrink-0" />
            <p className="text-xs text-cr-red">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}

        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <FileText className="mx-auto mb-2 text-cr-slate opacity-30" size={28} />
            <p className="text-sm text-cr-slate">No documents in this category</p>
            <p className="text-xs text-cr-slate mt-1">Upload a file using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-3">
                <FileText size={16} className="text-cr-forest flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cr-charcoal truncate">{doc.file_name}</p>
                  {doc.uploaded_at && (
                    <p className="text-xs text-cr-slate">
                      {new Date(doc.uploaded_at).toLocaleDateString("en-GB")}
                      {doc.uploaded_by_name && ` - ${doc.uploaded_by_name}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cr-forest hover:text-cr-sage transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="text-cr-slate hover:text-cr-red transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CRCard>

      <p className="text-xs text-cr-slate">
        Accepted formats: PDF, Word, JPEG, PNG, WebP. Max 50MB per file.
      </p>
    </div>
  );
}
