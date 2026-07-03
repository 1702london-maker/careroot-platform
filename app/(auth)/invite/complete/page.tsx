"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";

export default function InviteCompletePage() {
  const router = useRouter();
  const supabase = createClient();
  const [stage, setStage] = useState<"loading" | "set-password" | "done" | "error">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Supabase puts the session in the URL hash after invite link click
    // auth.onAuthStateChange fires with SIGNED_IN when the token is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Get their role to redirect correctly after password set
        const { data: userRecord } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setUserRole(userRecord?.role ?? "carer");
        setStage("set-password");
      } else if (event === "USER_UPDATED") {
        setStage("done");
        const role = userRole || "carer";
        setTimeout(() => {
          router.push(role === "carer" ? "/carer" : "/dashboard");
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, [userRole]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
    }
    // USER_UPDATED event above handles the redirect
  };

  return (
    <div className="min-h-screen bg-cr-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
            <Leaf size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-cr-charcoal">Careroot</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

          {stage === "loading" && (
            <div className="text-center py-6">
              <Loader2 size={36} className="animate-spin text-cr-forest mx-auto mb-3" />
              <p className="text-sm font-body text-cr-slate">Verifying your invite link…</p>
            </div>
          )}

          {stage === "set-password" && (
            <>
              <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-1">Create your password</h1>
              <p className="text-sm font-body text-cr-slate mb-6">Choose a password to secure your Careroot account.</p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-body text-cr-red">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? "Setting password…" : "Set password & continue"}
                </button>
              </form>
            </>
          )}

          {stage === "done" && (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-cr-forest mx-auto mb-3" />
              <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-1">You&apos;re in!</h2>
              <p className="text-sm font-body text-cr-slate">Taking you to your portal…</p>
            </div>
          )}

          {stage === "error" && (
            <div className="text-center py-4">
              <p className="text-sm font-body text-cr-red">This invite link has expired or is invalid. Ask your manager to resend the invitation.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
