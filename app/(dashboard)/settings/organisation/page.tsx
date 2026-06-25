"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import {
  Building2, MapPin, Phone, Mail, Hash,
  Save, Loader2, CheckCircle, AlertTriangle,
  Globe, Users, CreditCard, Pencil
} from "lucide-react";

const PLAN_DETAILS: Record<string, { name: string; limit: string; price: string; colorCls: string }> = {
  seed:       { name: "Seed",       limit: "Up to 10 staff",  price: "£99/mo",  colorCls: "bg-gray-100 text-cr-slate" },
  grow:       { name: "Grow",       limit: "Up to 50 staff",  price: "£349/mo", colorCls: "bg-cr-mint text-cr-forest" },
  scale:      { name: "Scale",      limit: "Up to 200 staff", price: "£899/mo", colorCls: "bg-cr-mint text-cr-forest" },
  enterprise: { name: "Enterprise", limit: "Unlimited staff", price: "Custom",  colorCls: "bg-cr-gold/10 text-cr-gold" },
};

const ORG_TYPES = [
  { value: "domiciliary",     label: "Domiciliary Care" },
  { value: "supported_living",label: "Supported Living" },
  { value: "residential",     label: "Residential Care" },
  { value: "internal",        label: "Internal / NHS" },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest focus:ring-1 focus:ring-cr-forest/20 bg-white";
const labelCls = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

export default function OrganisationSettingsPage() {
  const supabase = createClient();
  const [org, setOrg] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ur } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!ur?.organisation_id) return;
      const { data: orgData } = await supabase.from("organisations").select("*").eq("id", ur.organisation_id).single();
      if (orgData) setOrg(orgData as Record<string, string>);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("organisations").update({
      name:            org.name,
      type:            org.type,
      cqc_provider_id: org.cqc_provider_id,
      ofsted_id:       org.ofsted_id,
      email:           org.email,
      phone:           org.phone,
      on_call_phone:   org.on_call_phone,
      updated_at:      new Date().toISOString(),
    }).eq("id", org.id);
    if (err) { setError(err.message); }
    else { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const plan = PLAN_DETAILS[org.plan ?? "seed"] ?? PLAN_DETAILS.seed;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-cr-slate" />
      </div>
    );
  }

  return (
    <div>
      <CRPageHeader
        title="Organisation Settings"
        subtitle="Manage your organisation profile, CQC details and plan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings", href: "/settings" }]}
        action={
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="text-sm font-body font-medium text-cr-slate px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-4 py-2 rounded-btn hover:bg-cr-sage transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save changes
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest px-4 py-2 rounded-btn hover:bg-cr-mint transition-colors">
              <Pencil size={14} />
              Edit
            </button>
          )
        }
      />

      {saved && (
        <div className="flex items-center gap-2 bg-cr-mint border border-cr-forest/20 text-cr-forest text-sm font-body px-4 py-3 rounded-card mb-6">
          <CheckCircle size={16} /> Changes saved successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-cr-red text-sm font-body px-4 py-3 rounded-card mb-6">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main details */}
        <div className="lg:col-span-2 space-y-6">

          <CRCard>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-cr-mint rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-cr-forest" />
              </div>
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">Organisation Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Organisation Name</label>
                {editing
                  ? <input value={org.name ?? ""} onChange={e => setOrg({ ...org, name: e.target.value })} className={inputCls} placeholder="Your care company name" />
                  : <p className="text-sm font-body text-cr-charcoal py-2">{org.name ?? "—"}</p>}
              </div>
              <div>
                <label className={labelCls}>Organisation Type</label>
                {editing
                  ? <select value={org.type ?? ""} onChange={e => setOrg({ ...org, type: e.target.value })} className={inputCls}>
                      {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  : <p className="text-sm font-body text-cr-charcoal py-2">{ORG_TYPES.find(t => t.value === org.type)?.label ?? "—"}</p>}
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                {editing
                  ? <input type="email" value={org.email ?? ""} onChange={e => setOrg({ ...org, email: e.target.value })} className={inputCls} placeholder="admin@yourcompany.co.uk" />
                  : <p className="text-sm font-body text-cr-charcoal py-2">{org.email ?? "—"}</p>}
              </div>
              <div>
                <label className={labelCls}>Main Phone</label>
                {editing
                  ? <input value={org.phone ?? ""} onChange={e => setOrg({ ...org, phone: e.target.value })} className={inputCls} placeholder="020 1234 5678" />
                  : <p className="text-sm font-body text-cr-charcoal py-2">{org.phone ?? "—"}</p>}
              </div>
              <div>
                <label className={labelCls}>On-Call Number</label>
                {editing
                  ? <input value={org.on_call_phone ?? ""} onChange={e => setOrg({ ...org, on_call_phone: e.target.value })} className={inputCls} placeholder="07700 000000" />
                  : <p className="text-sm font-body text-cr-charcoal py-2">{org.on_call_phone ?? "—"}</p>}
              </div>
            </div>
          </CRCard>

          <CRCard>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-cr-mint rounded-lg flex items-center justify-center">
                <Hash size={16} className="text-cr-forest" />
              </div>
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">Regulatory Identifiers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>CQC Provider ID</label>
                {editing
                  ? <input value={org.cqc_provider_id ?? ""} onChange={e => setOrg({ ...org, cqc_provider_id: e.target.value })} className={inputCls} placeholder="1-XXXXXXXXX" />
                  : <p className="text-sm font-body text-cr-charcoal py-2 font-mono">{org.cqc_provider_id ?? "—"}</p>}
                <p className="text-xs font-body text-cr-slate mt-1">Found on your CQC registration certificate</p>
              </div>
              <div>
                <label className={labelCls}>Ofsted ID</label>
                {editing
                  ? <input value={org.ofsted_id ?? ""} onChange={e => setOrg({ ...org, ofsted_id: e.target.value })} className={inputCls} placeholder="EY123456" />
                  : <p className="text-sm font-body text-cr-charcoal py-2 font-mono">{org.ofsted_id ?? "—"}</p>}
                <p className="text-xs font-body text-cr-slate mt-1">Only required for services supporting under 18s</p>
              </div>
            </div>
          </CRCard>
        </div>

        {/* Right — plan + quick info */}
        <div className="space-y-6">
          <CRCard>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-cr-mint rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-cr-forest" />
              </div>
              <h2 className="font-display text-base font-semibold text-cr-charcoal">Current Plan</h2>
            </div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-body font-semibold mb-3 ${plan.colorCls}`}>
              {plan.name}
            </span>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-cr-slate">Price</span>
                <span className="font-semibold text-cr-charcoal">{plan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cr-slate">Staff limit</span>
                <span className="font-semibold text-cr-charcoal">{plan.limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cr-slate">Trial ends</span>
                <span className="font-semibold text-cr-charcoal">
                  {org.trial_ends_at ? new Date(org.trial_ends_at).toLocaleDateString("en-GB") : "Active"}
                </span>
              </div>
            </div>
            <a href="/api/stripe/portal"
              className="mt-4 block w-full text-center text-sm font-body font-semibold border border-cr-forest text-cr-forest py-2 rounded-btn hover:bg-cr-mint transition-colors">
              Manage billing
            </a>
          </CRCard>

          <CRCard>
            <h2 className="font-display text-base font-semibold text-cr-charcoal mb-4">Quick Info</h2>
            <div className="space-y-3 text-sm font-body">
              {[
                { icon: Users,   label: "Plan status", value: org.plan_status ?? "trial" },
                { icon: Globe,   label: "Plan tier",   value: org.plan ?? "seed" },
                { icon: Phone,   label: "On-call",     value: org.on_call_phone ?? "Not set" },
                { icon: Mail,    label: "Email",       value: org.email ?? "Not set" },
                { icon: MapPin,  label: "Address",     value: org.address ? "Set" : "Not set" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-cr-slate">
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                  <span className="text-cr-charcoal font-medium truncate max-w-[130px] text-right capitalize">{value}</span>
                </div>
              ))}
            </div>
          </CRCard>

          {org.plan_status === "trial" && (
            <div className="bg-cr-gold/10 border border-cr-gold/30 rounded-card p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-cr-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal">Free trial active</p>
                  <p className="text-xs font-body text-cr-slate mt-0.5">Upgrade before your trial ends to keep all data.</p>
                  <a href="/pricing" className="inline-block mt-2 text-xs font-body font-semibold text-cr-forest hover:text-cr-sage transition-colors">
                    View plans →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
