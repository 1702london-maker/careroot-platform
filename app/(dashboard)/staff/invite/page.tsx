"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function StaffInvitePage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "carer",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send invite.");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-cr-charcoal focus:outline-none focus:ring-2 focus:ring-cr-forest focus:border-transparent bg-white";
  const labelClass = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/staff" className="text-cr-slate hover:text-cr-charcoal transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cr-charcoal">Invite Staff Member</h1>
          <p className="text-sm font-body text-cr-slate">Send an invitation email to a new team member</p>
        </div>
      </div>

      <CRCard>
        {success ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Invitation Sent!</h2>
            <p className="text-sm font-body text-cr-slate mb-6">
              An invitation email has been sent to <strong>{form.email}</strong>. They will receive a link to set up their account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setSuccess(false); setForm({ first_name: "", last_name: "", email: "", role: "carer" }); }}
                className="cr-btn-primary px-4 py-2 text-sm"
              >
                Invite Another
              </button>
              <Link href="/staff" className="px-4 py-2 text-sm font-body font-medium text-cr-charcoal border border-gray-200 rounded-lg hover:bg-cr-mint transition-colors">
                Back to Staff
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-cr-red font-body">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name <span className="text-cr-red">*</span></label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Last Name <span className="text-cr-red">*</span></label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email Address <span className="text-cr-red">*</span></label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane.smith@example.com"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Role <span className="text-cr-red">*</span></label>
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              >
                <option value="carer">Carer</option>
                <option value="coordinator">Coordinator</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 cr-btn-primary py-2.5 text-sm font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending Invite…" : "Send Invitation"}
              </button>
              <Link
                href="/staff"
                className="px-4 py-2.5 text-sm font-body font-medium text-cr-charcoal border border-gray-200 rounded-lg hover:bg-cr-mint transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </CRCard>
    </div>
  );
}
