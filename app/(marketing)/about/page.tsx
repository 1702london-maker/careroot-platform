import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Brain, Shield, AlertTriangle, Heart,
  UtensilsCrossed, Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Careroot — Our Mission, Our Team, Our Future",
  description:
    "Careroot is built by people who believe care workers deserve better tools and the people they support deserve better care. Our story, our mission, and where we are heading.",
};

const PLATFORM_CARDS = [
  {
    Icon: Brain,
    colour: "text-cr-forest",
    headline: "AI that works for care",
    body: "Not AI for its own sake. AI that drafts care plans, spots deterioration patterns, and flags concerns — so coordinators can focus on people, not paperwork.",
  },
  {
    Icon: Shield,
    colour: "text-cr-forest",
    headline: "Compliance as a byproduct",
    body: "When care is documented well, compliance evidence creates itself. CQC inspectors see what happens every day — not what was prepared the week before their visit.",
  },
  {
    Icon: AlertTriangle,
    colour: "text-cr-red",
    headline: "Emergency response that works",
    body: "Every client has a QR card on their fridge. Paramedics scan it. Full medical record in 10 seconds. No login. No delay. This feature exists nowhere else in the market.",
  },
  {
    Icon: Heart,
    colour: "text-cr-forest",
    headline: "Families as partners",
    body: "Families are not an afterthought. They are part of the care team. Careroot gives them real visibility, real communication, and a real voice.",
  },
  {
    Icon: UtensilsCrossed,
    colour: "text-cr-forest",
    headline: "The whole person",
    body: "Margaret only eats from the blue plates. That detail matters. Careroot captures it and puts it in front of every carer, every visit.",
  },
  {
    Icon: Globe,
    colour: "text-cr-forest",
    headline: "Built for the UK",
    body: "CQC 2026 Single Assessment Framework. Ofsted compliance. UK data residency. Built for UK regulation, UK care types, and UK care workers from day one.",
  },
];

const ROADMAP = [
  {
    pill: { label: "Live now", className: "bg-cr-mint text-cr-forest" },
    headline: "Complete care management platform",
    body: "AI care planning, CQC compliance, carer mobile app, family portal, emergency response, nutrition planning, eMAR, complaints management, DBS tracking, rota scheduling. Everything a care agency needs from day one.",
  },
  {
    pill: { label: "In development", className: "bg-amber-50 text-amber-700" },
    headline: "GP Connect integration",
    body: "Seamless connection to GP records so carers and care managers have full clinical context without hours of back-and-forth phone calls.",
  },
  {
    pill: { label: "On the roadmap", className: "bg-gray-50 text-gray-600" },
    headline: "Predictive health intelligence",
    body: "Moving from flagging what has happened to predicting what will happen. Using aggregated, anonymised care data to identify population-level health patterns and help commissioners plan better services.",
  },
];

const ROLES = [
  {
    title: "Senior Full Stack Engineer",
    type: "Full time · Remote",
    body: "Next.js, TypeScript, Supabase. Building the core platform that care agencies across the UK depend on every day.",
    subject: "Application: Senior Full Stack Engineer",
  },
  {
    title: "Care Sector Customer Success",
    type: "Full time · UK-based",
    body: "You understand care. You understand software. You help agencies get the most from Careroot and build relationships that matter.",
    subject: "Application: Customer Success",
  },
  {
    title: "Care Sector Sales",
    type: "Full time · UK-based",
    body: "Not a hard sell. You understand registered managers and operations directors. You help them see what Careroot can do for their service.",
    subject: "Application: Care Sector Sales",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="bg-cr-ivory py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-body font-semibold uppercase tracking-widest text-cr-forest mb-4">
            About Careroot
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold text-cr-charcoal leading-tight max-w-3xl">
            Built by people who believe care can be better.
          </h1>
          <p className="text-xl font-body text-cr-slate max-w-2xl leading-relaxed mt-6">
            Careroot exists because too many care agencies are still managing the most important work in the world with paper, spreadsheets, and disconnected systems. We are changing that.
          </p>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-forest mb-4">
              Our Mission
            </p>
            <h2 className="font-display text-4xl md:text-[44px] font-semibold text-cr-charcoal leading-tight mb-8">
              Technology that serves the people who serve others.
            </h2>
            <div className="space-y-5 text-base font-body text-cr-slate leading-relaxed">
              <p>
                Care workers are some of the most important people in our society. They show up every day — in people&rsquo;s homes, in care homes, in supported living services — and do work that most of us could not imagine doing. They deserve tools that respect the complexity and importance of what they do.
              </p>
              <p>
                The people they support deserve to be known. Not as a record number or a care category — but as a whole person with preferences, memories, relationships, and dignity. Careroot is built to capture that wholeness and put it in the hands of every person who provides care.
              </p>
              <p>
                We built Careroot because we experienced the gap between what care should look like and what the tools available allowed it to be. We are closing that gap.
              </p>
            </div>
          </div>

          {/* Right — pull quote */}
          <div className="border-l-[3px] border-cr-forest pl-8 pt-2">
            <blockquote className="font-display text-[28px] text-cr-charcoal italic leading-relaxed">
              &ldquo;Care is not an industry. It is a human act. The technology supporting it should honour that.&rdquo;
            </blockquote>
            <p className="font-body text-sm text-cr-slate mt-6">
              — Careroot founding principle
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT WE ARE BUILDING ── */}
      <section className="bg-cr-mint py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-forest mb-4">
              What We Are Building
            </p>
            <h2 className="font-display text-4xl md:text-[44px] font-semibold text-cr-charcoal leading-tight mb-4">
              A platform for the whole care ecosystem.
            </h2>
            <p className="text-lg font-body text-cr-slate max-w-2xl mx-auto leading-relaxed">
              Careroot is not a form-filling tool. It is a care intelligence platform — one that connects carers, managers, families, and emergency services around the people who matter most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_CARDS.map(({ Icon, colour, headline, body }) => (
              <div key={headline} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <Icon size={28} className={colour} />
                <h3 className="font-body font-semibold text-base text-cr-charcoal mt-3 mb-2">{headline}</h3>
                <p className="font-body text-sm text-cr-slate leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-forest mb-4">
            Our Roadmap
          </p>
          <h2 className="font-display text-4xl md:text-[44px] font-semibold text-cr-charcoal leading-tight mb-14">
            Where Careroot is going.
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-cr-forest/20" />

            <div className="space-y-12">
              {ROADMAP.map(({ pill, headline, body }) => (
                <div key={headline} className="flex gap-8 relative">
                  {/* Dot */}
                  <div className="w-8 h-8 rounded-full bg-cr-forest flex-shrink-0 flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                  {/* Content */}
                  <div className="pt-0.5 pb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-body font-semibold uppercase tracking-wide mb-3 ${pill.className}`}>
                      {pill.label}
                    </span>
                    <h3 className="font-body font-semibold text-lg text-cr-charcoal mb-2">{headline}</h3>
                    <p className="font-body text-sm text-cr-slate leading-relaxed max-w-xl">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN US ── */}
      <section className="bg-cr-forest py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-mint mb-4">
            Join The Team
          </p>
          <h2 className="font-display text-4xl md:text-[48px] font-semibold text-white leading-tight mb-4 max-w-3xl">
            We are looking for people who care about care.
          </h2>
          <p className="text-lg font-body text-white/80 max-w-2xl mb-12 leading-relaxed">
            Careroot is a small team building something important. We are looking for people who combine technical excellence with genuine belief that technology can improve how care is delivered in the UK.
          </p>

          {/* TODO: update with real open roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {ROLES.map(({ title, type, body, subject }) => (
              <div key={title} className="bg-white/10 border border-white/20 rounded-xl p-6 flex flex-col">
                <span className="inline-block text-xs font-body font-semibold text-white/60 uppercase tracking-wide mb-3">
                  {type}
                </span>
                <h3 className="font-body font-semibold text-white text-base mb-3">{title}</h3>
                <p className="font-body text-sm text-white/70 leading-relaxed flex-1 mb-5">{body}</p>
                <a
                  href={`mailto:onboarding@careroot.co.uk?subject=${encodeURIComponent(subject)}`}
                  className="block text-center text-sm font-body font-semibold text-cr-forest bg-white rounded-lg py-2.5 hover:bg-cr-mint transition-colors"
                >
                  Apply
                </a>
              </div>
            ))}
          </div>

          <p className="font-body text-sm text-white/70">
            Don&rsquo;t see a role that fits?{" "}
            <a
              href="mailto:onboarding@careroot.co.uk?subject=Speculative%20Application"
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              Send us a speculative application at onboarding@careroot.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* ── CONTACT TEASER ── */}
      <section className="bg-cr-ivory py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl font-semibold text-cr-charcoal mb-3">
            Want to know more?
          </h2>
          <p className="font-body text-cr-slate mt-3 mb-8 leading-relaxed">
            Talk to us about Careroot, a demo, a partnership, or joining the team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-[#1A3C2E] text-white font-body font-medium px-7 py-3 rounded-lg hover:bg-cr-sage transition-colors"
            >
              Book a demo
            </Link>
            <Link
              href="/contact"
              className="border border-[#1A3C2E] text-[#1A3C2E] font-body font-medium px-7 py-3 rounded-lg hover:bg-cr-mint transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
