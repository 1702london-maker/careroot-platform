"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Can I use Careroot before I am CQC registered?",
    a: "Yes. Many agencies use Careroot during the registration process as evidence of their digital readiness. CQC assessors view a well-configured digital system as positive evidence of a well-led organisation.",
  },
  {
    q: "Does Careroot help with the CQC application itself?",
    a: "Careroot gives you the compliance infrastructure CQC expects. We do not complete the application on your behalf but our guide covers every step of the process. Read it at careroot.care/solutions/cqc-registration",
  },
  {
    q: "What if I only have 1 or 2 clients to start?",
    a: "Perfect. Add them through the onboarding wizard, generate their care plans, assign your first carer. There is no minimum. Careroot works from day one client.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button className="w-full flex items-center justify-between py-5 text-left" onClick={() => setOpen(!open)}>
        <span className="text-base font-body font-medium text-[#1C1C1E]">{q}</span>
        <ChevronDown size={18} className={`text-[#6B7280] transition-transform flex-shrink-0 ml-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-5 text-sm text-[#6B7280] font-body leading-relaxed">{a}</p>}
    </div>
  );
}

export default function NewAgenciesPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      <section className="bg-cr-ivory py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-cr-gold/10 text-cr-gold border border-cr-gold/20 mb-6">New Care Agencies</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-cr-charcoal mb-5 leading-tight">From zero to CQC registered.</h1>
          <p className="text-lg text-cr-slate font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            Starting a care agency is one of the most complex regulatory journeys in UK business. Careroot was built by people who went through it — and designed to make it easier for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-cr-forest text-white font-medium rounded-lg px-6 py-3 hover:bg-cr-sage transition-colors">Start free trial</Link>
            <Link href="/demo" className="border border-[#1A3C2E] text-[#1A3C2E] font-medium rounded-lg px-6 py-3 hover:bg-cr-mint transition-colors">Book a demo</Link>
          </div>
          <p className="text-cr-slate text-sm mt-4">30 days free · No credit card required</p>
        </div>
      </section>

      {/* Journey steps */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {[
            {
              n: "1",
              headline: "Before CQC even visits",
              body: "CQC assesses your systems and readiness before granting registration. Show up with a professional digital system — not paper folders.",
              pills: ["Live CQC readiness score", "Care plan templates", "DBS tracking from day one", "Complaints procedure built in"],
            },
            {
              n: "2",
              headline: "Your first clients deserve the best start",
              body: "The 6-step onboarding wizard captures every detail. Medical history, cultural background, emergency contacts, food preferences, step-by-step meal instructions, risk assessments. AI generates the care plan. You review and approve. CQC-compliant from the very first client.",
              pills: [],
            },
            {
              n: "3",
              headline: "As your team grows",
              body: "Add staff, track their DBS, assign them to clients, manage the rota. Set up the family portal so families trust you from the first visit. Careroot scales with you from 1 carer to 200.",
              pills: [],
            },
          ].map(({ n, headline, body, pills }) => (
            <div key={n} className="flex gap-8">
              <div className="flex-shrink-0">
                <span className="font-display text-8xl font-light text-[#1A3C2E]/10 leading-none">{n}</span>
              </div>
              <div>
                <h2 className="font-display text-3xl text-[#1C1C1E] mb-3">{headline}</h2>
                <p className="text-base text-[#6B7280] font-body leading-relaxed mb-4">{body}</p>
                {pills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pills.map((p) => (
                      <span key={p} className="px-3 py-1 rounded-full text-sm font-body bg-[#E8F5EE] text-[#1A3C2E]">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seed plan callout */}
      <section className="bg-cr-ivory py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#E8F5EE] rounded-xl p-8 border-l-4 border-[#1A3C2E]">
            <p className="text-xs font-body font-semibold text-[#1A3C2E] uppercase tracking-wide mb-3">Perfect for new care agencies</p>
            <h2 className="font-display text-4xl text-[#1C1C1E] mb-4">Seed plan — £99/month</h2>
            <p className="text-sm text-[#6B7280] font-body leading-relaxed mb-6">
              Up to 10 staff. Everything you need to get CQC registered and deliver excellent care from day one. Includes AI care planning, CQC compliance dashboard, mobile carer app, family portal, and emergency response.
            </p>
            <Link href="/signup" className="inline-block bg-[#1A3C2E] text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-[#4A7C5E] transition-colors">
              Start free trial
            </Link>
            <p className="text-sm text-[#6B7280] mt-3">30-day free trial · No credit card required</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-[#1C1C1E] mb-8">Common questions from new agencies</h2>
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Start as you mean to go on.</h2>
          <p className="text-lg text-white/80 font-body mb-8">Professional. Compliant. CQC-ready. From day one.</p>
          <Link href="/signup" className="inline-block bg-white text-[#1A3C2E] font-medium rounded-lg px-8 py-3 hover:bg-white/90 transition-colors">
            Start free trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
