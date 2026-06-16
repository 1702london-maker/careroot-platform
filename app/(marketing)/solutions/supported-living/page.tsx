import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CheckCircle, User, MessageCircle, BookOpen, Shield, Heart, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Careroot for Supported Living Providers — Learning Disability and Mental Health Care Software",
  description: "Care management for supported living providers. Person-centred, CQC compliant, and fully digital.",
};

const PAIN_POINTS = [
  { headline: "New support workers don't know the person", body: "High turnover is a reality. A new worker arrives and has never met the person they are supporting. Paper files take an hour to read. Careroot puts everything they need on their phone in two minutes." },
  { headline: "Support plans that never get updated", body: "A plan written six months ago describes the person as they were then. Careroot captures every interaction so the plan reflects who the person is right now." },
  { headline: "CQC wants genuine person-centred evidence", body: "Inspectors know the difference between a template and evidence that a support worker genuinely knows and respects the person they support. Careroot creates that evidence." },
];

const SOLUTIONS = [
  { Icon: User, headline: "Capture the whole person", body: "Communication needs, cultural background, preferred routines, loved foods, what makes them anxious, what makes them happy. Every worker sees this before their first shift." },
  { Icon: MessageCircle, headline: "Communication needs front and centre", body: "Makaton, PECS, easy read, specific communication aids — all documented and visible on the app during every interaction." },
  { Icon: BookOpen, headline: "Behaviour notes from every visit", body: "What triggered difficulty. What helped. What they enjoyed. Captured after every visit, visible to all support workers. A living picture that builds over time." },
  { Icon: Shield, headline: "Safeguarding built in", body: "AI flags safeguarding concerns in visit notes automatically. Every incident categorised and tracked. Full audit trail for every concern raised." },
  { Icon: Heart, headline: "Family and advocate access", body: "Families and advocates get their own portal. Full visibility, weekly briefings, and direct messaging with the support team. The people who matter most stay involved." },
  { Icon: ShieldCheck, headline: "CQC Caring and Responsive evidence", body: "Every preference honoured. Every communication need met. Every routine respected. Careroot creates the evidence that your service genuinely cares." },
];

const LEFT_CHECKS = [
  "Communication needs capture",
  "Behaviour support note logging",
  "Cultural and personal preferences",
  "Safeguarding concern auto-flagging",
  "Mental capacity notes",
  "Daily living skills tracking",
  "Routine documentation",
  "AI risk pattern detection",
];
const RIGHT_CHECKS = [
  "Family and advocate portal",
  "CQC Caring evidence dashboard",
  "Person-centred care plan templates",
  "Voice notes from support workers",
  "Incident management and tracking",
  "Complaints system",
  "Staff DBS and training records",
  "Offline mobile app",
];

export default function SupportedLivingPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      <section className="bg-[#1A3C2E] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-white/10 text-white mb-6">Supported Living</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white mb-5 leading-tight">Person-centred care. Properly documented.</h1>
          <p className="text-lg text-white/80 font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            Supported living demands the highest standard of person-centred documentation. Careroot captures every detail — preferences, routines, communication needs, and what matters most to each person you support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#1A3C2E] font-medium rounded-lg px-6 py-3 hover:bg-white/90 transition-colors">Start free trial</Link>
            <Link href="/demo" className="border border-white/60 text-white font-medium rounded-lg px-6 py-3 hover:bg-white/10 transition-colors">Book a demo</Link>
          </div>
          <p className="text-white/60 text-sm mt-4">30 days free · No credit card required</p>
        </div>
      </section>

      <section className="bg-cr-ivory py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">We know what supported living providers face.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <div key={p.headline} className="bg-white rounded-xl p-6 border-l-4 border-[#DC2626] shadow-sm">
                <h3 className="font-body font-semibold text-lg text-[#1C1C1E] mb-2">{p.headline}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">Built for the people you support.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SOLUTIONS.map(({ Icon, headline, body }) => (
              <div key={headline}>
                <Icon size={28} style={{ color: "#1A3C2E" }} />
                <h3 className="font-body font-semibold text-lg text-[#1C1C1E] mt-3 mb-2">{headline}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#E8F5EE] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-10">Everything a supported living provider needs.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              {LEFT_CHECKS.map((c) => (
                <div key={c} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-[#1A3C2E] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1C1C1E] font-body">{c}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {RIGHT_CHECKS.map((c) => (
                <div key={c} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-[#1A3C2E] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1C1C1E] font-body">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Support the whole person. Document it properly.</h2>
          <p className="text-lg text-white/80 font-body mb-8">Start free · £99/month after trial</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#1A3C2E] font-medium rounded-lg px-8 py-3 hover:bg-white/90 transition-colors">Start free trial</Link>
            <Link href="/demo" className="border border-white/60 text-white font-medium rounded-lg px-8 py-3 hover:bg-white/10 transition-colors">Book a demo</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
