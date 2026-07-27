"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import {
  UserPlus, Loader2, Trash2, Mail, Heart,
  CheckCircle, AlertTriangle, Phone, User2, RefreshCw
} from "lucide-react";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest focus:ring-1 focus:ring-cr-forest/20 bg-white";
const labelCls = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

const ACCESS_LEVELS = [
  { value: "full", label: "Full access", desc: "Can view visits, notes, update care info, raise complaints, request SAR" },
  { value: "standard", label: "Standard", desc: "Can view visits and notes, raise complaints" },
  { value: "limited", label: "Limited", desc: "Visit dates and status only" },
];

const RELATIONSHIPS = ["Son", "Daughter", "Spouse/Partner", "Parent", "Sibling", "Grandchild", "Friend", "Legal Guardian", "Power of Attorney", "Other"];

interface FamilyRow {
  id: string;
  user_id: string;
  client_id: string;
  relationship: string;
  access_level: string;
  is_active: boolean;
  created_at: string;
  users: { first_name: string; last_name: string; email: string; phone?: string } | null;
  clients: { first_name: string; last_name: string } | null;
}

export default function FamilyAdminPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");
  const [addError, setAddError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    relationship: "Son", client_id: "", access_level: "full",
  });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ur } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
    if (!ur?.organisation_id) return;
    setOrgId(ur.organisation_id);

    const [{ data: familyData }, { data: clientData }] = await Promise.all([
      supabase.from("family_access")
        .select("id, user_id, client_id, relationship, access_level, is_active, created_at")
        .eq("organisation_id", ur.organisation_id)
        .order("created_at", { ascending: false }),
      supabase.from("clients")
        .select("id, first_name, last_name")
        .eq("organisation_id", ur.organisation_id)
        .eq("status", "active")
        .order("first_name"),
    ]);

    const accessRows = familyData ?? [];
    const userIds = Array.from(new Set(accessRows.map((row) => row.user_id).filter(Boolean)));
    const clientIds = Array.from(new Set(accessRows.map((row) => row.client_id).filter(Boolean)));

    const [{ data: familyUsers }, { data: familyClients }] = await Promise.all([
      userIds.length
        ? supabase.from("users").select("id, first_name, last_name, email, phone").in("id", userIds)
        : Promise.resolve({ data: [] }),
      clientIds.length
        ? supabase.from("clients").select("id, first_name, last_name").in("id", clientIds)
        : Promise.resolve({ data: [] }),
    ]);

    const userMap = new Map((familyUsers ?? []).map((row) => [row.id, row]));
    const clientMap = new Map((familyClients ?? []).map((row) => [row.id, row]));
    setRows(accessRows.map((row) => ({
      ...row,
      users: userMap.get(row.user_id) ?? null,
      clients: clientMap.get(row.client_id) ?? null,
    })) as FamilyRow[]);
    setClients(clientData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!form.email || !form.first_name || !form.client_id) {
      setAddError("First name, email and client are required.");
      return;
    }
    setAdding(true); setAddError(""); setAddSuccess("");

    // Invite via staff invite API (role=family)
    const res = await fetch("/api/family/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, phone: form.phone,
        relationship: form.relationship, client_id: form.client_id,
        access_level: form.access_level, organisation_id: orgId,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAddError(result.error ?? "Failed to send invite");
    } else {
      setAddSuccess(`Invite sent to ${form.email}`);
      setForm({ first_name: "", last_name: "", email: "", phone: "", relationship: "Son", client_id: "", access_level: "full" });
      setShowAdd(false);
      load();
    }
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this family member's access?")) return;
    setRemoving(id);
    await supabase.from("family_access").update({ is_active: false }).eq("id", id);
    setRows(r => r.map(x => x.id === id ? { ...x, is_active: false } : x));
    setRemoving(null);
  };

  const active = rows.filter(r => r.is_active);
  const inactive = rows.filter(r => !r.is_active);

  return (
    <div>
      <CRPageHeader
        title="Family Access"
        subtitle="Add and manage family members linked to service users"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <button
            onClick={() => { setShowAdd(true); setAddError(""); }}
            className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-4 py-2 rounded-btn hover:bg-cr-sage transition-colors"
          >
            <UserPlus size={14} /> Add family member
          </button>
        }
      />

      {/* Add panel */}
      {showAdd && (
        <CRCard className="mb-6 border-cr-forest/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-semibold text-cr-charcoal">Add family member</h2>
            <button onClick={() => setShowAdd(false)} className="text-cr-slate hover:text-cr-charcoal text-sm font-body">Cancel</button>
          </div>
          {addError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-cr-red text-sm font-body px-3 py-2 rounded-lg mb-4">
              <AlertTriangle size={14} /> {addError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First name *</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className={inputCls} placeholder="e.g. Sarah" />
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className={inputCls} placeholder="e.g. Johnson" />
            </div>
            <div>
              <label className={labelCls}>Email address *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="sarah@example.com" />
            </div>
            <div>
              <label className={labelCls}>Telephone number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+44 7700 000000" />
            </div>
            <div>
              <label className={labelCls}>Relationship to service user</label>
              <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} className={inputCls}>
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Service user (client) *</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputCls}>
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Access level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ACCESS_LEVELS.map(a => (
                  <label key={a.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.access_level === a.value ? "border-cr-forest bg-cr-mint" : "border-gray-200 hover:border-cr-forest/40"}`}>
                    <input type="radio" name="access_level" value={a.value} checked={form.access_level === a.value} onChange={e => setForm({ ...form, access_level: e.target.value })} className="mt-0.5 accent-cr-forest" />
                    <div>
                      <p className="text-sm font-body font-semibold text-cr-charcoal">{a.label}</p>
                      <p className="text-xs font-body text-cr-slate leading-relaxed">{a.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={adding || !form.email || !form.first_name || !form.client_id}
              className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-5 py-2 rounded-btn hover:bg-cr-sage transition-colors disabled:opacity-60"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Send invite & grant access
            </button>
          </div>
        </CRCard>
      )}

      {addSuccess && (
        <div className="flex items-center gap-2 bg-cr-mint border border-cr-forest/20 text-cr-forest text-sm font-body px-4 py-3 rounded-card mb-6">
          <CheckCircle size={16} /> {addSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-cr-slate" /></div>
      ) : (
        <div className="space-y-6">
          <CRCard noPadding>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal">
                Active family members <span className="text-cr-slate font-body text-sm font-normal ml-1">({active.length})</span>
              </h2>
              <button onClick={load} className="text-cr-slate hover:text-cr-forest transition-colors"><RefreshCw size={14} /></button>
            </div>
            <div className="divide-y divide-gray-50">
              {active.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart size={32} className="mx-auto text-cr-slate opacity-30 mb-2" />
                  <p className="text-sm font-body text-cr-slate">No family members added yet</p>
                </div>
              ) : active.map(row => (
                <div key={row.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-cr-mint flex items-center justify-center flex-shrink-0">
                    <User2 size={16} className="text-cr-forest" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-body font-semibold text-cr-charcoal">
                        {row.users?.first_name} {row.users?.last_name}
                      </p>
                      <CRBadge variant="slate" size="sm">{row.relationship}</CRBadge>
                      <CRBadge variant={row.access_level === "full" ? "forest" : row.access_level === "standard" ? "blue" : "amber"} size="sm">
                        {row.access_level}
                      </CRBadge>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <p className="text-xs font-body text-cr-slate flex items-center gap-1">
                        <Mail size={10} /> {row.users?.email}
                      </p>
                      {row.users?.phone && (
                        <p className="text-xs font-body text-cr-slate flex items-center gap-1">
                          <Phone size={10} /> {row.users.phone}
                        </p>
                      )}
                    </div>
                    <p className="text-xs font-body text-cr-forest mt-0.5">
                      Linked to: {row.clients?.first_name} {row.clients?.last_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(row.id)}
                    disabled={removing === row.id}
                    className="p-1.5 rounded-lg text-cr-slate hover:text-cr-red hover:bg-red-50 transition-colors"
                  >
                    {removing === row.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </CRCard>

          {inactive.length > 0 && (
            <CRCard noPadding>
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-display text-sm font-semibold text-cr-charcoal text-opacity-60">
                  Deactivated ({inactive.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {inactive.map(row => (
                  <div key={row.id} className="flex items-center gap-4 px-5 py-3.5 opacity-50">
                    <div className="flex-1">
                      <p className="text-sm font-body font-medium text-cr-charcoal line-through">{row.users?.first_name} {row.users?.last_name}</p>
                      <p className="text-xs font-body text-cr-slate">{row.users?.email} · {row.clients?.first_name} {row.clients?.last_name}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from("family_access").update({ is_active: true }).eq("id", row.id);
                        load();
                      }}
                      className="text-xs font-body font-semibold text-cr-forest border border-cr-forest px-3 py-1 rounded-btn hover:bg-cr-mint transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </CRCard>
          )}
        </div>
      )}
    </div>
  );
}
