import Link from "next/link";
import {
  Leaf, Shield, Brain, Heart, AlertTriangle, Smartphone,
  Users, CheckCircle, ArrowRight, Sparkles, Star
} from "lucide-react";
import { CRAIBadge } from "@/components/ui/CRAIBadge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Pricing</Link>
            <Link href="/demo" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Book a Demo</Link>
            <Link href="/login" className="text-sm font-body text-cr-forest font-medium hover:text-cr-sage transition-colors">Sign in</Link>
            <Link href="/signup" className="cr-btn-primary text-sm px-4 py-2">Start free trial</Link>
          </div>
          <Link href="/signup" className="md:hidden cr-btn-primary text-sm px-3 py-1.5">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cr-mint text-cr-forest text-xs font-body font-medium mb-6">
            <Shield size={12} />
            Built for CQC 2026 Single Assessment Framework
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-cr-charcoal leading-tight mb-6">
            Care, managed<br />
            <span className="text-cr-forest">intelligently.</span>
          </h1>
          <p className="text-lg font-body text-cr-slate mb-8 max-w-xl leading-relaxed">
            The complete platform for UK care providers — from AI-powered care plans to CQC compliance, family engagement to emergency response. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="cr-btn-primary px-6 py-3 text-base flex items-center justify-center gap-2">
              Start free trial
              <ArrowRight size={18} />
            </Link>
            <Link href="/demo" className="cr-btn-secondary px-6 py-3 text-base flex items-center justify-center gap-2">
              Book a demo
            </Link>
          </div>
          <p className="mt-3 text-xs font-body text-cr-slate">30 days free · No credit card required · Set up in under an hour</p>
        </div>
      </section>

      {/* Problem section */}
      <section className="bg-cr-ivory py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-4">
            Care agencies are drowning in paperwork.
          </h2>
          <p className="text-base font-body text-cr-slate mb-10 max-w-2xl">
            Every minute spent on admin is a minute not spent on care. Your carers deserve better tools. Your clients deserve better care.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Compliance anxiety",
                desc: "CQC inspections feel like a crisis rather than a confirmation of your good work. Evidence is scattered, inconsistent, and hard to find.",
              },
              {
                title: "Disconnected systems",
                desc: "Care plans in one place, rotas in another, medications on paper. No single view of what's happening across your service.",
              },
              {
                title: "Carers without information",
                desc: "Your best carers arrive at a visit without knowing about a client's DNR status, allergies, or the fact that they only eat from blue plates.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle size={16} className="text-cr-red" />
                </div>
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">{p.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-4">
              Everything your care service needs.
            </h2>
            <p className="text-base font-body text-cr-slate max-w-xl mx-auto">
              One platform. Every role. Every need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain size={22} className="text-cr-gold" />,
                title: "AI Care Planning",
                desc: "Generate person-centred care plans from assessment data in minutes. AI analyses patterns and flags concerns before they become incidents.",
                ai: true,
              },
              {
                icon: <Shield size={22} className="text-cr-forest" />,
                title: "CQC & Ofsted Readiness",
                desc: "Real-time compliance score across all 5 CQC key questions. Know exactly where you stand before an inspection.",
              },
              {
                icon: <Heart size={22} className="text-cr-sage" />,
                title: "Family Portal",
                desc: "Give families real-time visibility. Visit updates, AI-generated weekly briefings, meal records, and direct messaging.",
              },
              {
                icon: <AlertTriangle size={22} className="text-cr-red" />,
                title: "Emergency Response",
                desc: "One-tap SOS with automatic cascade to managers, emergency contacts, and on-call staff. Paramedic QR code access for every client.",
              },
              {
                icon: <Users size={22} className="text-cr-slate" />,
                title: "Nutrition Management",
                desc: "Detailed meal plans with step-by-step preparation instructions. Track appetite patterns. Alert managers to concerning changes.",
              },
              {
                icon: <Smartphone size={22} className="text-cr-forest" />,
                title: "Mobile Carer App",
                desc: "Built for one-handed use. Check in, complete tasks, record meals, voice note visits, and access care plans — all offline-capable.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-cr-ivory flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-lg font-semibold text-cr-charcoal">{f.title}</h3>
                  {f.ai && <CRAIBadge size="sm" />}
                </div>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section className="bg-yellow-50 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-cr-gold" />
            <span className="text-sm font-body font-medium text-yellow-800">AI-powered intelligence</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-4">
            Intelligence built in from day one.
          </h2>
          <p className="text-base font-body text-cr-slate mb-8 max-w-xl">
            Careroot's AI works quietly in the background — spotting patterns, drafting documents, and surfacing concerns before they escalate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {[
              "AI-generated person-centred care plan drafts",
              "Risk pattern detection across 30-day visit history",
              "Weekly family briefings written in plain English",
              "Voice-to-structured note transcription",
              "Appetite and nutrition trend analysis",
              "CQC compliance scoring with gap identification",
              "Paper care plan import and structuring",
              "AI risk flags with evidence citations",
            ].map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle size={16} className="text-cr-gold mt-0.5 flex-shrink-0" />
                <span className="text-sm font-body text-cr-charcoal">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency section */}
      <section className="bg-red-50 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-cr-red" />
            <span className="text-sm font-body font-medium text-cr-red">Emergency response</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-4">
            When every second counts.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "One-tap SOS",
                desc: "A single tap triggers an emergency cascade: SMS to manager, on-call staff, and all emergency contacts simultaneously.",
              },
              {
                title: "Paramedic QR Access",
                desc: "Every client has a QR code and PIN card for their fridge. Paramedics can access full medical info without a login in under 10 seconds.",
              },
              {
                title: "DNR Always Visible",
                desc: "Do Not Resuscitate status displays as a red banner on every screen — care plans, visit screens, paramedic access. Cannot be missed.",
              },
            ].map((e) => (
              <div key={e.title} className="bg-white rounded-xl p-6 border border-red-200">
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">{e.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-4">
            Simple, transparent pricing.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8">
            {[
              { name: "Seed", price: "£99", period: "/month", staff: "Up to 10 staff", highlight: false },
              { name: "Grow", price: "£349", period: "/month", staff: "Up to 50 staff", highlight: true },
              { name: "Scale", price: "£899", period: "/month", staff: "Up to 200 staff", highlight: false },
            ].map((t) => (
              <div
                key={t.name}
                className={`rounded-xl p-6 border ${
                  t.highlight
                    ? "bg-cr-forest text-white border-cr-forest"
                    : "bg-white border-gray-100"
                }`}
              >
                {t.highlight && (
                  <div className="flex justify-center mb-3">
                    <span className="px-2 py-0.5 bg-cr-gold text-white text-xs font-body font-semibold rounded-full">
                      Most popular
                    </span>
                  </div>
                )}
                <h3 className={`font-display text-xl font-semibold mb-1 ${t.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {t.name}
                </h3>
                <div className={`text-3xl font-display font-semibold ${t.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {t.price}
                  <span className={`text-sm font-body font-normal ${t.highlight ? "text-white/70" : "text-cr-slate"}`}>
                    {t.period}
                  </span>
                </div>
                <p className={`text-sm font-body mt-2 ${t.highlight ? "text-white/70" : "text-cr-slate"}`}>
                  {t.staff}
                </p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block mt-6 text-sm font-body text-cr-forest hover:text-cr-sage transition-colors">
            See full pricing and features →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cr-forest py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
            Ready to transform your care service?
          </h2>
          <p className="text-base font-body text-white/70 mb-8 max-w-lg mx-auto">
            Join care agencies across the UK using Careroot to deliver better care and stay CQC ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-white text-cr-forest rounded-lg px-6 py-3 font-body font-semibold text-base hover:bg-cr-mint transition-colors"
            >
              Start free trial — 30 days free
            </Link>
            <Link
              href="/demo"
              className="border border-white/40 text-white rounded-lg px-6 py-3 font-body font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cr-charcoal py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-cr-forest rounded-lg flex items-center justify-center">
                <Leaf size={14} className="text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-white">Careroot</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                ["Features", "/features"],
                ["Pricing", "/pricing"],
                ["Book a Demo", "/demo"],
                ["Sign In", "/login"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="text-xs font-body text-white/50 hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>
            <p className="text-xs font-body text-white/30">
              © {new Date().getFullYear()} Careroot Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
