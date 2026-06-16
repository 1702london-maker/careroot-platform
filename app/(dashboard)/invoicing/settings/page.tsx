"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { RateCard } from "@/types";

const TABS = ["Rate Cards", "Client Billing", "Invoice Settings"];
const FUNDER_TYPES = [
  { value: "private", label: "Private" },
  { value: "local_authority", label: "Local Authority" },
  { value: "nhs", label: "NHS" },
  { value: "mixed", label: "Mixed" },
];

export default function InvoicingSettingsPage() {
  const [tab, setTab] = useState(0);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [orgId, setOrgId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", funder_type: "private", hourly_rate: "", visit_rate: "", overnight_rate: "", travel_rate_per_mile: "", is_default: false });
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("organisation_id").eq("id", user.id).single().then(({ data }) => {
        setOrgId(data?.organisation_id ?? "");
        loadRateCards(data?.organisation_id ?? "");
      });
    });
  }, []);

  const loadRateCards = async (oid: string) => {
    const { data } = await supabase.from("rate_cards").select("*").eq("organisation_id", oid).order("created_at");
    setRateCards((data as RateCard[]) ?? []);
  };

  const saveRateCard = async () => {
    setSaving(true);
    await supabase.from("rate_cards").insert({ ...form, organisation_id: orgId, hourly_rate: parseFloat(form.hourly_rate) || null, visit_rate: parseFloat(form.visit_rate) || null, overnight_rate: parseFloat(form.overnight_rate) || null, travel_rate_per_mile: parseFloat(form.travel_rate_per_mile) || null });
    await loadRateCards(orgId);
    setShowForm(false);
    setForm({ name: "", funder_type: "private", hourly_rate: "", visit_rate: "", overnight_rate: "", travel_rate_per_mile: "", is_default: false });
    setSaving(false);
  };

  const deleteRateCard = async (id: string) => {
    await supabase.from("rate_cards").delete().eq("id", id);
    setRateCards(rateCards.filter((r) => r.id !== id));
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-cr-forest";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-body font-semibold text-xl text-cr-charcoal">Billing Settings</h1>
        <p className="text-sm text-cr-slate mt-1">Configure rate cards and billing defaults</p>
      </div>

      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-body font-medium transition-colors ${tab === i ? "border-b-2 border-cr-forest text-cr-forest" : "text-cr-slate hover:text-cr-charcoal"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-body font-semibold text-cr-charcoal">Rate Cards</h2>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm font-body font-medium bg-cr-forest text-white px-3 py-2 rounded-lg hover:bg-cr-sage transition-colors">
              <Plus size={15} /> Add rate card
            </button>
          </div>

          {showForm && (
            <div className="bg-cr-mint rounded-xl p-5 mb-5 space-y-4">
              <h3 className="font-body font-semibold text-cr-charcoal">New Rate Card</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard hourly" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Funder type</label>
                  <select value={form.funder_type} onChange={(e) => setForm({ ...form, funder_type: e.target.value })} className={inputCls}>
                    {FUNDER_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Hourly rate (£)</label>
                  <input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} className={inputCls} placeholder="18.00" />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Per visit rate (£)</label>
                  <input type="number" step="0.01" value={form.visit_rate} onChange={(e) => setForm({ ...form, visit_rate: e.target.value })} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Overnight rate (£)</label>
                  <input type="number" step="0.01" value={form.overnight_rate} onChange={(e) => setForm({ ...form, overnight_rate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-cr-slate mb-1">Travel rate per mile (£)</label>
                  <input type="number" step="0.01" value={form.travel_rate_per_mile} onChange={(e) => setForm({ ...form, travel_rate_per_mile: e.target.value })} className={inputCls} placeholder="0.45" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-body text-cr-charcoal">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                Set as default rate card
              </label>
              <div className="flex gap-3">
                <button onClick={saveRateCard} disabled={!form.name || saving}
                  className="flex items-center gap-1.5 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cr-sage transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-cr-charcoal hover:border-cr-forest transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {rateCards.length === 0 ? (
            <p className="text-sm text-cr-slate font-body text-center py-12">No rate cards yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {rateCards.map((rc) => (
                <div key={rc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body font-semibold text-cr-charcoal text-sm">{rc.name} {rc.is_default && <span className="ml-2 text-xs bg-cr-mint text-cr-forest rounded-full px-2 py-0.5">Default</span>}</p>
                    <p className="text-xs text-cr-slate mt-0.5 capitalize">{rc.funder_type?.replace("_", " ")} · £{rc.hourly_rate}/hr</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteRateCard(rc.id)} className="p-1.5 text-cr-red hover:opacity-70 transition-opacity"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-sm text-cr-slate font-body">Client billing configuration is set when creating or editing individual client records.</p>
          <p className="text-sm text-cr-slate font-body mt-2">Go to <strong>Clients → [Client] → Billing</strong> to configure funder type, rate card, and billing contact for each client.</p>
        </div>
      )}

      {tab === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Invoice number prefix</label>
            <input defaultValue="INV" className={inputCls} style={{ maxWidth: 200 }} />
            <p className="text-xs text-cr-slate mt-1">Format: INV-2026-0001</p>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Default VAT rate</label>
            <select className={inputCls} style={{ maxWidth: 200 }}>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="20">20%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Default payment terms (days)</label>
            <input type="number" defaultValue="30" className={inputCls} style={{ maxWidth: 200 }} />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Invoice footer text</label>
            <textarea rows={3} className={inputCls} placeholder="Payment by BACS to: Account number: 00000000 Sort code: 00-00-00" />
          </div>
          <button className="bg-cr-forest text-white px-5 py-2 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors">Save settings</button>
        </div>
      )}
    </div>
  );
}
