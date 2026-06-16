import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CheckCircle, FileText, Calendar, Heart, ShieldCheck, UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = {
  title: "Careroot for Residential Care Homes — Digital Care Management UK",
  description: "Digital care management for UK care homes and nursing homes. CQC compliance, eMAR, digital shift handover, and family engagement.",
};

const PAIN_POINTS = [
  { headline: "Shift handovers that lose information", body: "The night shift mentions the fall to the day shift. Or they forget. Verbal handovers leave gaps that become complaints and serious incidents." },
  { headline: "Paper MAR charts that go wrong", body: "Corrections over corrections. A missing signature. A medication given twice because two carers assumed the other had not done it. eMAR eliminates all of this completely." },
  { headline: "Families who feel shut out", body: "Families drive an hour to visit and spend 15 minutes asking questions your staff cannot fully answer. They leave worried. Careroot gives them answers before they arrive." },
];

const SOLUTIONS = [
  { Icon: FileText, headline: "Digital shift handover", body: "Every note from a shift is instantly visible to the incoming team. No verbal handover gaps. No forgotten incidents. Everything documented and searchable." },
  { Icon: ShieldCheck, headline: "eMAR replaces paper MAR charts", body: "Record every medication as given, refused, or unavailable. Real-time alerts for missed doses. Complete medication history per resident. Exportable for audits." },
  { Icon: Calendar, headline: "Rota for large teams", body: "Drag-and-drop scheduling for complex shift patterns. Double-booking prevention. Instant notification when rota changes. DBS compliance across your whole team." },
  { Icon: Heart, headline: "Residents family portal", body: "Families see daily notes, medication records, meal logs, and weekly AI briefings. They feel connected without calling your reception three times a week." },
  { Icon: ShieldCheck, headline: "CQC evidence from every shift", body: "Every interaction documented. Every medication recorded. Every incident logged with investigation trail. Complete when CQC arrives." },
  { Icon: UtensilsCrossed, headline: "Nutrition and meal records", body: "What each resident ate at every meal. Fluid intake per day. Appetite decline flagged by AI before it becomes a clinical concern." },
];

const LEFT_CHECKS = [
  "Digital shift handover notes",
  "eMAR for medication rounds",
  "Resident care plans with AI drafting",
  "Nutrition and meal tracking",
  "Incident management",
  "Complaints with 28-day tracker",
  "Family portal",
  "Emergency QR cards",
];
const RIGHT_CHECKS = [
  "Large team rota management",
  "DBS tracking for all staff",
  "Training records and expiry alerts",
  "CQC five key questions dashboard",
  "Ofsted module on Scale and Enterprise",
  "AI risk flag detection",
  "Burnout monitoring for staff",
  "Compliance evidence library",
];

export default function ResidentialPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      <section className="bg-[#1A3C2E] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-white/10 text-white mb-6">Residential Care</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white mb-5 leading-tight">Your whole care home. One platform.</h1>
          <p className="text-lg text-white/80 font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            From morning medication rounds to evening shift handover — Careroot gives your care home a complete digital backbone. Every resident. Every carer. Every shift.
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
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">The problems care homes face every day.</h2>
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
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">Built for residential care.</h2>
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
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-10">Everything a care home needs.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              {LEFT_CHECKS.map((c) => (<div key={c} className="flex items-start gap-3"><CheckCircle size={16} className="text-[#1A3C2E] mt-0.5 flex-shrink-0" /><span className="text-sm text-[#1C1C1E] font-body">{c}</span></div>))}
            </div>
            <div className="space-y-3">
              {RIGHT_CHECKS.map((c) => (<div key={c} className="flex items-start gap-3"><CheckCircle size={16} className="text-[#1A3C2E] mt-0.5 flex-shrink-0" /><span className="text-sm text-[#1C1C1E] font-body">{c}</span></div>))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Every shift. Every resident. Every interaction. Documented.</h2>
          <p className="text-lg text-white/80 font-body mb-8">30-day free trial on all plans.</p>
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
