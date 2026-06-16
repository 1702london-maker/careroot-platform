"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Leaf, ChevronDown } from "lucide-react";

const MONTHLY = {
  seed: { price: 99, label: "£99/mo" },
  grow: { price: 349, label: "£349/mo" },
  scale: { price: 899, label: "£899/mo" },
};
const ANNUAL = {
  seed: { price: 79, annual: 948, label: "£79/mo" },
  grow: { price: 279, annual: 3348, label: "£279/mo" },
  scale: { price: 719, annual: 8628, label: "£719/mo" },
};

const PLANS = [
  {
    id: "seed",
    name: "Seed",
    staff: "Up to 10 staff",
    desc: "Perfect for new care agencies preparing for CQC registration.",
    features: [
      "Up to 10 staff accounts",
      "Unlimited clients",
      "AI care plan drafts",
      "CQC compliance dashboard",
      "Mobile carer app",
      "Family portal",
      "Emergency SOS + paramedic access",
      "Email support",
      "30-day free trial",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlight: false,
  },
  {
    id: "grow",
    name: "Grow",
    staff: "Up to 50 staff",
    desc: "For growing care agencies managing multiple teams.",
    features: [
      "Everything in Seed",
      "Up to 50 staff accounts",
      "AI risk flags and insights",
      "Rota and scheduling",
      "Medication management (eMAR)",
      "Complaints management",
      "Weekly AI family briefings",
      "WhatsApp and SMS notifications",
      "Priority support",
      "30-day free trial",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    staff: "Up to 200 staff",
    desc: "For larger care organisations with multiple services.",
    features: [
      "Everything in Grow",
      "Up to 200 staff accounts",
      "Ofsted compliance module",
      "Advanced reports and analytics",
      "Custom care plan templates",
      "API access",
      "Dedicated account manager",
      "Phone and video support",
      "30-day free trial",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    staff: "Unlimited staff",
    desc: "For large care groups, NHS teams, and franchise agencies.",
    features: [
      "Everything in Scale",
      "Unlimited staff accounts",
      "White label option",
      "Custom integrations",
      "SLA guarantee",
      "On-site training",
      "Data export and migration support",
      "Dedicated implementation team",
    ],
    cta: "Contact us",
    href: "/demo",
    highlight: false,
  },
];

const ADDONS = [
  {
    name: "CQC Inspection Pack",
    price: "£299",
    billing: "one-time",
    desc: "Full evidence bundle, mock inspection report, AI gap analysis, and action plan. Get inspection-ready in 48 hours.",
    cta: "Add to plan",
    type: "cqc_inspection_pack",
  },
  {
    name: "Onboarding Support",
    price: "£499",
    billing: "one-time",
    desc: "Done-with-you setup, data migration from your existing system, and staff training session.",
    cta: "Add to plan",
    type: "onboarding_support",
  },
  {
    name: "Paper Migration",
    price: "£199",
    billing: "one-time",
    desc: "Upload all your existing paper care plans. AI converts every one to digital format for manager review.",
    cta: "Add to plan",
    type: "paper_migration",
  },
  {
    name: "Extra Staff Block",
    price: "£29",
    billing: "/mo",
    desc: "Add 10 more staff accounts to any plan. Stack as many as you need.",
    cta: "Add to plan",
    type: "extra_staff_block",
  },
  {
    name: "API Access",
    price: "£199",
    billing: "/mo",
    desc: "Full REST API access for custom integrations with your existing systems.",
    cta: "Add to plan",
    type: "api_access",
  },
  {
    name: "White Label",
    price: "From £500",
    billing: "/mo",
    desc: "Your brand, your colours, your domain. Careroot powers everything invisibly in the background.",
    cta: "Learn more",
    type: "white_label",
    scrollTo: "white-label",
  },
];

const WL_PACKAGES = [
  {
    name: "Basic White Label",
    price: "£500/mo extra",
    setup: "£2,000 one-time setup fee",
    features: ["Your logo and app name", "Custom brand colours", "Branded login screen"],
  },
  {
    name: "Full White Label",
    price: "£1,000/mo extra",
    setup: "£2,000 one-time setup fee",
    features: ["Custom domain (premiercare.co.uk)", "Branded emails from your domain", "Everything in Basic"],
  },
  {
    name: "Enterprise White Label",
    price: "£1,500/mo extra",
    setup: "£2,000 one-time setup fee",
    features: ["Your own Play Store & App Store listing", "Dedicated white label support", "Everything in Full"],
  },
];

const FAQS = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade instantly. Downgrade takes effect at the end of your billing period. No penalties.",
  },
  {
    q: "What happens after my 30-day trial?",
    a: "You choose a plan and enter payment details. If you don't upgrade your account pauses — no data is deleted.",
  },
  {
    q: "Is my data safe?",
    a: "All data is encrypted in transit and at rest. We use Supabase with row-level security — no organisation can ever see another's data. UK data residency available on Enterprise.",
  },
  {
    q: "Do you offer NHS and local authority pricing?",
    a: "Yes. Contact us for public sector pricing. We work with NHS community care teams and local authority commissioning services.",
  },
  {
    q: "Can I import my existing care plans?",
    a: "Yes. Our Paper Migration add-on converts all your existing paper or PDF care plans to digital format using AI. Your manager reviews and approves each one before it goes live.",
  },
  {
    q: "What is the white label option?",
    a: "White label means your staff, families, and CQC inspectors only see your brand — never Careroot. We power everything in the background. Contact us to discuss.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fee on standard plans. White label has a one-time £2,000 setup fee covering branding configuration, domain setup, and staff training.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-body font-semibold text-cr-charcoal text-sm">{q}</span>
        <ChevronDown size={16} className={`text-cr-slate flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-4 text-sm font-body text-cr-slate leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const getPrice = (planId: string) => {
    if (planId === "enterprise") return null;
    const prices = annual ? ANNUAL : MONTHLY;
    return prices[planId as keyof typeof MONTHLY];
  };

  const scrollToWL = () => {
    document.getElementById("white-label")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-body text-cr-slate hover:text-cr-charcoal">Sign in</Link>
            <Link href="/signup" className="cr-btn-primary text-sm px-4 py-2">Start free trial</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-4">
            Simple, transparent pricing.
          </h1>
          <p className="text-base font-body text-cr-slate max-w-xl mx-auto mb-8">
            30-day free trial on all plans. No credit card required. Cancel any time.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-body font-semibold transition-all ${
                !annual ? "bg-cr-forest text-white shadow-sm" : "text-cr-slate hover:text-cr-charcoal"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-body font-semibold flex items-center gap-2 transition-all ${
                annual ? "bg-cr-forest text-white shadow-sm" : "text-cr-slate hover:text-cr-charcoal"
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 bg-cr-gold text-white text-xs rounded-full font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {PLANS.map((plan) => {
            const priceData = getPrice(plan.id);
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col relative ${
                  plan.highlight
                    ? "bg-cr-forest text-white border-cr-forest shadow-xl"
                    : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-cr-gold text-white text-xs font-body font-bold rounded-full shadow">
                      Most popular
                    </span>
                  </div>
                )}

                <h2 className={`font-display text-xl font-semibold mb-2 ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {plan.name}
                </h2>

                <div className="mb-1">
                  {priceData ? (
                    <>
                      <span className={`text-4xl font-display font-semibold ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                        {priceData.label}
                      </span>
                      {annual && "annual" in priceData && (
                        <p className={`text-xs font-body mt-1 ${plan.highlight ? "text-white/60" : "text-cr-slate"}`}>
                          billed as £{priceData.annual.toLocaleString()}/year
                        </p>
                      )}
                    </>
                  ) : (
                    <span className={`text-2xl font-display font-semibold ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                      From £1,500/mo
                    </span>
                  )}
                </div>

                <p className={`text-xs font-body font-semibold mb-1 mt-2 ${plan.highlight ? "text-white/70" : "text-cr-slate"}`}>
                  {plan.staff}
                </p>
                <p className={`text-xs font-body mb-5 ${plan.highlight ? "text-white/60" : "text-cr-slate"}`}>
                  {plan.desc}
                </p>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? "text-cr-gold" : "text-cr-sage"}`} />
                      <span className={`text-xs font-body ${plan.highlight ? "text-white/80" : "text-cr-charcoal"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center rounded-xl py-2.5 text-sm font-body font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-white text-cr-forest hover:bg-cr-mint"
                      : plan.id === "enterprise"
                      ? "border border-cr-forest text-cr-forest hover:bg-cr-mint"
                      : "border border-cr-forest text-cr-forest hover:bg-cr-mint"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs font-body text-cr-slate mb-20">
          All prices exclude VAT. &nbsp;
          <Link href="/demo" className="text-cr-forest hover:underline">Talk to us about volume discounts →</Link>
        </p>

        {/* Add-ons */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-semibold text-cr-charcoal mb-2">Enhance your plan</h2>
            <p className="text-sm font-body text-cr-slate">One-time and monthly add-ons available on any plan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADDONS.map((addon) => (
              <div key={addon.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-lg font-semibold text-cr-charcoal">{addon.name}</h3>
                  <div className="text-right">
                    <span className="text-xl font-display font-semibold text-cr-charcoal">{addon.price}</span>
                    <span className="text-xs text-cr-slate ml-1">{addon.billing}</span>
                  </div>
                </div>
                <p className="text-sm font-body text-cr-slate flex-1 mb-5">{addon.desc}</p>
                <button
                  onClick={addon.scrollTo ? scrollToWL : undefined}
                  className="block text-center w-full rounded-xl py-2.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest hover:bg-cr-mint transition-colors"
                >
                  {addon.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* White Label section */}
        <div id="white-label" className="rounded-3xl bg-cr-forest text-white p-10 mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-3">
              Your brand. Our platform.
            </h2>
            <p className="text-base font-body text-white/70 max-w-2xl mx-auto">
              Large care groups, NHS teams, and franchise agencies use Careroot under their own name. Your staff, families, and CQC inspectors only ever see your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { title: "Brand", desc: "Your logo, your colours, your app name" },
              { title: "Domain", desc: "Run on your own domain, branded emails from your domain" },
              { title: "App", desc: "Your own Play Store and App Store listing" },
            ].map((col) => (
              <div key={col.title} className="bg-white/10 rounded-2xl p-6 text-center">
                <h3 className="font-display text-xl font-semibold text-white mb-2">{col.title}</h3>
                <p className="text-sm font-body text-white/70">{col.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {WL_PACKAGES.map((pkg) => (
              <div key={pkg.name} className="bg-white/10 border border-white/20 rounded-2xl p-6 flex flex-col">
                <h3 className="font-display text-lg font-semibold text-white mb-1">{pkg.name}</h3>
                <p className="text-2xl font-display font-semibold text-cr-gold mb-1">{pkg.price}</p>
                <p className="text-xs text-white/50 mb-4">{pkg.setup}</p>
                <ul className="space-y-2 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={13} className="text-cr-gold mt-0.5 flex-shrink-0" />
                      <span className="text-xs font-body text-white/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/demo?subject=white-label"
              className="inline-block px-8 py-3 bg-white text-cr-forest rounded-xl font-body font-semibold text-sm hover:bg-cr-mint transition-colors"
            >
              Talk to us about white label →
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
            {FAQS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cr-forest rounded-md flex items-center justify-center">
              <Leaf size={12} className="text-white" />
            </div>
            <span className="font-display text-sm font-semibold text-cr-charcoal">Careroot</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-xs font-body text-cr-slate hover:text-cr-charcoal">Features</Link>
            <Link href="/pricing" className="text-xs font-body text-cr-slate hover:text-cr-charcoal">Pricing</Link>
            <Link href="/white-label" className="text-xs font-body text-cr-slate hover:text-cr-charcoal">White Label</Link>
            <Link href="/demo" className="text-xs font-body text-cr-slate hover:text-cr-charcoal">Book Demo</Link>
          </div>
          <p className="text-xs font-body text-cr-slate">© {new Date().getFullYear()} Careroot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
