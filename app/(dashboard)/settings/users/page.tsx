"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import {
  UserPlus, Loader2, Trash2, Mail, ShieldCheck,
  User2, CheckCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import Link from "next/link";

const ROLES = [
  { value: "org_admin", label: "Admin", desc: "Full access to all settings and data" },
  { value: "coordinator", label: "Coordinator", desc: "Manage clients, visits, staff" },
  { value: "carer", label: "Carer", desc: "Access to their assigned visits only" },
  { value: "family", label: "Family", desc: "Read-only family portal access" },
];

const roleBadge = (role: string) => {
  if (role === "org_admin") return <CRBadge variant="forest" size="sm">Admin</CRBadge>;
  if (role === "coordinator") return <CRBadge variant="blue" size="sm">Coordinator</CRBadge>;
  if (role === "carer") return <CRBadge variant="green" size="sm">Carer</CRBadge>;
  return <CRBadge variant="slate" size="sm">Family</CRBadge>;
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest focus:ring-1 focus:ring-cr-forest/20 bg-white";
const labelCls = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export default function TeamUsersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [orgId, setOrgId] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ first_name: "", last_name: "", email: "", role: "carer" });
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [removing, setRemoving] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    const { data: ur } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
    if (!ur?.organisation_id) return;
    setOrgId(ur.organisation_id);
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role, is_active, created_at")
      .eq("organisation_id", ur.organisation_id)
      .order("created_at");
    setMembers((data ?? []) as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const invite = async () => {
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    const res = await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inviteForm, organisation_id: orgId }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteError(result.error || "Failed to send invite");
    } else {
      setInviteSuccess(`Invite sent to ${inviteForm.email}`);
      setInviteForm({ first_name: "", last_name: "", email: "", role: "carer" });
      setShowInvite(false);
      load();
    }
    setInviting(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    setRemoving(id);
    await supabase.from("users").update({ is_active: false }).eq("id", id);
    setMembers(m => m.map(u => u.id === id ? { ...u, is_active: false } : u));
    setRemoving(null);
  };

  const changeRole = async (id: string, role: string) => {
    setUpdatingRole(id);
    await supabase.from("users").update({ role }).eq("id", id);
    setMembers(m => m.map(u => u.id === id ? { ...u, role } : u));
    setUpdatingRole(null);
  };

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <div>
      <CRPageHeader
        title="Team Members"
        subtitle="Manage staff accounts, roles and access"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings", href: "/settings" }]}
        action={
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-4 py-2 rounded-btn hover:bg-cr-sage transition-colors"
          >
            <UserPlus size={14} />
            Invite member
          </button>
        }
      />

      {/* Invite panel */}
      {showInvite && (
        <CRCard className="mb-6 border-cr-forest/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-semibold text-cr-charcoal">Invite a team member</h2>
            <button onClick={() => { setShowInvite(false); setInviteError(""); }} className="text-cr-slate hover:text-cr-charcoal text-sm font-body">Cancel</button>
          </div>
          {inviteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-cr-red text-sm font-body px-3 py-2 rounded-lg mb-4">
              <AlertTriangle size={14} /> {inviteError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First name</label>
              <input value={inviteForm.first_name} onChange={e => setInviteForm({ ...inviteForm, first_name: e.target.value })} className={inputCls} placeholder="Jane" />
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input value={inviteForm.last_name} onChange={e => setInviteForm({ ...inviteForm, last_name: e.target.value })} className={inputCls} placeholder="Smith" />
            </div>
            <div>
              <label className={labelCls}>Email address</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className={inputCls} placeholder="jane@careagency.co.uk" />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })} className={inputCls}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={invite}
              disabled={inviting || !inviteForm.email || !inviteForm.first_name}
              className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-5 py-2 rounded-btn hover:bg-cr-sage transition-colors disabled:opacity-60"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Send invite
            </button>
          </div>
        </CRCard>
      )}

      {inviteSuccess && (
        <div className="flex items-center gap-2 bg-cr-mint border border-cr-forest/20 text-cr-forest text-sm font-body px-4 py-3 rounded-card mb-6">
          <CheckCircle size={16} /> {inviteSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-cr-slate" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Role legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map(r => (
              <div key={r.value} className="bg-white border border-gray-100 rounded-card p-3 shadow-card">
                <div className="mb-1">{roleBadge(r.value)}</div>
                <p className="text-xs font-body text-cr-slate leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Active members */}
          <CRCard noPadding>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal">
                Active members <span className="text-cr-slate font-body text-sm font-normal ml-1">({activeMembers.length})</span>
              </h2>
              <button onClick={load} className="text-cr-slate hover:text-cr-forest transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {activeMembers.length === 0 ? (
                <div className="py-10 text-center">
                  <User2 size={32} className="mx-auto text-cr-slate opacity-30 mb-2" />
                  <p className="text-sm font-body text-cr-slate">No active members yet</p>
                </div>
              ) : (
                activeMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-3.5">
                    <CRAvatar firstName={member.first_name} lastName={member.last_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-body font-medium text-cr-charcoal">
                          {member.first_name} {member.last_name}
                          {member.id === currentUserId && (
                            <span className="ml-1.5 text-xs text-cr-slate">(you)</span>
                          )}
                        </p>
                        {roleBadge(member.role)}
                      </div>
                      <p className="text-xs font-body text-cr-slate mt-0.5">{member.email}</p>
                    </div>
                    {member.id !== currentUserId && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={e => changeRole(member.id, e.target.value)}
                          disabled={updatingRole === member.id}
                          className="text-xs font-body border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-cr-forest"
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button
                          onClick={() => remove(member.id)}
                          disabled={removing === member.id}
                          className="p-1.5 rounded-lg text-cr-slate hover:text-cr-red hover:bg-red-50 transition-colors"
                        >
                          {removing === member.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    )}
                    {member.id === currentUserId && (
                      <ShieldCheck size={16} className="text-cr-forest flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CRCard>

          {/* Inactive / deactivated */}
          {inactiveMembers.length > 0 && (
            <CRCard noPadding>
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-display text-base font-semibold text-cr-charcoal">
                  Deactivated <span className="text-cr-slate font-body text-sm font-normal ml-1">({inactiveMembers.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {inactiveMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 opacity-50">
                    <CRAvatar firstName={member.first_name} lastName={member.last_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-cr-charcoal line-through">{member.first_name} {member.last_name}</p>
                      <p className="text-xs font-body text-cr-slate">{member.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from("users").update({ is_active: true }).eq("id", member.id);
                        load();
                      }}
                      className="text-xs font-body font-semibold text-cr-forest border border-cr-forest px-3 py-1 rounded-btn hover:bg-cr-mint transition-colors"
                    >
                      Reactivate
                    </button>
                  </div>
                ))}
              </div>
            </CRCard>
          )}

          {/* Quick link to full staff page */}
          <p className="text-xs font-body text-cr-slate text-center">
            To set up carer profiles and pay rates, use the{" "}
            <Link href="/staff" className="text-cr-forest hover:text-cr-sage underline underline-offset-2">Staff page</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
