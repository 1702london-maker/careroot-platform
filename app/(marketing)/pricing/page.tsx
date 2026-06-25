"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Minus } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PLANS = [
  {
    id: "seed", name: "Seed", staff: "Up to 10 staff",
    desc: "For new care agencies preparing for CQC registration.",
    monthly: 99, annual: 79,
    features: ["Up to 10 staff accounts", "Unlimited clients", "AI care plan drafts", "CQC compliance dashboard", "Mobile carer app (offline)", "Family portal", "Emergency SOS + paramedic QR", "Nutrition and meal planning", "eMAR medication management", "30-day free trial"],
    highlight: false,
  },
  {
    id: "grow", name: "Grow", staff: "Up to 50 staff",
    desc: "For growing care agencies managing multiple teams.",
    monthly: 349, annual: 279,
    features: ["Everything in Seed", "Up to 50 staff accounts", "AI risk flags and insights", "Rota and scheduling", "Complaints management (28-day)", "Weekly AI family briefings", "WhatsApp and SMS notifications", "Invoicing and payroll", "50+ pre-built reports", "Priority support"],
    highlight: true,
  },
  {
    id: "scale", name: "Scale", staff: "Up to 200 staff",
    desc: "For larger care organisations with multiple services.",
    monthly: 899, annual: 719,
    features: ["Everything in Grow", "Up to 200 staff accounts", "Ofsted compliance module", "Advanced analytics", "Custom care plan templates", "API access", "Dedicated account manager", "Phone and video support", "SLA guarantee", "Custom onboarding"],
    highlight: false,
  },
  {
    id: "enterprise", name: "Enterprise", staff: "Unlimited staff",
    desc: "For large care groups, NHS teams, and franchise operators.",
    monthly: null, annual: null,
    features: ["Everything in Scale", "Unlimited staff accounts", "Custom App (your brand)", "Your own domain", "UK data residency guarantee", "Custom SLA and compliance", "Dedicated engineer support", "Multi-site management", "GP Connect (when live)", "Custom contracts"],
    highlight: false,
  },
];

const COMPARISON = [
  { feature: "Staff accounts", seed: "10", grow: "50", scale: "200", enterprise: "Unlimited" },
  { feature: "Clients", seed: "Unlimited", grow: "Unlimited", scale: "Unlimited", enterprise: "Unlimited" },
  { feature: "AI care plan drafts", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "CQC compliance dashboard", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "Emergency SOS + QR", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "Carer mobile app (offline)", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "Family portal", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "Nutrition and meal planning", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "eMAR medication", seed: true, grow: true, scale: true, enterprise: true },
  { feature: "AI risk flags", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "Rota and scheduling", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "Complaints management", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "AI family briefings", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "Invoicing and payroll", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "Reports (50+)", seed: false, grow: true, scale: true, enterprise: true },
  { feature: "Ofsted module", seed: false, grow: false, scale: true, enterprise: true },
  { feature: "API access", seed: false, grow: false, scale: true, enterprise: true },
  { feature: "Custom App", seed: false, grow: false, scale: false, enterprise: true },
  { feature: "GP Connect", seed: false, grow: false, scale: false, enterprise: "Soon" },
];

function Cell({ value, plan }: { value: boolean | string; plan: string }) {
  if (value === true) return <><CheckCircle size={16} className="text-[#1A3C2E] mx-auto" /><span className="sr-only">Included in {plan}</span></>;
  if (value === false) return <><Minus size={16} className="text-gray-300 mx-auto" /><span className="sr-only">Not included in {plan}</span></>;
  return <span className="text-xs font-medium text-[#1C1C1E]">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#F9F7F4] pt-24 pb-16 px-4 md:px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-4">Simple pricing</p>
        <h1 className="font-display font-bold text-[52px] md:text-[64px] leading-[1.1] text-[#1C1C1E] mb-4">
          Start free. Scale as you grow.
        </h1>
        <p className="text-xl text-[#6B7280] leading-relaxed max-w-xl mx-auto mb-2">
          30-day free trial on all plans. No credit card required. Cancel any time.
        </p>
        <p className="text-xs text-[#9CA3AF] mb-8">All prices in GBP, excluding VAT where applicable.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${!annual ? "bg-[#1A3C2E] text-white" : "text-[#6B7280]"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? "bg-[#1A3C2E] text-white" : "text-[#6B7280]"}`}
          >
            Annual
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${annual ? "bg-white/20 text-white" : "bg-[#E8F5EE] text-[#1A3C2E]"}`}>
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-[16px] p-6 relative flex flex-col ${plan.highlight ? "bg-[#1A3C2E] text-white" : "bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most popular
                </span>
              )}
              <div className="mb-5">
                <p className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-white/70" : "text-[#6B7280]"}`}>{plan.name}</p>
                <p className={`text-xs mb-4 ${plan.highlight ? "text-white/50" : "text-[#9CA3AF]"}`}>{plan.staff}</p>
                {plan.monthly ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`font-bold text-[40px] leading-none ${plan.highlight ? "text-white" : "text-[#1C1C1E]"}`}>
                        £{annual ? plan.annual : plan.monthly}
                      </span>
                      <span className={`text-base ${plan.highlight ? "text-white/60" : "text-[#6B7280]"}`}>/mo</span>
                    </div>
                    <p className={`text-xs ${plan.highlight ? "text-white/50" : "text-[#9CA3AF]"}`}>
                      ex VAT · {annual ? `£${plan.annual! * 12}/year billed annually` : `or £${plan.annual}/mo billed annually (save 20%)`}
                    </p>
                  </>
                ) : (
                  <div className="font-bold text-[40px] leading-none text-[#1C1C1E] mb-1">Custom</div>
                )}
                <p className={`text-sm mt-3 ${plan.highlight ? "text-white/70" : "text-[#6B7280]"}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle size={13} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? "text-white/60" : "text-[#1A3C2E]"}`} />
                    <span className={`text-xs leading-relaxed ${plan.highlight ? "text-white/80" : "text-[#6B7280]"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "enterprise" ? "/contact" : "/signup"}
                className={`block w-full text-center font-semibold text-sm py-3 rounded-[8px] transition-colors ${plan.highlight ? "bg-white text-[#1A3C2E] hover:bg-[#E8F5EE]" : "bg-[#1A3C2E] text-white hover:bg-[#4A7C5E]"}`}
              >
                {plan.id === "enterprise" ? "Contact us" : "Start free trial"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Custom App */}
      <section className="bg-white py-16 px-4 md:px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">Custom App</p>
              <h2 className="font-display font-bold text-[36px] leading-[44px] text-[#1C1C1E] mb-4">
                Your brand. Our platform.
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-6">
                Large care groups and NHS teams run Careroot under their own name. Staff, families, and CQC inspectors only ever see your brand.
              </p>
              <Link href="/custom-app" className="text-[#1A3C2E] font-semibold text-sm hover:text-[#4A7C5E] transition-colors">
                Learn more about Custom App →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Basic", price: "£500", period: "/mo", note: "+ £2,000 setup" },
                { name: "Full", price: "£1,000", period: "/mo", note: "+ £2,000 setup", highlight: true },
                { name: "Enterprise", price: "£1,500", period: "/mo", note: "+ £2,000 setup" },
              ].map(({ name, price, period, note, highlight }) => (
                <div key={name} className={`rounded-[12px] p-4 text-center ${highlight ? "bg-[#1A3C2E] text-white" : "bg-[#F9F7F4] border border-gray-100"}`}>
                  <p className={`text-xs font-semibold mb-2 ${highlight ? "text-white/70" : "text-[#6B7280]"}`}>{name}</p>
                  <p className={`font-bold text-xl ${highlight ? "text-white" : "text-[#1C1C1E]"}`}>{price}</p>
                  <p className={`text-xs ${highlight ? "text-white/60" : "text-[#9CA3AF]"}`}>{period}</p>
                  <p className={`text-[10px] mt-1 ${highlight ? "text-white/40" : "text-[#9CA3AF]"}`}>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-[#F9F7F4] py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-[36px] leading-[44px] text-[#1C1C1E] mb-8 text-center">
            Compare all features
          </h2>
          <div className="bg-white rounded-[16px] border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="grid grid-cols-5 border-b border-gray-100">
              <div className="p-4 col-span-1" />
              {["Seed", "Grow", "Scale", "Enterprise"].map((p, i) => (
                <div key={p} className={`p-4 text-center ${i === 1 ? "bg-[#1A3C2E] text-white" : ""}`}>
                  <p className={`text-sm font-bold ${i === 1 ? "text-white" : "text-[#1C1C1E]"}`}>{p}</p>
                </div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-5 border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <div className="p-3.5 col-span-1">
                  <p className="text-xs text-[#6B7280]">{row.feature}</p>
                </div>
                {([["Seed", row.seed], ["Grow", row.grow], ["Scale", row.scale], ["Enterprise", row.enterprise]] as [string, boolean | string][]).map(([planName, val], j) => (
                  <div key={j} className={`p-3.5 text-center flex items-center justify-center ${j === 1 ? "bg-[#1A3C2E]/5" : ""}`}>
                    <Cell value={val} plan={planName} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-[36px] leading-[44px] text-[#1C1C1E] mb-8 text-center">
            Common questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Is there really no credit card required?", a: "None. Start your 30-day trial without entering any payment details. We will remind you before the trial ends and you can choose a plan or cancel — no charge either way." },
              { q: "Can I change plan later?", a: "Yes. Upgrade or downgrade any time from your billing settings. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period." },
              { q: "What happens to my data if I cancel?", a: "You can export all your data at any time. If you cancel, your data is retained for 90 days so you can export it before permanent deletion." },
              { q: "Do you offer discounts for charities or NHS organisations?", a: "Yes — contact us directly at onboarding@careroot.co.uk. We have specific pricing for CQC-registered charities and NHS community care teams." },
              { q: "How does the Custom App work?", a: "We deploy a fully branded version of Careroot under your name, your domain, and your colours. Your staff, families, and CQC inspectors only ever see your brand." },
            ].map(({ q, a }) => (
              <div key={q} className="border border-gray-100 rounded-[12px] p-5">
                <h4 className="font-semibold text-[#1C1C1E] mb-2">{q}</h4>
                <p className="text-sm text-[#6B7280] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A3C2E] py-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-[44px] leading-[52px] text-white mb-4">
            Start your 30-day free trial today.
          </h2>
          <p className="text-white/70 mb-8">No credit card. No commitment. Cancel any time.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="bg-white text-[#1A3C2E] font-semibold px-8 py-3.5 rounded-[8px] hover:bg-[#E8F5EE] transition-colors w-full sm:w-auto text-center">
              Start free trial
            </Link>
            <Link href="/demo" className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-[8px] hover:bg-white/10 transition-colors w-full sm:w-auto text-center">
              Book a demo
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-5">Questions? Email onboarding@careroot.co.uk</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
