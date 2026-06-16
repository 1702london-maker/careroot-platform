import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Brain, Shield, AlertTriangle, Heart,
  UtensilsCrossed, Globe, CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Careroot — Our Mission, Our Team, Our Future",
  description:
    "Careroot is built by people who believe care workers deserve better tools and the people they support deserve better care.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="bg-[#F9F7F4] pt-28 pb-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#1A3C2E] mb-6">
            About Careroot
          </p>
          <h1 className="font-display font-bold text-[60px] md:text-[76px] leading-[1.05] tracking-tight text-[#1C1C1E] max-w-4xl mb-8">
            Built by people who believe care can be better.
          </h1>
          <div className="w-16 h-1 bg-[#1A3C2E] mb-8" />
          <p className="text-xl md:text-2xl text-[#6B7280] leading-relaxed max-w-3xl">
            Careroot exists because too many care agencies are still managing the most important work in the world with paper, spreadsheets, and disconnected systems. We are changing that — one care agency at a time.
          </p>
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* Left heading col */}
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#1A3C2E] mb-5">
                Our Mission
              </p>
              <h2 className="font-display font-bold text-[44px] md:text-[52px] leading-[1.1] text-[#1C1C1E]">
                Technology that serves the people who serve others.
              </h2>
            </div>

            {/* Right content col */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-lg text-[#4B5563] leading-relaxed">
                Care workers are some of the most important people in our society. They show up every day — in people's homes, in care homes, in supported living services — and do work that demands expertise, compassion, and extraordinary attention to detail.
              </p>
              <p className="text-lg text-[#4B5563] leading-relaxed">
                The people they support deserve to be known. Not as a record number or a care category — but as a whole person with preferences, memories, relationships, and dignity. Careroot is built to capture that wholeness and put it in the hands of every carer who walks through the door.
              </p>
              <p className="text-lg text-[#4B5563] leading-relaxed">
                We built Careroot because we experienced the gap between what care should look like and what the tools available allowed it to be. That gap costs lives. We are closing it.
              </p>

              {/* Pull quote */}
              <div className="border-l-[3px] border-[#1A3C2E] pl-8 py-2 mt-8">
                <p className="font-display text-[26px] md:text-[30px] leading-relaxed text-[#1C1C1E] italic">
                  "Care is not an industry. It is a human act. The technology supporting it should honour that."
                </p>
                <p className="text-sm text-[#9CA3AF] mt-4 font-medium">
                  — Careroot founding principle
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE ARE BUILDING ──────────────────────────────── */}
      <section className="bg-[#F9F7F4] py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#1A3C2E] mb-5">
              What we are building
            </p>
            <h2 className="font-display font-bold text-[44px] md:text-[52px] leading-[1.1] text-[#1C1C1E] mb-5">
              A platform for the whole care ecosystem.
            </h2>
            <p className="text-lg text-[#6B7280] leading-relaxed">
              Careroot is not a form-filling tool. It is a care intelligence platform — connecting carers, managers, families, and emergency services around the people who matter most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 rounded-[20px] overflow-hidden border border-gray-100">
            {[
              {
                icon: Brain,
                title: "AI that works for care",
                body: "Not AI for its own sake. AI that drafts care plans, spots deterioration patterns, and flags concerns — so coordinators can focus on people, not paperwork.",
                iconBg: "bg-[#C9A84C]/10",
                iconColor: "text-[#C9A84C]",
              },
              {
                icon: Shield,
                title: "Compliance as a byproduct",
                body: "When care is documented well, compliance evidence creates itself. CQC inspectors see what happens every day — not what was prepared the week before their visit.",
                iconBg: "bg-[#E8F5EE]",
                iconColor: "text-[#1A3C2E]",
              },
              {
                icon: AlertTriangle,
                title: "Emergency response that works",
                body: "Every client has a QR card on their fridge. Paramedics scan it. Full medical record in 10 seconds. No login. No delay. This feature exists nowhere else in the UK market.",
                iconBg: "bg-red-50",
                iconColor: "text-[#DC2626]",
              },
              {
                icon: Heart,
                title: "Families as partners",
                body: "Families are not an afterthought. They are part of the care team. Careroot gives them real visibility, real communication, and a real voice — without overwhelming the agency with calls.",
                iconBg: "bg-[#E8F5EE]",
                iconColor: "text-[#1A3C2E]",
              },
              {
                icon: UtensilsCrossed,
                title: "The whole person",
                body: "Margaret only eats from the blue plates. That detail matters. Careroot captures it and puts it in front of every carer, every visit, every time — automatically.",
                iconBg: "bg-[#E8F5EE]",
                iconColor: "text-[#4A7C5E]",
              },
              {
                icon: Globe,
                title: "Built for the UK",
                body: "CQC 2026 Single Assessment Framework. Ofsted compliance. UK data residency. Built for UK regulation, UK care types, and UK care workers — not retrofitted from a US or Australian platform.",
                iconBg: "bg-[#E8F5EE]",
                iconColor: "text-[#1A3C2E]",
              },
            ].map(({ icon: Icon, title, body, iconBg, iconColor }) => (
              <div
                key={title}
                className="bg-white p-8 hover:bg-[#F9F7F4] transition-colors duration-150"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <h3 className="font-semibold text-[17px] text-[#1C1C1E] mb-3 leading-snug">
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHERE WE ARE HEADING ──────────────────────────────── */}
      <section className="bg-white py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#1A3C2E] mb-5">
                Our Roadmap
              </p>
              <h2 className="font-display font-bold text-[44px] md:text-[52px] leading-[1.1] text-[#1C1C1E]">
                Where Careroot is going.
              </h2>
            </div>

            <div className="lg:col-span-8">
              <div className="space-y-0">
                {[
                  {
                    status: "Live now",
                    statusCls: "bg-[#E8F5EE] text-[#1A3C2E]",
                    dotCls: "bg-[#1A3C2E]",
                    lineCls: "bg-[#1A3C2E]/20",
                    title: "Complete care management platform",
                    body: "AI care planning, CQC compliance dashboard across all 34 quality statements, offline carer app, family portal, emergency SOS and paramedic QR access, nutrition and meal planning, eMAR, complaints management with 28-day tracker, DBS tracking, rota scheduling, invoicing, payroll, and 50+ pre-built reports. Everything a care agency needs from day one.",
                    items: ["Available today on all plans", "30-day free trial, no card required"],
                  },
                  {
                    status: "In development",
                    statusCls: "bg-amber-50 text-amber-700",
                    dotCls: "bg-[#F59E0B]",
                    lineCls: "bg-gray-200",
                    title: "GP Connect integration",
                    body: "Direct access to GP records — medications, conditions, recent consultations — without phone calls or letters. Careroot is completing NHS Assured Supplier accreditation to enable this integration. Estimated Q4 2026.",
                    items: ["NHS application in progress", "UI ready — credentials pending"],
                  },
                  {
                    status: "On the roadmap",
                    statusCls: "bg-gray-100 text-[#6B7280]",
                    dotCls: "bg-gray-300",
                    lineCls: null,
                    title: "Predictive health intelligence",
                    body: "Moving from flagging what has happened to predicting what will. Using aggregated, anonymised care data to identify population-level health patterns and help commissioners plan better services before crises develop.",
                    items: ["Research phase", "In partnership discussion with NHS ICBs"],
                  },
                ].map(({ status, statusCls, dotCls, lineCls, title, body, items }) => (
                  <div key={title} className="flex gap-8">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${dotCls}`} />
                      {lineCls && (
                        <div className={`w-px flex-1 mt-3 mb-3 ${lineCls}`} style={{ minHeight: "80px" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-14 flex-1">
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${statusCls}`}>
                        {status}
                      </span>
                      <h3 className="font-semibold text-xl text-[#1C1C1E] mb-3">
                        {title}
                      </h3>
                      <p className="text-[#6B7280] leading-relaxed mb-4">
                        {body}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] bg-gray-50 border border-gray-100 rounded-full px-3 py-1"
                          >
                            <CheckCircle size={11} className="text-[#1A3C2E]" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAREERS ───────────────────────────────────────────── */}
      <section id="careers" className="bg-[#1A3C2E] py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 mb-14">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[2.5px] text-white/50 mb-5">
                Join the team
              </p>
              <h2 className="font-display font-bold text-[44px] md:text-[52px] leading-[1.1] text-white">
                We are looking for people who care about care.
              </h2>
            </div>
            <div className="lg:col-span-7 flex items-center">
              <p className="text-lg text-white/70 leading-relaxed">
                Careroot is a small team building something important for a sector that is chronically under-served by technology. We are looking for people who combine technical or operational excellence with genuine belief that software can transform how care is delivered in the UK.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                role: "Senior Full Stack Engineer",
                type: "Full time · Remote",
                body: "Next.js, TypeScript, Supabase. Building the core platform that care agencies across the UK depend on every day. You care about correctness, performance, and real-world impact.",
              },
              {
                role: "Care Sector Customer Success",
                type: "Full time · UK-based",
                body: "You understand care. You have worked in or around a registered care service. You help agencies get the most from Careroot and build relationships that last years, not quarters.",
              },
              {
                role: "Care Sector Sales",
                type: "Full time · UK-based",
                body: "Not a hard sell. You understand registered managers and operations directors. You listen before you pitch. You help them see what Careroot can do for their service and their carers.",
              },
            ].map(({ role, type, body }) => (
              <div
                key={role}
                className="bg-white/6 border border-white/10 rounded-[16px] p-7 flex flex-col"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white mb-1.5">{role}</h3>
                  <p className="text-xs text-white/40 font-medium mb-4">{type}</p>
                  <p className="text-sm text-white/70 leading-relaxed">{body}</p>
                </div>
                <a
                  href={`mailto:onboarding@careroot.co.uk?subject=Application: ${role}`}
                  className="mt-6 inline-block bg-white text-[#1A3C2E] text-sm font-semibold px-5 py-2.5 rounded-[8px] hover:bg-[#E8F5EE] transition-colors self-start"
                >
                  Apply now
                </a>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="text-white/60 text-sm">
              Don't see a role that fits?{" "}
              <a
                href="mailto:onboarding@careroot.co.uk?subject=Speculative Application"
                className="text-white font-medium underline underline-offset-2 hover:no-underline"
              >
                Send a speculative application
              </a>{" "}
              — we read every one.
            </p>
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ───────────────────────────────────────── */}
      <section className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-[20px] p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h3 className="font-display font-bold text-[32px] leading-[40px] text-[#1C1C1E] mb-3">
                Want to see the platform?
              </h3>
              <p className="text-[#6B7280] leading-relaxed mb-7">
                30 minutes. We tailor the demo to your care type. No commitment, no pressure.
              </p>
              <Link
                href="/demo"
                className="inline-block bg-[#1A3C2E] text-white font-semibold px-7 py-3.5 rounded-[8px] hover:bg-[#4A7C5E] transition-colors"
              >
                Book a demo
              </Link>
            </div>

            <div className="bg-[#1A3C2E] rounded-[20px] p-10">
              <h3 className="font-display font-bold text-[32px] leading-[40px] text-white mb-3">
                Any other questions?
              </h3>
              <p className="text-white/70 leading-relaxed mb-7">
                Partnerships, press, investment, or anything else — we are a small team and we read every message.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-white text-[#1A3C2E] font-semibold px-7 py-3.5 rounded-[8px] hover:bg-[#E8F5EE] transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
