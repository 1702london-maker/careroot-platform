"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type UserRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
} | null;

export function CarerSettingsClient({ user }: { user: UserRecord }) {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false); setSaveError("");
    const { error } = await supabase.from("users").update({ phone }).eq("id", user!.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSaved(false);
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-cr-charcoal">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-body font-semibold text-cr-charcoal mb-4 text-sm">My Profile</h2>
        <div className="mb-4 space-y-1">
          <p className="text-xs text-cr-slate font-body">Name</p>
          <p className="text-sm font-body font-medium text-cr-charcoal">{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="mb-4 space-y-1">
          <p className="text-xs text-cr-slate font-body">Email</p>
          <p className="text-sm font-body text-cr-charcoal">{user?.email}</p>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-body font-medium text-cr-slate mb-1">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+44 7700 000000"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-cr-forest"
            />
          </div>
          {saveError && <p className="text-xs text-red-600 font-body">{saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-body font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-body font-semibold text-cr-charcoal mb-4 text-sm">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-body font-medium text-cr-slate mb-1">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-cr-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-cr-slate mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-cr-forest"
            />
          </div>
          {pwError && <p className="text-xs text-red-600 font-body">{pwError}</p>}
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-body font-medium disabled:opacity-60"
          >
            {pwSaving ? <Loader2 size={14} className="animate-spin" /> : pwSaved ? <CheckCircle2 size={14} /> : null}
            {pwSaving ? "Updating…" : pwSaved ? "Password updated" : "Update password"}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl py-3 font-body font-medium text-sm hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
