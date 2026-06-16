"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRCard } from "@/components/ui/CRCard";
import { X } from "lucide-react";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  clients: Client[];
  onClose: () => void;
}

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-cr-charcoal focus:outline-none focus:ring-2 focus:ring-cr-forest focus:border-transparent bg-white";
const labelClass = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

export function ComplaintForm({ clients, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    client_id: "",
    category: "care_quality",
    description: "",
    desired_outcome: "",
    incident_date: "",
    is_anonymous: false,
    wants_cqc_escalation: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Please describe the complaint.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <CRCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative !p-0">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal">New Complaint</h2>
            <p className="text-xs font-body text-cr-slate mt-0.5">A reference number will be issued automatically</p>
          </div>
          <button onClick={onClose} className="text-cr-slate hover:text-cr-charcoal transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-cr-red font-body">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Related Client (optional)</label>
            <select
              className={inputClass}
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              <option value="">No specific client / organisation-wide</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Category <span className="text-cr-red">*</span></label>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="care_quality">Care Quality</option>
              <option value="staff_conduct">Staff Conduct</option>
              <option value="missed_visit">Missed Visit</option>
              <option value="communication">Communication</option>
              <option value="medication">Medication</option>
              <option value="food">Food / Nutrition</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-cr-red">*</span></label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={5}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Please describe the complaint in detail…"
            />
          </div>

          <div>
            <label className={labelClass}>Desired Outcome</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.desired_outcome}
              onChange={(e) => setForm({ ...form, desired_outcome: e.target.value })}
              placeholder="What outcome would you like to see?"
            />
          </div>

          <div>
            <label className={labelClass}>Date of Incident</label>
            <input
              type="date"
              className={inputClass}
              value={form.incident_date}
              onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-cr-forest focus:ring-cr-forest"
                checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              />
              <span className="text-sm font-body text-cr-charcoal">Submit anonymously</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-cr-forest focus:ring-cr-forest"
                checked={form.wants_cqc_escalation}
                onChange={(e) => setForm({ ...form, wants_cqc_escalation: e.target.checked })}
              />
              <span className="text-sm font-body text-cr-charcoal">I may wish to escalate to CQC if unresolved</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 cr-btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Submit Complaint"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-body text-cr-charcoal border border-gray-200 rounded-lg hover:bg-cr-mint transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </CRCard>
    </div>
  );
}
