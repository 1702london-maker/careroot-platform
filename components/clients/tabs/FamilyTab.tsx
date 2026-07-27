"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Users, Phone, Mail, Shield, Eye, EyeOff, Copy, CheckCircle, Loader2 } from "lucide-react";

type FamilyMember = {
  id: string;
  user_id: string;
  relationship: string;
  access_level: string;
  is_primary_contact: boolean;
  emergency_contact: boolean;
  can_view_care_plan: boolean;
  can_view_medications: boolean;
  can_view_visit_notes: boolean;
  can_view_incidents: boolean;
  is_active: boolean;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
};

interface Props {
  client: Record<string, unknown>;
  familyAccess: FamilyMember[];
}

const ACCESS_LEVEL_LABEL: Record<string, string> = {
  full: "Full Access",
  read_only: "Read Only",
  emergency_only: "Emergency Only",
  limited: "Limited",
};

const ACCESS_VARIANT: Record<string, "green" | "amber" | "slate" | "blue"> = {
  full: "green",
  read_only: "blue",
  emergency_only: "amber",
  limited: "slate",
};

const PERMISSION_FIELDS: { key: keyof FamilyMember; label: string }[] = [
  { key: "can_view_care_plan", label: "Care Plan" },
  { key: "can_view_medications", label: "Medications" },
  { key: "can_view_visit_notes", label: "Visit Notes" },
  { key: "can_view_incidents", label: "Incidents" },
];

export function ClientFamilyTab({ client, familyAccess }: Props) {
  const supabase = createClient();
  const [members, setMembers] = useState<FamilyMember[]>(familyAccess);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [clientInvite, setClientInvite] = useState({
    email: String(client.email ?? ""),
    first_name: String(client.first_name ?? ""),
    last_name: String(client.last_name ?? ""),
    access_level: "full",
  });
  const [clientInviteStatus, setClientInviteStatus] = useState("");
  const [clientInviteError, setClientInviteError] = useState("");
  const [clientInviteLoading, setClientInviteLoading] = useState(false);

  const portalLink = typeof window !== "undefined"
    ? `${window.location.origin}/family/${String(client.emergency_token)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = async (memberId: string, field: keyof FamilyMember, current: boolean) => {
    setSaving(memberId);
    await supabase
      .from("family_access")
      .update({ [field]: !current })
      .eq("id", memberId);
    setMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, [field]: !current } : m)
    );
    setSaving(null);
  };

  const toggleActive = async (memberId: string, current: boolean) => {
    setSaving(memberId);
    await supabase
      .from("family_access")
      .update({ is_active: !current })
      .eq("id", memberId);
    setMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, is_active: !current } : m)
    );
    setSaving(null);
  };

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  const sendClientInvite = async () => {
    setClientInviteLoading(true);
    setClientInviteStatus("");
    setClientInviteError("");
    const res = await fetch("/api/client/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: client.id, ...clientInvite }),
    });
    const data = await res.json().catch(() => ({}));
    setClientInviteLoading(false);
    if (!res.ok) {
      setClientInviteError(data.error ?? "Could not send client portal invite");
      return;
    }
    setClientInviteStatus("Client portal access created and invite email sent.");
  };

  return (
    <div className="space-y-5">
      <CRCard>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-cr-charcoal text-sm mb-0.5">Client Portal Access</h3>
            <p className="text-xs text-cr-slate">Create a secure login so the client can view visits, care plan, medication, rights, SARs, consent and team details.</p>
          </div>
          <CRBadge variant="blue" size="sm">Client</CRBadge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={clientInvite.first_name} onChange={(e) => setClientInvite({ ...clientInvite, first_name: e.target.value })} placeholder="First name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body" />
          <input value={clientInvite.last_name} onChange={(e) => setClientInvite({ ...clientInvite, last_name: e.target.value })} placeholder="Last name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body" />
          <input value={clientInvite.email} onChange={(e) => setClientInvite({ ...clientInvite, email: e.target.value })} placeholder="Client email" type="email" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body" />
          <select value={clientInvite.access_level} onChange={(e) => setClientInvite({ ...clientInvite, access_level: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body bg-white">
            <option value="full">Full access</option>
            <option value="standard">Standard</option>
            <option value="limited">Limited</option>
          </select>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={sendClientInvite} disabled={clientInviteLoading || !clientInvite.email} className="inline-flex items-center gap-2 bg-cr-forest text-white rounded-lg px-4 py-2 text-sm font-body font-semibold disabled:opacity-60">
            {clientInviteLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Send client portal invite
          </button>
          {clientInviteStatus && <p className="text-xs text-green-700">{clientInviteStatus}</p>}
          {clientInviteError && <p className="text-xs text-cr-red">{clientInviteError}</p>}
        </div>
      </CRCard>

      {/* Family portal link */}
      {Boolean(client.emergency_token) && (
        <CRCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-cr-charcoal text-sm mb-0.5">Family Portal Link</h3>
              <p className="text-xs text-cr-slate">Share this link with authorised family members to access the family portal.</p>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-cr-forest text-cr-forest hover:bg-cr-mint transition-colors flex-shrink-0"
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </CRCard>
      )}

      {/* Active family members */}
      {activeMembers.length === 0 ? (
        <CRCard>
          <div className="text-center py-8">
            <Users className="mx-auto mb-2 text-cr-slate opacity-30" size={32} />
            <p className="text-sm font-medium text-cr-charcoal">No family members added</p>
            <p className="text-xs text-cr-slate mt-1">Family members are added during client onboarding</p>
          </div>
        </CRCard>
      ) : (
        activeMembers.map(member => {
          const u = member.users;
          return (
            <CRCard key={member.id}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-cr-charcoal text-sm">
                      {u?.first_name} {u?.last_name}
                    </p>
                    {member.is_primary_contact && (
                      <span className="text-[10px] bg-cr-forest text-white font-semibold px-1.5 py-0.5 rounded-full">Primary</span>
                    )}
                    {member.emergency_contact && (
                      <span title="Emergency contact"><Shield size={12} className="text-cr-red" /></span>
                    )}
                  </div>
                  <p className="text-xs text-cr-slate capitalize">{member.relationship?.replace("_", " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CRBadge variant={ACCESS_VARIANT[member.access_level] ?? "slate"} size="sm">
                    {ACCESS_LEVEL_LABEL[member.access_level] ?? member.access_level}
                  </CRBadge>
                  <button
                    onClick={() => toggleActive(member.id, member.is_active)}
                    disabled={saving === member.id}
                    className="text-xs text-cr-slate hover:text-cr-red transition-colors"
                    title="Revoke access"
                  >
                    <EyeOff size={14} />
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap gap-3 mb-4">
                {u?.email && (
                  <a href={`mailto:${u.email}`} className="flex items-center gap-1 text-xs text-cr-slate hover:text-cr-forest transition-colors">
                    <Mail size={12} /> {u.email}
                  </a>
                )}
                {u?.phone && (
                  <a href={`tel:${u.phone}`} className="flex items-center gap-1 text-xs text-cr-slate hover:text-cr-forest transition-colors">
                    <Phone size={12} /> {u.phone}
                  </a>
                )}
              </div>

              {/* Permissions */}
              <div>
                <p className="text-xs font-semibold text-cr-charcoal mb-2">Portal Access</p>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_FIELDS.map(({ key, label }) => {
                    const val = member[key] as boolean;
                    return (
                      <button
                        key={key}
                        onClick={() => togglePermission(member.id, key, val)}
                        disabled={saving === member.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left
                          ${val
                            ? "bg-cr-mint border-cr-forest/20 text-cr-forest"
                            : "bg-gray-50 border-gray-200 text-cr-slate"
                          }`}
                      >
                        {val ? <Eye size={12} /> : <EyeOff size={12} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CRCard>
          );
        })
      )}

      {/* Inactive/revoked */}
      {inactiveMembers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-cr-slate mb-2">Revoked Access</p>
          {inactiveMembers.map(member => {
            const u = member.users;
            return (
              <div key={member.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 mb-2 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cr-charcoal">{u?.first_name} {u?.last_name}</p>
                  <p className="text-xs text-cr-slate capitalize">{member.relationship?.replace("_", " ")} · Access revoked</p>
                </div>
                <button
                  onClick={() => toggleActive(member.id, member.is_active)}
                  disabled={saving === member.id}
                  className="text-xs text-cr-forest hover:underline"
                >
                  Restore
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
