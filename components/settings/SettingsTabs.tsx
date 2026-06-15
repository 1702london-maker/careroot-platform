"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Building2, CreditCard, Bell, Shield, Plug } from "lucide-react";

const TABS = [
  { id: "org", label: "Organisation", icon: Building2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Plug },
];

const PLAN_DETAILS = {
  seed: { name: "Seed", limit: "10 staff", price: "£49/mo" },
  grow: { name: "Grow", limit: "50 staff", price: "£199/mo" },
  scale: { name: "Scale", limit: "200 staff", price: "£599/mo" },
  enterprise: { name: "Enterprise", limit: "Unlimited", price: "Custom" },
};

interface Props {
  user: Record<string, unknown> | null;
  organisation: Record<string, unknown> | null;
}

export function SettingsTabs({ user, organisation }: Props) {
  const [activeTab, setActiveTab] = useState("org");
  const plan = String(organisation?.plan || "seed") as keyof typeof PLAN_DETAILS;
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.seed;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-48 flex md:flex-col gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body text-left transition-all",
              activeTab === id
                ? "bg-cr-forest text-white"
                : "text-cr-charcoal hover:bg-gray-100"
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "org" && (
          <CRCard>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Organisation Details</h2>
            <div className="space-y-4">
              {[
                { label: "Organisation name", value: String(organisation?.name || "") },
                { label: "CQC Provider ID", value: String(organisation?.cqc_provider_id || "Not set") },
                { label: "CQC Location ID", value: String(organisation?.cqc_location_id || "Not set") },
                { label: "Organisation type", value: String(organisation?.type || "domiciliary") },
                { label: "On-call phone", value: String(organisation?.on_call_phone || "Not set") },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-body text-cr-slate">{label}</span>
                  <span className="text-sm font-body text-cr-charcoal font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CRCard>
        )}

        {activeTab === "billing" && (
          <CRCard>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Subscription & Billing</h2>
            <div className="p-4 bg-cr-mint rounded-xl mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-cr-charcoal">{planInfo.name} Plan</p>
                  <p className="text-sm text-cr-slate">Up to {planInfo.limit} · {planInfo.price}</p>
                </div>
                <CRBadge variant="forest">Active</CRBadge>
              </div>
            </div>
            <div className="space-y-3">
              <a
                href="/api/billing/portal"
                className="block w-full text-center py-3 border border-cr-forest text-cr-forest rounded-xl font-body text-sm hover:bg-cr-mint transition-all"
              >
                Manage billing & invoices
              </a>
              <a
                href="/pricing"
                className="block w-full text-center py-3 bg-cr-forest text-white rounded-xl font-body text-sm hover:bg-cr-sage transition-all"
              >
                Upgrade plan
              </a>
            </div>
          </CRCard>
        )}

        {activeTab === "notifications" && (
          <CRCard>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { label: "Missed visit alerts", desc: "Get notified when a visit is not started on time" },
                { label: "Emergency SOS alerts", desc: "Immediate SMS and email when emergency is triggered" },
                { label: "AI risk flag alerts", desc: "Notifications when AI detects high/critical risk" },
                { label: "Complaint deadline reminders", desc: "Reminders at 14 and 7 days before 28-day deadline" },
                { label: "Weekly family briefings", desc: "Weekly AI-generated updates sent to family members" },
              ].map(({ label, desc }) => (
                <label key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer">
                  <div>
                    <p className="text-sm font-body font-medium text-cr-charcoal">{label}</p>
                    <p className="text-xs text-cr-slate">{desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-cr-forest" />
                </label>
              ))}
            </div>
          </CRCard>
        )}

        {activeTab === "security" && (
          <CRCard>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Security</h2>
            <div className="space-y-4">
              <div className="p-4 bg-cr-mint rounded-xl">
                <p className="text-sm font-body font-semibold text-cr-charcoal mb-1">Data Protection</p>
                <p className="text-xs text-cr-slate">All data is encrypted at rest and in transit. Compliant with UK GDPR and NHS Data Security standards.</p>
              </div>
              <a href="/update-password" className="block py-3 border border-gray-200 text-cr-charcoal rounded-xl text-sm font-body text-center hover:bg-gray-50">
                Change password
              </a>
            </div>
          </CRCard>
        )}

        {activeTab === "integrations" && (
          <CRCard>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Integrations</h2>
            <div className="space-y-4">
              {[
                { name: "CQC Provider Portal", status: "connected", desc: "Compliance data synced" },
                { name: "NHS Spine / Summary Care Records", status: "coming_soon", desc: "Coming Q3 2026" },
                { name: "Twilio SMS", status: "connected", desc: "Emergency SMS enabled" },
                { name: "Stripe Billing", status: "connected", desc: "Subscription active" },
                { name: "GP Connect", status: "coming_soon", desc: "Coming Q4 2026" },
              ].map(({ name, status, desc }) => (
                <div key={name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-body font-medium text-cr-charcoal">{name}</p>
                    <p className="text-xs text-cr-slate">{desc}</p>
                  </div>
                  <CRBadge variant={status === "connected" ? "green" : "slate"}>
                    {status === "connected" ? "Connected" : "Coming soon"}
                  </CRBadge>
                </div>
              ))}
            </div>
          </CRCard>
        )}
      </div>
    </div>
  );
}
