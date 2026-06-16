import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Brain, Shield, AlertTriangle, Heart, UtensilsCrossed, Globe, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "About Careroot — Our Mission, Our Team, Our Future",
  description: "Careroot is built by people who believe care workers deserve better tools and the people they support deserve better care.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#F9F7F4] pt-24 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-4">About Careroot</p>
          <h1 className="font-display font-bold text-[52px] md:text-[64px] leading-[1.1] text-[#1C1C1E] max-w-3xl mx-auto mb-6">
            Built by people who believe care can be better.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            Careroot exists because too many care agencies are still managing the most important work in the world with paper, spreadsheets, and disconnected systems. We are changing that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-4">Our Mission</p>
            <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-6">
              Technology that serves the people who serve others.
            </h2>
            <div className="space-y-5 text-[#6B7280] leading-relaxed">
              <p>Care workers are some of the most important people in our society. They show up every day — in people's homes, in care homes, in supported living services — and do work that most of us could not imagine doing. They deserve tools that respect the complexity and importance of what they do.</p>
              <p>The people they support deserve to be known. Not as a record number or a care category — but as a whole person with preferences, memories, relationships, and dignity. Careroot is built to capture that wholeness and put it in the hands of every person who provides care.</p>
              <p>We built Careroot because we experienced the gap between what care should look like and what the tools available allowed it to be. We are closing that gap.</p>
            </div>
          </div>
          <div className="border-l-4 border-[#1A3C2E] pl-8 py-4">
            <blockquote className="font-display text-[28px] leading-relaxed text-[#1C1C1E] italic mb-4">
              "Care is not an industry. It is a human act. The technology supporting it should honour that."
            </blockquote>
            <p className="text-sm text-[#6B7280]">— Careroot founding principle</p>
          </div>
        </div>
      </section>

      {/* What we are building */}
      <section className="bg-[#E8F5EE] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">What we are building</p>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-4">
            A platform for the whole care ecosystem.
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed max-w-2xl mb-12">
            Careroot is not a form-filling tool. It is a care intelligence platform — connecting carers, managers, families, and emergency services around the people who matter most.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Brain, title: "AI that works for care", body: "Not AI for its own sake. AI that drafts care plans, spots deterioration patterns, and flags concerns — so coordinators can focus on people, not paperwork.", accent: false },
              { icon: Shield, title: "Compliance as a byproduct", body: "When care is documented well, compliance evidence creates itself. CQC inspectors see what happens every day — not what was prepared the week before.", accent: false },
              { icon: AlertTriangle, title: "Emergency response that works", body: "Every client has a QR card on their fridge. Paramedics scan it. Full medical record in 10 seconds. No login. No delay. This feature exists nowhere else.", accent: true },
              { icon: Heart, title: "Families as partners", body: "Families are not an afterthought. They are part of the care team. Careroot gives them real visibility, real communication, and a real voice.", accent: false },
              { icon: UtensilsCrossed, title: "The whole person", body: "Margaret only eats from the blue plates. That detail matters. Careroot captures it and puts it in front of every carer, every visit.", accent: false },
              { icon: Globe, title: "Built for the UK", body: "CQC 2026 Single Assessment Framework. Ofsted compliance. UK data residency. Built for UK regulation, UK care types, and UK care workers from day one.", accent: false },
            ].map(({ icon: Icon, title, body, accent }) => (
              <div key={title} className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${accent ? "bg-red-50" : "bg-[#E8F5EE]"}`}>
                  <Icon size={18} className={accent ? "text-[#DC2626]" : "text-[#1A3C2E]"} />
                </div>
                <h3 className="font-semibold text-base text-[#1C1C1E] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">Our Roadmap</p>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-12">
            Where Careroot is going.
          </h2>
          <div className="space-y-0">
            {[
              {
                pill: "Live now", pillCls: "bg-[#E8F5EE] text-[#1A3C2E]",
                dot: "bg-[#1A3C2E]",
                title: "Complete care management platform",
                body: "AI care planning, CQC compliance, carer mobile app, family portal, emergency response, nutrition planning, eMAR, complaints management, DBS tracking, rota scheduling, invoicing, payroll, and 50+ reports.",
              },
              {
                pill: "In development", pillCls: "bg-amber-50 text-amber-700",
                dot: "bg-[#F59E0B]",
                title: "GP Connect integration",
                body: "Seamless connection to GP records so carers and care managers have full clinical context without hours of back-and-forth phone calls.",
              },
              {
                pill: "On the roadmap", pillCls: "bg-gray-100 text-[#6B7280]",
                dot: "bg-gray-300",
                title: "Predictive health intelligence",
                body: "Moving from flagging what has happened to predicting what will happen. Using aggregated, anonymised care data to identify population-level health patterns.",
              },
            ].map(({ pill, pillCls, dot, title, body }, i) => (
              <div key={title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                  {i < 2 && <div className="w-0.5 bg-gray-200 flex-1 my-2" />}
                </div>
                <div className={`pb-10 ${i === 2 ? "" : ""}`}>
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${pillCls}`}>{pill}</span>
                  <h3 className="font-semibold text-lg text-[#1C1C1E] mb-2">{title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="bg-[#1A3C2E] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">Join the team</p>
          <h2 className="font-display font-bold text-[44px] leading-[52px] text-white mb-4">
            We are looking for people who care about care.
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mb-12">
            Careroot is a small team building something important. We are looking for people who combine technical excellence with genuine belief that technology can improve how care is delivered in the UK.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { role: "Senior Full Stack Engineer", type: "Full time · Remote", body: "Next.js, TypeScript, Supabase. Building the core platform that care agencies across the UK depend on every day." },
              { role: "Care Sector Customer Success", type: "Full time · UK-based", body: "You understand care. You understand software. You help agencies get the most from Careroot and build relationships that matter." },
              { role: "Care Sector Sales", type: "Full time · UK-based", body: "Not a hard sell. You understand registered managers and operations directors. You help them see what Careroot can do for their service." },
            ].map(({ role, type, body }) => (
              <div key={role} className="bg-white/5 border border-white/10 rounded-[16px] p-6">
                <h3 className="font-semibold text-white mb-1">{role}</h3>
                <p className="text-xs text-white/50 mb-3">{type}</p>
                <p className="text-sm text-white/70 leading-relaxed mb-4">{body}</p>
                <a
                  href={`mailto:onboarding@careroot.co.uk?subject=Application: ${role}`}
                  className="text-sm font-semibold text-[#1A3C2E] bg-white px-4 py-2 rounded-[8px] hover:bg-[#E8F5EE] transition-colors inline-block"
                >
                  Apply
                </a>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm">
            Don't see a role that fits?{" "}
            <a href="mailto:onboarding@careroot.co.uk?subject=Speculative Application" className="text-white underline hover:no-underline">
              Send us a speculative application
            </a>
          </p>
        </div>
      </section>

      {/* Contact teaser */}
      <section className="bg-[#F9F7F4] py-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-3">Want to know more?</h2>
          <p className="text-[#6B7280] mb-8">Talk to us about Careroot, a demo, a partnership, or joining the team.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo" className="bg-[#1A3C2E] text-white px-7 py-3 rounded-[8px] font-semibold hover:bg-[#4A7C5E] transition-colors w-full sm:w-auto text-center">Book a demo</Link>
            <Link href="/contact" className="border-2 border-[#1A3C2E] text-[#1A3C2E] px-7 py-3 rounded-[8px] font-semibold hover:bg-[#E8F5EE] transition-colors w-full sm:w-auto text-center">Contact us</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
