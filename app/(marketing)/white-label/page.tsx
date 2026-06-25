import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "White Label Care Software | Careroot",
  description: "Launch your own branded care management platform. White-label Careroot with your logo, colours, and domain. Built for care groups, franchises, and system providers.",
  openGraph: { title: "White Label Care Software | Careroot", description: "Your brand, our platform. White-label care management for groups and franchises.", url: "https://www.careroot.co.uk/white-label", siteName: "Careroot" },
};

import Link from "next/link";
import { CheckCircle, Leaf, Building2, Globe, Mail, Smartphone, Users, Shield } from "lucide-react";

const WHO_ITS_FOR = [
  "Large care groups with multiple services",
  "NHS community care teams",
  "Franchise care agencies",
  "Local authority care services",
  "Care consultancies managing multiple agencies",
];

const WHAT_YOU_GET = [
  { icon: <Leaf size={20} />, title: "Your logo and brand colours throughout" },
  { icon: <Globe size={20} />, title: "Your own domain (premiercare.co.uk not careroot.care)" },
  { icon: <Mail size={20} />, title: "Emails sent from your domain" },
  { icon: <Smartphone size={20} />, title: "Your name in the Play Store and App Store" },
  { icon: <Users size={20} />, title: "Your support contact details" },
  { icon: <Shield size={20} />, title: "Full Careroot platform underneath" },
];

const HOW_IT_WORKS = [
  "Contact us and tell us about your organisation",
  "We configure your branding, colours, and domain in 48 hours",
  "Your staff download the app under your name",
  "Families log into your branded portal",
  "CQC inspectors see your digital system",
];

const PACKAGES = [
  {
    name: "Basic",
    price: "£500/mo",
    setup: "+ £2,000 one-time setup",
    features: ["Your logo and app name", "Custom brand colours", "Branded login screen"],
  },
  {
    name: "Full",
    price: "£1,000/mo",
    setup: "+ £2,000 one-time setup",
    features: ["Custom domain", "Branded emails from your domain", "Everything in Basic"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "£1,500/mo",
    setup: "+ £2,000 one-time setup",
    features: ["Play Store & App Store listing", "Dedicated white label support", "Everything in Full"],
  },
];

const WL_FAQS = [
  {
    q: "How long does white label setup take?",
    a: "48–72 hours for Basic and Full. Enterprise with App Store listing takes 2–4 weeks depending on Apple and Google review times.",
  },
  {
    q: "Can my staff tell it's powered by Careroot?",
    a: "No. Your app name, logo, colours, and domain replace all Careroot branding throughout the platform.",
  },
  {
    q: "What's the £2,000 setup fee for?",
    a: "It covers branding configuration, domain setup, SSL provisioning, email domain verification, and an onboarding call with your team.",
  },
  {
    q: "Can I use my existing domain?",
    a: "Yes. You add a CNAME record pointing to our infrastructure and we provision SSL automatically.",
  },
];

export default function WhiteLabelPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-body text-cr-slate hover:text-cr-charcoal">Pricing</Link>
            <Link href="/demo" className="cr-btn-primary text-sm px-4 py-2">Book a demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-cr-forest text-white py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-body font-medium mb-6">
            <Building2 size={12} /> Enterprise white label
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white leading-tight mb-5">
            Your care platform.<br />Your brand.
          </h1>
          <p className="text-lg font-body text-white/70 max-w-2xl mx-auto mb-8">
            Power your care management with Careroot — invisibly. Your staff, families, and CQC inspectors only ever see you.
          </p>
          <Link href="/demo?subject=white-label" className="inline-block px-8 py-3 bg-white text-cr-forest rounded-xl font-body font-semibold text-sm hover:bg-cr-mint transition-colors">
            Talk to us about white label →
          </Link>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 bg-cr-ivory">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal mb-3">Who it&apos;s for</h2>
          <p className="text-base font-body text-cr-slate mb-8 max-w-xl">
            White label is built for organisations that already have a strong brand and don&apos;t want a third-party name in front of their teams.
          </p>
          <div className="space-y-3">
            {WHO_ITS_FOR.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={16} className="text-cr-forest flex-shrink-0" />
                <span className="text-sm font-body text-cr-charcoal">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal mb-2">What you get</h2>
          <p className="text-base font-body text-cr-slate mb-10">Every touchpoint replaced with your brand.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.title} className="bg-cr-mint rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-cr-forest/10 rounded-xl flex items-center justify-center text-cr-forest flex-shrink-0">
                  {item.icon}
                </div>
                <p className="text-sm font-body font-semibold text-cr-charcoal">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-cr-ivory">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal text-center mb-10">How it works</h2>
          <div className="space-y-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-8 h-8 rounded-full bg-cr-forest text-white flex items-center justify-center text-sm font-body font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-base font-body text-cr-charcoal pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal text-center mb-2">Packages</h2>
          <p className="text-sm font-body text-cr-slate text-center mb-10">Added on top of your Careroot plan. Enterprise and Scale plans recommended.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  pkg.highlight
                    ? "bg-cr-forest text-white border-cr-forest shadow-xl"
                    : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                <h3 className={`font-display text-xl font-semibold mb-2 ${pkg.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {pkg.name}
                </h3>
                <p className={`text-3xl font-display font-semibold mb-1 ${pkg.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {pkg.price}
                </p>
                <p className={`text-xs font-body mb-5 ${pkg.highlight ? "text-white/60" : "text-cr-slate"}`}>{pkg.setup}</p>
                <ul className="space-y-2 flex-1 mb-5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={13} className={`mt-0.5 flex-shrink-0 ${pkg.highlight ? "text-cr-gold" : "text-cr-sage"}`} />
                      <span className={`text-xs font-body ${pkg.highlight ? "text-white/80" : "text-cr-charcoal"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/demo?subject=white-label"
                  className={`block text-center rounded-xl py-2.5 text-sm font-body font-semibold transition-colors ${
                    pkg.highlight
                      ? "bg-white text-cr-forest hover:bg-cr-mint"
                      : "border border-cr-forest text-cr-forest hover:bg-cr-mint"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-cr-ivory">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl font-semibold text-cr-charcoal text-center mb-8">White label FAQ</h2>
          <div className="space-y-4">
            {WL_FAQS.map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-body font-semibold text-cr-charcoal mb-2 text-sm">{item.q}</h3>
                <p className="text-sm font-body text-cr-slate">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-cr-forest text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-3xl font-semibold text-white mb-3">Ready to go white label?</h2>
          <p className="text-base font-body text-white/70 mb-8">
            Tell us about your organisation and we&apos;ll have your branded platform ready within 48 hours.
          </p>
          <Link
            href="/demo?subject=white-label"
            className="inline-block px-8 py-3 bg-white text-cr-forest rounded-xl font-body font-semibold text-sm hover:bg-cr-mint transition-colors"
          >
            Talk to us about white label →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
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
          <p className="text-xs font-body text-cr-slate">© {new Date().getFullYear()} Careroot</p>
        </div>
      </footer>
    </div>
  );
}
