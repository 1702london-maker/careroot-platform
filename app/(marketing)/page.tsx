import Link from "next/link";
import {
  Brain, ShieldCheck, AlertTriangle, Heart, Smartphone,
  CheckCircle, ArrowRight, Sparkles, Star, Shield,
  QrCode, Users, UtensilsCrossed, AlertCircle, MessageSquare,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="bg-cr-ivory py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cr-gold/10 text-cr-gold text-xs font-body font-semibold mb-7 border border-cr-gold/20">
            <Shield size={12} />
            Built for CQC 2026 Single Assessment Framework
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold text-cr-charcoal leading-tight mb-6 max-w-4xl">
            The care platform that works as hard as your team.
          </h1>
          <p className="text-lg md:text-xl font-body text-cr-slate mb-10 max-w-2xl leading-relaxed">
            AI-powered care management, CQC compliance, emergency response, and family engagement — built specifically for UK domiciliary and supported living providers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/signup"
              className="bg-cr-forest text-white rounded-btn px-7 py-3.5 font-body font-semibold text-base hover:bg-cr-sage transition-colors flex items-center justify-center gap-2"
            >
              Start free trial
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="border border-[#1A3C2E] text-[#1A3C2E] rounded-btn px-7 py-3.5 font-body font-semibold text-base hover:bg-cr-mint transition-colors flex items-center justify-center gap-2"
            >
              Watch 2-min demo
            </Link>
          </div>
          <p className="text-sm font-body text-cr-slate">30 days free · No credit card · Set up in under an hour</p>

          {/* Trust signals */}
          <div className="flex flex-col sm:flex-row gap-5 mt-8">
            {[
              { icon: Shield, text: "NHS-grade security" },
              { icon: CheckCircle, text: "CQC 2026 compliant" },
              { icon: CheckCircle, text: "Works offline on any device" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={15} className="text-cr-forest" />
                <span className="text-sm font-body text-cr-slate">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFIT CARDS ── */}
      <section className="bg-cr-mint py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                Icon: ShieldCheck,
                headline: "CQC 2026 Ready",
                body: "Built around the CQC Single Assessment Framework from day one — not retrofitted to meet it.",
              },
              {
                Icon: Smartphone,
                headline: "Works Offline",
                body: "The carer app caches everything needed before each shift. Complete visits with no signal. Syncs when back online.",
              },
              {
                Icon: AlertCircle,
                headline: "Set Up in Under an Hour",
                body: "Add your organisation, invite your first carer, onboard your first client. No IT team required.",
              },
              {
                Icon: Heart,
                headline: "30-Day Free Trial",
                body: "Every plan. Every feature. No credit card. No commitment. Cancel any time.",
              },
            ].map(({ Icon, headline, body }) => (
              <div key={headline} className="bg-white rounded-card p-6 border border-[#E5E7EB] shadow-card text-center">
                <Icon size={32} className="text-cr-forest mx-auto mb-3" />
                <p className="font-display text-xl text-cr-charcoal mb-2">{headline}</p>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="bg-cr-ivory py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-4 max-w-2xl">
            Care agencies are drowning in paperwork.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-xl">
            Every minute spent on admin is a minute not spent on care. Your carers deserve better tools. Your clients deserve better care.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "CQC inspections keep you up at night",
                body: "Evidence is scattered across paper, email, and memory. When the inspector arrives you scramble. A bad day should never become a bad rating.",
              },
              {
                title: "Seven tools for one job",
                body: "Care plans in a folder, rota on a spreadsheet, medications on paper, incidents in an email chain. No single view of your service.",
              },
              {
                title: "Your carer arrives and doesn't know",
                body: "They don't know about the DNR. They don't know about the allergy. They don't know that Margaret only eats from blue plates and hates the smell of fish. That's not care. That's a risk.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-card p-7 border-l-4 border-cr-red shadow-card">
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">{p.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-4">
              One platform. Every role. Every need.
            </h2>
            <p className="text-base font-body text-cr-slate max-w-xl mx-auto">
              Careroot replaces every disconnected tool with one intelligent system that grows with your service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain size={22} className="text-cr-gold" />,
                title: "Care plans in minutes, not hours",
                body: "AI drafts person-centred care plans from your assessment data. Your coordinator reviews, edits, and approves. CQC-compliant from day one.",
                ai: true,
                accent: "cr-gold",
              },
              {
                icon: <ShieldCheck size={22} className="text-cr-forest" />,
                title: "Know your inspection score today",
                body: "Live compliance score across all 5 CQC key questions and all 34 quality statements. Fix gaps before an inspector finds them.",
                accent: "cr-forest",
              },
              {
                icon: <AlertTriangle size={22} className="text-cr-red" />,
                title: "Every second matters in an emergency",
                body: "One-tap SOS cascades to managers, emergency contacts, and on-call staff simultaneously. Paramedics scan a QR code and get full medical details in 10 seconds.",
                emergency: true,
                accent: "cr-red",
              },
              {
                icon: <Heart size={22} className="text-cr-sage" />,
                title: "Families trust agencies that communicate",
                body: "Real-time visit updates, AI weekly briefings, meal records, and direct messaging. Families stay informed without calling your office.",
                accent: "cr-sage",
              },
              {
                icon: <UtensilsCrossed size={22} className="text-cr-gold" />,
                title: "Margaret only eats from blue plates",
                body: "Step-by-step meal instructions, cultural food preferences, allergy warnings, and appetite tracking. Person-centred care starts with knowing the details.",
                accent: "cr-gold",
              },
              {
                icon: <Smartphone size={22} className="text-cr-forest" />,
                title: "Works everywhere. Even underground.",
                body: "Fully offline-capable PWA. Carers complete visits, record medications, and write voice notes — all without signal. Data syncs automatically when back online.",
                accent: "cr-forest",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-card p-7 border border-gray-100 shadow-card hover:shadow-card-hover hover:border-cr-mint transition-all group">
                <div className="w-11 h-11 rounded-xl bg-cr-ivory flex items-center justify-center mb-5 group-hover:bg-cr-mint transition-colors">
                  {f.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-lg font-semibold text-cr-charcoal">{f.title}</h3>
                  {f.ai && (
                    <span className="px-2 py-0.5 bg-cr-gold/15 text-cr-gold text-xs font-body font-semibold rounded-full border border-cr-gold/20">
                      AI
                    </span>
                  )}
                </div>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features" className="inline-flex items-center gap-2 text-sm font-body font-semibold text-cr-forest hover:text-cr-sage transition-colors">
              See all features <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section className="bg-cr-charcoal py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cr-gold/20 text-cr-gold text-xs font-body font-semibold mb-6 border border-cr-gold/30">
                <Sparkles size={12} />
                AI-powered intelligence
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-5">
                Intelligence built in from day one.
              </h2>
              <p className="text-base font-body text-white/60 mb-10 leading-relaxed">
                Careroot AI works quietly in the background — spotting patterns, drafting documents, and surfacing concerns before they become crises.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "AI-generated person-centred care plan drafts",
                  "30-day risk pattern detection across visit history",
                  "Voice note transcription and automatic structuring",
                  "Weekly family briefings written in plain English",
                  "Appetite and fluid intake trend analysis",
                  "CQC compliance scoring with evidence gap identification",
                  "Paper care plan import and AI structuring",
                  "Safeguarding concern detection from visit note sentiment",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle size={15} className="text-cr-gold mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-body text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock AI risk flag card */}
            <div className="bg-[#0f2018] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-body font-semibold text-white/40 uppercase tracking-widest">AI Risk Flag</span>
                <span className="px-2.5 py-1 bg-cr-red/20 text-cr-red text-xs font-body font-bold rounded-full border border-cr-red/30">HIGH RISK</span>
              </div>
              <h4 className="font-display text-lg font-semibold text-white mb-2">Deteriorating appetite detected</h4>
              <p className="text-sm font-body text-white/60 mb-5 leading-relaxed">
                Margaret Davies has consumed less than 50% of meals at 9 of the last 11 visits. Fluid intake has averaged 420ml/day against a 1,200ml target.
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-5">
                <p className="text-xs font-body font-semibold text-white/40 uppercase tracking-widest mb-2">Evidence</p>
                <div className="space-y-1.5">
                  {[
                    "11 visit notes over 14 days analysed",
                    "Meal intake below 50% threshold: 9 visits",
                    "Fluid intake below daily target: 11 visits",
                  ].map((e) => (
                    <div key={e} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-cr-gold mt-2 flex-shrink-0" />
                      <span className="text-xs font-body text-white/50">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-cr-forest/30 border border-cr-forest/40 rounded-xl p-4">
                <p className="text-xs font-body font-semibold text-cr-gold mb-1">Recommended action</p>
                <p className="text-xs font-body text-white/60">Contact GP for nutritional assessment. Review fluid intake targets with care coordinator. Consider meal texture review.</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 rounded-lg bg-cr-forest text-white text-xs font-body font-semibold">Acknowledge</button>
                <button className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 text-xs font-body font-semibold">Mark resolved</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMERGENCY ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-cr-red text-xs font-body font-semibold mb-6 border border-red-100">
            <AlertCircle size={12} />
            No other platform has this
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5">
            When every second counts.
          </h2>
          <p className="text-base font-body text-cr-slate mb-14 max-w-xl">
            Every care agency will face a medical emergency. Most are not prepared. Careroot is.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: <AlertCircle size={32} className="text-cr-red" />,
                title: "One tap. Full cascade.",
                body: "A single tap triggers simultaneous SMS to the on-call manager with GPS coordinates, SMS to all emergency contacts, email to the GP, and an auto-created incident record — all in under 3 seconds.",
              },
              {
                icon: <QrCode size={32} className="text-cr-red" />,
                title: "Full medical record in 10 seconds.",
                body: "Every client has a QR code card for their fridge. Paramedics scan it, enter a 6-digit PIN, and instantly see medications, allergies, DNR status, GP details, and care plan summary. No login. No account.",
              },
              {
                icon: <Shield size={32} className="text-cr-red" />,
                title: "DNR status that cannot be missed.",
                body: "Do Not Resuscitate status displays as a red banner at the top of every screen — care plans, visit screens, paramedic access, family portal. Every person who touches that record sees it immediately.",
              },
            ].map((e) => (
              <div key={e.title} className="bg-white rounded-2xl p-7 border border-red-100 shadow-sm">
                <div className="mb-5">{e.icon}</div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">{e.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-cr-red rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-5">
            <p className="font-display text-xl md:text-2xl font-semibold text-white">
              Is your agency prepared for a medical emergency right now?
            </p>
            <Link
              href="/features#emergency"
              className="flex-shrink-0 bg-white text-cr-red rounded-xl px-6 py-3 font-body font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              See how Careroot handles emergencies →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPLAINTS + STAFF ── */}
      <section className="bg-cr-ivory py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-display text-3xl font-semibold text-cr-charcoal mb-4">
                CQC-ready complaints management
              </h3>
              <p className="text-sm font-body text-cr-slate mb-6 leading-relaxed">
                Every complaint is logged, tracked, and managed against the 28-day response requirement. Anonymous submissions, CQC escalation option, and full audit trail — all built in.
              </p>
              <ul className="space-y-3">
                {[
                  "Auto-generated reference numbers",
                  "28-day countdown with amber and red warnings",
                  "Anonymous submission always available",
                  "CQC escalation pathway always offered",
                  "Carers cannot see complaints made about them",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-cr-sage flex-shrink-0" />
                    <span className="text-sm font-body text-cr-charcoal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-3xl font-semibold text-cr-charcoal mb-4">
                Staff wellbeing and DBS compliance
              </h3>
              <p className="text-sm font-body text-cr-slate mb-6 leading-relaxed">
                Never miss a DBS renewal. Track mandatory training, monitor carer burnout risk, and maintain right-to-work records — all in one place.
              </p>
              <ul className="space-y-3">
                {[
                  "DBS expiry alerts at 90, 60, and 30 days",
                  "Burnout risk scoring from visit patterns",
                  "Training records with expiry tracking",
                  "Right-to-work document storage",
                  "Wellbeing score per carer",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-cr-sage flex-shrink-0" />
                    <span className="text-sm font-body text-cr-charcoal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* ── PRICING TEASER ── */}
      <section className="bg-cr-ivory py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cr-charcoal mb-3">
            Start free. Scale as you grow.
          </h2>
          <p className="text-sm font-body text-cr-slate mb-10">30-day free trial on all plans. No credit card required.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { name: "Seed", price: "£99", period: "/month", staff: "Up to 10 staff", highlight: false },
              { name: "Grow", price: "£349", period: "/month", staff: "Up to 50 staff", highlight: true },
              { name: "Scale", price: "£899", period: "/month", staff: "Up to 200 staff", highlight: false },
              { name: "Enterprise", price: "Custom", period: "", staff: "Unlimited staff", highlight: false },
            ].map((t) => (
              <div
                key={t.name}
                className={`rounded-card p-6 border ${
                  t.highlight ? "bg-cr-forest text-white border-cr-forest shadow-xl" : "bg-white border-gray-100 shadow-card"
                }`}
              >
                {t.highlight && (
                  <div className="flex justify-center mb-3">
                    <span className="px-2.5 py-0.5 bg-cr-gold text-white text-xs font-body font-bold rounded-full">Most popular</span>
                  </div>
                )}
                <h3 className={`font-display text-xl font-semibold mb-1 ${t.highlight ? "text-white" : "text-cr-charcoal"}`}>{t.name}</h3>
                <div className={`text-3xl font-display font-semibold ${t.highlight ? "text-white" : "text-cr-charcoal"}`}>
                  {t.price}
                  {t.period && <span className={`text-sm font-body font-normal ${t.highlight ? "text-white/60" : "text-cr-slate"}`}>{t.period}</span>}
                </div>
                <p className={`text-sm font-body mt-2 ${t.highlight ? "text-white/70" : "text-cr-slate"}`}>{t.staff}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-1.5 mt-7 text-sm font-body font-semibold text-cr-forest hover:text-cr-sage transition-colors">
            See full pricing and compare features <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-cr-forest py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-5">
            Ready to transform your care service?
          </h2>
          <p className="text-base font-body text-white/70 mb-10 max-w-lg mx-auto">
            Join care agencies across the UK. 30-day free trial. No credit card. Cancel any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/signup" className="bg-white text-cr-forest rounded-btn px-7 py-3.5 font-body font-semibold text-base hover:bg-cr-mint transition-colors">
              Start free trial — 30 days free
            </Link>
            <Link href="/demo" className="border border-white/40 text-white rounded-btn px-7 py-3.5 font-body font-semibold text-base hover:bg-white/10 transition-colors">
              Book a demo
            </Link>
          </div>
          <p className="text-sm font-body text-white/50">
            Questions? Email <a href="mailto:onboarding@careroot.co.uk" className="text-white/70 hover:text-white underline">onboarding@careroot.co.uk</a>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
