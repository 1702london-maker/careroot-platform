"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CreditCard, Zap, Users, Code2, Palette, CheckCircle2,
  ArrowUpCircle, ExternalLink, Loader2, AlertTriangle, ShieldCheck,
  FileText, Headphones, Archive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/stripe";

type Org = {
  id: string;
  name: string;
  plan: string;
  subscription_status?: string | null;
  billing_cycle: string;
  max_staff: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const PLANS = [
  {
    key: "seed",
    name: "Seed",
    monthly: 99,
    annual: 79,
    staffLimit: 10,
    features: ["Up to 10 staff", "Core care management", "Client records", "Basic rota", "Email support"],
    color: "cr-sage",
  },
  {
    key: "grow",
    name: "Grow",
    monthly: 349,
    annual: 279,
    staffLimit: 50,
    features: ["Up to 50 staff", "Everything in Seed", "EMAR medication", "Family portal", "AI risk flags", "Compliance tools", "Priority support"],
    color: "cr-forest",
    popular: true,
  },
  {
    key: "scale",
    name: "Scale",
    monthly: 899,
    annual: 719,
    staffLimit: 200,
    features: ["Up to 200 staff", "Everything in Grow", "AI weekly reports", "CQC evidence packs", "GP Connect", "Payroll & invoicing", "Dedicated support"],
    color: "cr-charcoal",
  },
];

const ADDONS = [
  { key: "extra_staff_block",   icon: Users,       label: "Extra 10 Staff",         price: "£49/mo",   desc: "Add blocks of 10 additional staff slots" },
  { key: "api_access",          icon: Code2,       label: "API Access",              price: "£149/mo",  desc: "Full REST API access with live key generation" },
  { key: "white_label_basic",   icon: Palette,     label: "White Label Basic",       price: "£500/mo",  desc: "Your branding, logo and domain" },
  { key: "white_label_full",    icon: Palette,     label: "White Label Full",        price: "£1,000/mo",desc: "Full white-label with custom app" },
  { key: "cqc_inspection_pack", icon: ShieldCheck, label: "CQC Inspection Pack",     price: "£499",     desc: "One-off expert CQC inspection readiness pack" },
  { key: "onboarding_support",  icon: Headphones,  label: "Onboarding Support",      price: "£299",     desc: "1-on-1 onboarding with a Careroot specialist" },
  { key: "paper_migration",     icon: Archive,     label: "Paper Migration",         price: "£199",     desc: "We migrate your paper records to Careroot" },
];

function isAllowedStripeUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "checkout.stripe.com" ||
      url.hostname === "billing.stripe.com"
    );
  } catch {
    return false;
  }
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      showToast("success", "Plan upgraded successfully! Welcome to your new plan.");
    }
    if (searchParams.get("addon_success") === "1") {
      showToast("success", "Add-on activated! Check your email for confirmation.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userRecord } = await supabase
        .from("users")
        .select("organisation_id")
        .eq("id", user.id)
        .single();
      if (!userRecord) return;
      const { data: orgData } = await supabase
        .from("organisations")
        .select("id, name, plan, billing_cycle, max_staff, stripe_customer_id, stripe_subscription_id")
        .eq("id", userRecord.organisation_id)
        .single();
      if (orgData) {
        setOrg(orgData as Org);
        setBillingCycle((orgData.billing_cycle as "monthly" | "annual") ?? "monthly");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (!org) return;
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing_cycle: billingCycle, organisation_id: org.id }),
      });
      const { url, error } = await res.json();
      if (error) { showToast("error", error); return; }
      if (!isAllowedStripeUrl(url)) { showToast("error", "Invalid billing redirect returned."); return; }
      window.location.assign(url);
    } catch {
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const handleAddon = async (addon_type: string) => {
    setUpgrading(addon_type);
    try {
      const res = await fetch("/api/stripe/addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addon_type }),
      });
      const { url, error } = await res.json();
      if (error) { showToast("error", error); return; }
      if (!isAllowedStripeUrl(url)) { showToast("error", "Invalid billing redirect returned."); return; }
      window.location.assign(url);
    } catch {
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { showToast("error", error); return; }
      if (!isAllowedStripeUrl(url)) { showToast("error", "Invalid billing portal redirect returned."); return; }
      window.location.assign(url);
    } catch {
      showToast("error", "Could not open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-cr-forest" />
      </div>
    );
  }

  const currentPlan = org?.plan ?? "seed";
  const subscriptionStatus = org?.subscription_status ?? (org?.stripe_subscription_id ? "active" : "trialing");
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const isPastDue = subscriptionStatus === "past_due";
  const planInfo = PLAN_DISPLAY[currentPlan];

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-body font-medium ${
          toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cr-charcoal">Billing & Plans</h1>
          <p className="text-sm font-body text-cr-slate mt-0.5">Manage your subscription and add-ons</p>
        </div>
        {org?.stripe_customer_id && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-body font-medium text-cr-charcoal hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Manage billing
          </button>
        )}
      </div>

      {/* Current Plan Card */}
      <div className={`rounded-xl border-2 p-6 ${isPastDue ? "border-amber-300 bg-amber-50" : "border-cr-forest/20 bg-cr-forest/5"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={18} className="text-cr-forest" />
              <span className="text-xs font-body font-semibold text-cr-forest uppercase tracking-wide">Current Plan</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-cr-charcoal">{planInfo?.name ?? currentPlan}</h2>
            <p className="text-sm font-body text-cr-slate mt-1">
              {org?.billing_cycle === "annual" ? `£${planInfo?.annualPrice ?? "—"}/month · billed annually` : `£${planInfo?.monthlyPrice ?? "—"}/month`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${
              isPastDue ? "bg-amber-200 text-amber-800" : isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {isPastDue ? "⚠ Payment due" : isActive ? "Active" : subscriptionStatus}
            </span>
            <span className="text-xs font-body text-cr-slate">{org?.max_staff ?? PLAN_LIMITS[currentPlan]} staff slots</span>
          </div>
        </div>

        {isPastDue && (
          <div className="mt-4 p-3 rounded-lg bg-amber-100 border border-amber-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <p className="text-xs font-body text-amber-800">
              Your last payment failed. Please update your payment method to avoid service interruption.{" "}
              <button onClick={handlePortal} className="underline font-semibold">Update now</button>
            </p>
          </div>
        )}
      </div>

      {/* Billing cycle toggle */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-cr-charcoal">Change Plan</h2>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 text-xs font-body font-medium rounded-md transition-all ${billingCycle === "monthly" ? "bg-white shadow text-cr-charcoal" : "text-cr-slate"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1 text-xs font-body font-medium rounded-md transition-all ${billingCycle === "annual" ? "bg-white shadow text-cr-charcoal" : "text-cr-slate"}`}
            >
              Annual <span className="text-cr-forest font-semibold">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const price = billingCycle === "annual" ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.key}
                className={`relative rounded-xl border-2 p-5 flex flex-col ${
                  plan.popular ? "border-cr-forest" : "border-gray-200"
                } ${isCurrent ? "bg-cr-forest/5" : "bg-white"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-cr-forest text-white text-xs font-body font-semibold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-display text-lg font-bold text-cr-charcoal">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-display font-bold text-cr-charcoal">£{price}</span>
                    <span className="text-xs font-body text-cr-slate">/month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <p className="text-xs font-body text-cr-forest mt-0.5">Billed annually · save £{(plan.monthly - plan.annual) * 12}/yr</p>
                  )}
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs font-body text-cr-slate">
                      <CheckCircle2 size={13} className="text-cr-forest shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2 text-center text-xs font-body font-semibold text-cr-forest border border-cr-forest/30 rounded-lg bg-cr-forest/5">
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={upgrading === plan.key}
                    className="w-full py-2 text-xs font-body font-semibold text-white bg-cr-forest rounded-lg hover:bg-cr-sage transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {upgrading === plan.key ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ArrowUpCircle size={13} />
                    )}
                    {upgrading === plan.key ? "Redirecting…" : "Switch to this plan"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Add-ons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADDONS.map((addon) => (
            <div key={addon.key} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-cr-forest/10 rounded-lg flex items-center justify-center">
                  <addon.icon size={15} className="text-cr-forest" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal leading-tight">{addon.label}</p>
                  <p className="text-xs font-body text-cr-forest font-medium">{addon.price}</p>
                </div>
              </div>
              <p className="text-xs font-body text-cr-slate mb-4 flex-1">{addon.desc}</p>
              <button
                onClick={() => handleAddon(addon.key)}
                disabled={upgrading === addon.key}
                className="w-full py-1.5 text-xs font-body font-semibold text-cr-forest border border-cr-forest rounded-lg hover:bg-cr-forest hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {upgrading === addon.key ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Zap size={12} />
                )}
                {upgrading === addon.key ? "Redirecting…" : "Add to plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice history link */}
      {org?.stripe_customer_id && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-cr-slate" />
            <div>
              <p className="text-sm font-body font-semibold text-cr-charcoal">Invoice history</p>
              <p className="text-xs font-body text-cr-slate">View and download past invoices</p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-cr-forest hover:text-cr-sage transition-colors"
          >
            {portalLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
            Open billing portal
          </button>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 size={32} className="animate-spin text-cr-forest" /></div>}>
      <BillingPageInner />
    </Suspense>
  );
}
