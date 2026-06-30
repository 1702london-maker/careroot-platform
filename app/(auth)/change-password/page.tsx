"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, ShieldCheck } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!accepted) { setError("Please accept the Terms of Service and Privacy Policy to continue."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, acceptedTerms: true }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result?.error || "Could not update your password. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cr-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
            <Leaf size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-cr-charcoal">Careroot</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-cr-forest" />
            <h1 className="font-display text-2xl font-semibold text-cr-charcoal">Set your password</h1>
          </div>
          <p className="text-sm font-body text-cr-slate mb-6">
            For security, please replace your temporary password before continuing.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">New password</label>
              <input type="password" required minLength={8} autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Confirm new password</label>
              <input type="password" required minLength={8} autoComplete="new-password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 accent-cr-forest" />
              <span className="text-xs font-body text-cr-slate">
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-cr-forest hover:text-cr-sage underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-cr-forest hover:text-cr-sage underline">Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-cr-red">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60">
              {loading ? "Saving..." : "Set password and continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
