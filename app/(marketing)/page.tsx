import Link from "next/link";
import {
  Brain, ShieldCheck, AlertTriangle, Heart, Smartphone,
  CheckCircle, Shield, QrCode, UtensilsCrossed, Clock,
  Users, FileText, Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="bg-[#F9F7F4] pt-24 pb-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F5EE] text-[#1A3C2E] text-xs font-semibold rounded-full px-4 py-1.5 mb-8 border border-[#1A3C2E]/10">
            <Shield size={11} />
            Built for CQC 2026 Single Assessment Framework
          </div>
          <h1 className="font-display font-bold text-[38px] md:text-[52px] leading-[1.1] tracking-tight text-[#1C1C1E] max-w-4xl mx-auto mb-6">
            The care platform that works as hard as your team.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto mb-10">
            AI-powered care management, CQC compliance, emergency response, and family engagement — built specifically for UK care agencies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/signup"
              className="bg-[#1A3C2E] text-white px-8 py-3.5 rounded-[8px] font-semibold text-base hover:bg-[#4A7C5E] transition-colors w-full sm:w-auto text-center"
            >
              Start free trial
            </Link>
            <Link
              href="/demo"
              className="border-2 border-[#1A3C2E] text-[#1A3C2E] px-8 py-3.5 rounded-[8px] font-semibold text-base hover:bg-[#E8F5EE] transition-colors w-full sm:w-auto text-center"
            >
              Book a demo
            </Link>
          </div>
          <p className="text-sm text-[#6B7280]/70">
            30 days free · No credit card · Set up in under an hour
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {["🔒 NHS-grade security", "✓ CQC 2026 compliant", "📱 Works offline on any device"].map((b) => (
              <span key={b} className="bg-white border border-[#E8F5EE] rounded-full px-4 py-2 text-sm font-medium text-[#1C1C1E]">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFIT CARDS ── */}
      <section className="bg-[#E8F5EE] py-14 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: "CQC 2026 Ready", body: "Built around the CQC Single Assessment Framework from day one — not retrofitted to meet it." },
            { icon: Smartphone, title: "Works Offline", body: "The carer app caches everything before each shift. Complete visits with no signal. Syncs automatically." },
            { icon: Clock, title: "Set Up in Under an Hour", body: "Add your organisation, invite your first carer, onboard your first client. No IT team required." },
            { icon: Heart, title: "30-Day Free Trial", body: "Every plan. Every feature. No credit card. No commitment. Cancel any time." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-[12px] p-6 border border-[#E8F5EE]/50">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center mb-4">
                <Icon size={16} className="text-[#1A3C2E]" />
              </div>
              <h3 className="font-semibold text-base text-[#1C1C1E] mb-1">{title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">
            The Problem
          </p>
          <h2 className="font-display font-bold text-[32px] leading-[40px] text-[#1C1C1E] max-w-xl mb-4">
            Care agencies are drowning in paperwork.
          </h2>
          <p className="text-base text-[#6B7280] leading-relaxed max-w-lg mb-14">
            Every minute on admin is a minute not spent on care. Your carers deserve better tools. Your clients deserve better care.
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
                body: "They don't know about the DNR. The allergy. That Margaret only eats from the blue plates and hates the smell of fish. That's not care. That's a risk.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-[12px] p-6 border border-gray-100 border-l-4 border-l-[#DC2626] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <h3 className="font-semibold text-lg text-[#1C1C1E] mb-3">{card.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">
            The Platform
          </p>
          <h2 className="font-display font-bold text-[32px] leading-[40px] text-[#1C1C1E] max-w-2xl mb-4">
            One platform. Every role. Every need.
          </h2>
          <p className="text-base text-[#6B7280] leading-relaxed max-w-xl mb-14">
            Careroot replaces every disconnected tool with one intelligent system that grows with your service.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { tag: "AI", tagCls: "bg-[#C9A84C]/10 text-[#C9A84C]", icon: Brain, title: "Care plans in minutes, not hours", body: "AI drafts person-centred care plans from your assessment data. Your coordinator reviews, edits, and approves. CQC-compliant from day one." },
              { tag: "✓", tagCls: "bg-[#E8F5EE] text-[#1A3C2E]", icon: ShieldCheck, title: "Know your inspection score today", body: "Live compliance score across all 5 CQC key questions and all 34 quality statements. Fix gaps before an inspector finds them." },
              { tag: "🚨", tagCls: "bg-red-50 text-[#DC2626]", icon: AlertTriangle, title: "Every second matters in an emergency", body: "One-tap SOS cascades to managers, emergency contacts, and on-call staff simultaneously. Paramedics get full medical records in 10 seconds." },
              { tag: "♥", tagCls: "bg-[#E8F5EE] text-[#1A3C2E]", icon: Heart, title: "Families trust agencies that communicate", body: "Real-time visit updates, AI weekly briefings, meal records, and direct messaging. Families stay informed without calling your office." },
              { tag: "🍽", tagCls: "bg-[#E8F5EE] text-[#4A7C5E]", icon: UtensilsCrossed, title: "Margaret only eats from blue plates", body: "Step-by-step meal instructions, cultural food preferences, allergy warnings, and appetite tracking. Person-centred care starts with knowing the details." },
              { tag: "📱", tagCls: "bg-[#E8F5EE] text-[#1A3C2E]", icon: Smartphone, title: "Works everywhere. Even underground.", body: "Fully offline-capable PWA. Carers complete visits, record medications, and write voice notes — all without signal. Syncs automatically when back online." },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200"
              >
                <span className={`inline-block text-xs font-bold rounded-md px-2 py-1 mb-4 ${f.tagCls}`}>
                  {f.tag}
                </span>
                <h3 className="font-semibold text-lg text-[#1C1C1E] leading-snug mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features" className="text-[#1A3C2E] font-semibold text-sm hover:text-[#4A7C5E] transition-colors">
              See all features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section className="bg-[#1C1C1E] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[2px] text-[#C9A84C] mb-3">
                AI-powered intelligence
              </p>
              <h2 className="font-display font-bold text-[44px] leading-[52px] text-white mb-4">
                Intelligence built in from day one.
              </h2>
              <p className="text-lg text-white/60 leading-relaxed mb-10">
                Careroot AI works quietly in the background — spotting patterns, drafting documents, and surfacing concerns before they become crises.
              </p>
              <div className="space-y-3">
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
                    <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock AI Risk Flag */}
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-wide">AI Risk Flag</span>
                <span className="bg-[#DC2626]/20 text-[#DC2626] text-xs font-bold px-2.5 py-1 rounded-full">HIGH RISK</span>
              </div>
              <h4 className="text-white font-semibold text-base mb-2">
                Deteriorating appetite detected
              </h4>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                Margaret Davies has consumed less than 50% of meals at 9 of the last 11 visits. Fluid intake has averaged 420ml/day against a 1,200ml target.
              </p>
              <div className="border-t border-white/10 pt-4 mb-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Evidence</p>
                <ul className="space-y-1.5">
                  {["11 visit notes over 14 days analysed", "Meal intake below 50% threshold: 9 visits", "Fluid intake below daily target: 11 visits"].map((e) => (
                    <li key={e} className="text-white/60 text-xs flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Recommended action</p>
              <p className="text-white/60 text-xs mb-5">Contact GP for nutritional assessment. Review fluid intake targets with care coordinator. Consider meal texture review.</p>
              <div className="flex gap-2">
                <button className="bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-[8px] hover:bg-white/20 transition-colors">
                  Acknowledge
                </button>
                <button className="bg-[#1A3C2E] text-white text-xs font-semibold px-3 py-2 rounded-[8px] hover:bg-[#4A7C5E] transition-colors">
                  Mark resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMERGENCY ── */}
      <section className="bg-[#1C1C1E] border-t border-white/5 py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#DC2626] mb-3">
            No other platform has this
          </p>
          <h2 className="font-display font-bold text-[44px] leading-[52px] text-white max-w-2xl mb-4">
            When every second counts.
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-xl mb-14">
            Every care agency will face a medical emergency. Most are not prepared. Careroot is.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[
              { title: "One tap. Full cascade.", body: "A single tap triggers simultaneous SMS to the on-call manager with GPS coordinates, SMS to all emergency contacts, email to the GP, and an auto-created incident record — all in under 3 seconds." },
              { title: "Full medical record in 10 seconds.", body: "Every client has a QR code card for their fridge. Paramedics scan it, enter a 6-digit PIN, and instantly see medications, allergies, DNR status, GP details, and care plan summary. No login. No account." },
              { title: "DNR status that cannot be missed.", body: "Do Not Resuscitate status displays as a red banner at the top of every screen — care plans, visit screens, paramedic access, family portal. Every person who touches that record sees it immediately." },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-[#DC2626]/20 rounded-[16px] p-6">
                <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626] mb-4" />
                <h3 className="font-semibold text-lg text-white leading-snug mb-3">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-[12px] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-white/80 text-sm font-medium">Is your agency prepared for a medical emergency right now?</p>
            <Link href="/features#emergency" className="text-[#DC2626] text-sm font-semibold hover:text-red-400 transition-colors whitespace-nowrap">
              See how Careroot handles emergencies →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPLAINTS + STAFF ── */}
      <section className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">Compliance</p>
            <h3 className="font-display font-bold text-[32px] leading-[40px] text-[#1C1C1E] mb-4">
              CQC-ready complaints management
            </h3>
            <p className="text-[#6B7280] leading-relaxed mb-6">
              Every complaint is logged, tracked, and managed against the 28-day response requirement. Anonymous submissions, CQC escalation option, and full audit trail — all built in.
            </p>
            <ul className="space-y-2.5">
              {["Auto-generated reference numbers", "28-day countdown with amber and red warnings", "Anonymous submission always available", "CQC escalation pathway always offered", "Carers cannot see complaints made about them"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#6B7280]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">People</p>
            <h3 className="font-display font-bold text-[32px] leading-[40px] text-[#1C1C1E] mb-4">
              Staff wellbeing and DBS compliance
            </h3>
            <p className="text-[#6B7280] leading-relaxed mb-6">
              Never miss a DBS renewal. Track mandatory training, monitor carer burnout risk, and maintain right-to-work records — all in one place.
            </p>
            <ul className="space-y-2.5">
              {["DBS expiry alerts at 90, 60, and 30 days", "Burnout risk scoring from visit patterns", "Training records with expiry tracking", "Right-to-work document storage", "Wellbeing score per carer"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#6B7280]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">Simple pricing</p>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-12">
            Start free. Scale as you grow.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Seed", price: "£99", period: "/mo", staff: "Up to 10 staff", highlight: false },
              { name: "Grow", price: "£349", period: "/mo", staff: "Up to 50 staff", highlight: true },
              { name: "Scale", price: "£899", period: "/mo", staff: "Up to 200 staff", highlight: false },
              { name: "Enterprise", price: "Custom", period: "", staff: "Unlimited staff", highlight: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[16px] p-6 relative ${plan.highlight ? "bg-[#1A3C2E] text-white" : "bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <p className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-white/70" : "text-[#6B7280]"}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`font-bold text-[36px] leading-none ${plan.highlight ? "text-white" : "text-[#1C1C1E]"}`}>{plan.price}</span>
                  {plan.period && <span className={`text-base ${plan.highlight ? "text-white/60" : "text-[#6B7280]"}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-5 ${plan.highlight ? "text-white/70" : "text-[#6B7280]"}`}>{plan.staff}</p>
                <Link
                  href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                  className={`block w-full text-center font-semibold text-sm py-2.5 rounded-[8px] transition-colors ${plan.highlight ? "bg-white text-[#1A3C2E] hover:bg-[#E8F5EE]" : "bg-[#1A3C2E] text-white hover:bg-[#4A7C5E]"}`}
                >
                  {plan.name === "Enterprise" ? "Contact us" : "Start free trial"}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-[#1A3C2E] font-semibold text-sm hover:text-[#4A7C5E] transition-colors">
              See full pricing and compare features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-[#1A3C2E] py-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-[44px] leading-[52px] text-white mb-4">
            Ready to transform your care service?
          </h2>
          <p className="text-lg text-white/70 mb-10">
            Join care agencies across the UK. 30-day free trial. No credit card. Cancel any time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-white text-[#1A3C2E] hover:bg-[#E8F5EE] font-semibold px-8 py-3.5 rounded-[8px] transition-colors w-full sm:w-auto text-center">
              Start free trial — 30 days free
            </Link>
            <Link href="/demo" className="border-2 border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-[8px] transition-colors w-full sm:w-auto text-center">
              Book a demo
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Questions? Email onboarding@careroot.co.uk or WhatsApp +44 7493 099125
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
