import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CheckCircle, Smartphone, MapPin, UtensilsCrossed, Heart, ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Careroot for Domiciliary Care Agencies — Home Care Software UK",
  description: "Care management software built for UK domiciliary care agencies. CQC compliance, offline carer app, family portal, eMAR, and emergency response.",
};

const PAIN_POINTS = [
  {
    headline: "Carers arrive unprepared",
    body: "Your carer is standing at the door. They do not know about the new allergy. They do not know the DNR status changed. They do not know Margaret only eats from the blue plates. Paper care plans left at the office cannot help them now.",
  },
  {
    headline: "No signal. No notes. No record.",
    body: "A rural visit. A basement flat. No wifi. Your carers need to complete visits, record medications, and write notes without internet. Most care apps fail here. Careroot does not.",
  },
  {
    headline: "Families calling constantly",
    body: "How was Mum this morning? Did she take her medication? Your coordinator spends an hour a day answering calls that a family portal would eliminate.",
  },
];

const SOLUTIONS = [
  { Icon: Smartphone, headline: "Offline-first carer app", body: "Before each shift Careroot caches everything for that day — care plans, meal steps, medications, task lists. Complete every visit without signal. Syncs automatically when back online." },
  { Icon: MapPin, headline: "GPS visit verification", body: "Carers check in and out with GPS captured automatically. Proof of attendance at every visit. Missed visit alerts at 15 minutes overdue — not when you notice the next morning." },
  { Icon: UtensilsCrossed, headline: "Step-by-step meal instructions", body: "Every meal preference captured in detail. How they like their eggs. Which mug. Which foods remind them of home. All on the carer's phone before they open the fridge." },
  { Icon: Heart, headline: "Family portal ends update calls", body: "Families see real-time visit status, full notes, medication records, and weekly AI briefings. They stop calling because they already know." },
  { Icon: ShieldCheck, headline: "CQC evidence from every visit", body: "Every note, medication record, and care plan view creates compliance evidence automatically. When CQC arrives you have a complete digital record." },
  { Icon: AlertTriangle, headline: "Emergency QR card on every fridge", body: "Every client gets a QR code and PIN card. Paramedics scan it and see medications, DNR status, allergies, and GP details in 10 seconds. No login. No delay.", iconColour: "#DC2626" },
];

const LEFT_CHECKS = [
  "6-step client onboarding wizard",
  "AI care plan generation and drafting",
  "Offline-capable carer mobile app",
  "GPS check-in and check-out",
  "Missed visit alerts at 15 minutes",
  "Voice note transcription",
  "Step-by-step meal instructions",
  "Appetite and fluid intake tracking",
];
const RIGHT_CHECKS = [
  "Electronic medication records eMAR",
  "Emergency SOS cascade",
  "Paramedic QR card access",
  "Family portal with real-time updates",
  "Weekly AI family briefings",
  "CQC compliance dashboard",
  "28-day complaint tracker",
  "DBS tracking and renewal alerts",
];

export default function DomiciliaryPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#1A3C2E] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-white/10 text-white mb-6">Domiciliary Care</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white mb-5 leading-tight">Run a better home care agency.</h1>
          <p className="text-lg text-white/80 font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            From first client assessment to CQC inspection day — Careroot manages every part of your domiciliary care service. Your carers, your clients, your families, your compliance. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#1A3C2E] font-medium rounded-lg px-6 py-3 hover:bg-white/90 transition-colors">Start free trial</Link>
            <Link href="/demo" className="border border-white/60 text-white font-medium rounded-lg px-6 py-3 hover:bg-white/10 transition-colors">Book a demo</Link>
          </div>
          <p className="text-white/60 text-sm mt-4">30 days free · No credit card required</p>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-cr-ivory py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">We know what home care agencies struggle with.</h2>
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

      {/* Solutions */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">Built specifically for how home care works.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SOLUTIONS.map(({ Icon, headline, body, iconColour }) => (
              <div key={headline}>
                <Icon size={28} style={{ color: iconColour ?? "#1A3C2E" }} />
                <h3 className="font-body font-semibold text-lg text-[#1C1C1E] mt-3 mb-2">{headline}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="bg-[#E8F5EE] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-10">Everything a domiciliary agency needs.</h2>
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

      {/* CTA */}
      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Ready to run a better home care agency?</h2>
          <p className="text-lg text-white/80 font-body mb-8">Start free for 30 days. Set up your first client today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#1A3C2E] font-medium rounded-lg px-8 py-3 hover:bg-white/90 transition-colors">Start free trial</Link>
            <Link href="/demo" className="border border-white/60 text-white font-medium rounded-lg px-8 py-3 hover:bg-white/10 transition-colors">Book a demo</Link>
          </div>
          <p className="text-white/60 text-sm mt-4">Seed plan from £99/month · Up to 10 staff · 30-day free trial</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
