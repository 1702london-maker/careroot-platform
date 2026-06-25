"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "How long does CQC registration take?", a: "Typically 3 to 6 months from initial application to decision, though it can be shorter or longer depending on the completeness of your application and CQC's workload." },
  { q: "Do I need a registered manager before applying?", a: "You need to identify who your registered manager will be but they do not need to be in post before you submit your application. However CQC will want to be satisfied about their fitness and experience." },
  { q: "What is a nominated individual?", a: "If your care service is run by an organisation (rather than an individual), you need a nominated individual — a director or senior manager who is responsible for supervising the management of the regulated activity." },
  { q: "Can I operate before I am registered?", a: "No. Providing a regulated activity without CQC registration is a criminal offence. You must be registered before you take on any clients." },
  { q: "What happens if CQC refuses my application?", a: "CQC will give you reasons. You have the right to make representations before a final decision. If refused you can reapply but must address the reasons for refusal." },
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

export default function CQCRegistrationPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-cr-ivory py-16 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#6B7280] font-body mb-4">Solutions / CQC Registration</p>
          <h1 className="font-display text-5xl md:text-6xl text-[#1C1C1E] mb-5 leading-tight">How to prepare for CQC registration.</h1>
          <p className="text-lg text-[#6B7280] font-body leading-relaxed mb-5">
            A complete guide for new care agencies in 2026. Covers everything from the initial application to passing your first inspection.
          </p>
          <p className="text-sm text-[#6B7280]">Updated June 2026 · 15 minute read</p>
          <div className="mt-6">
            <a href="#careroot" className="inline-block bg-[#1A3C2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#4A7C5E] transition-colors">
              See how Careroot helps
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto prose-custom">

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-4">What is CQC registration?</h2>
          <p className="text-base text-[#6B7280] font-body leading-relaxed mb-10">
            The Care Quality Commission regulates all health and social care in England. You cannot legally operate a care service without being registered. Registration involves an assessment of your fitness, your proposed service, your policies, and your systems. CQC assesses whether you are capable of delivering safe, effective, caring, responsive, and well-led care before granting you permission to operate.
          </p>

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-6">The five key questions</h2>
          <p className="text-base text-[#6B7280] font-body leading-relaxed mb-6">CQC assesses every care service against five key questions. Understanding what inspectors look for under each question is the foundation of a successful registration and inspection.</p>

          {[
            { title: "Safe", body: "Are people protected from abuse and harm? Inspectors look for evidence of medication management, safeguarding procedures, DBS checks for all staff, risk assessments, incident reporting, and emergency procedures. Every interaction that protects a person from harm creates evidence of Safe." },
            { title: "Effective", body: "Do people get the support they need? Inspectors want to see care plan quality, staff training and competence records, outcomes for people using the service, and evidence of partnership working with healthcare teams. They want to see that care actually works, not just that it was planned." },
            { title: "Caring", body: "Are staff kind and respectful? This is about dignity and respect in care, person-centred approaches, involvement of people in their own care, and privacy and independence maintained. Inspectors know the difference between documented values and a culture of genuine care." },
            { title: "Responsive", body: "Are services organised around people's needs? Evidence includes person-centred care plans, a complaint handling procedure, responsiveness to changing needs, and family involvement. Services that adapt to the individual rather than expecting individuals to adapt to the service." },
            { title: "Well-led", body: "Is the service run well? Inspectors look at governance systems, quality monitoring, staff wellbeing, continuous improvement culture, and leadership. A well-led service has clear accountability, learns from incidents, and has systems that work without constant management intervention." },
          ].map(({ title, body }) => (
            <div key={title} className="mb-6 p-5 bg-cr-ivory rounded-xl border-l-4 border-[#1A3C2E]">
              <h3 className="font-body font-semibold text-[#1C1C1E] mb-2">{title}</h3>
              <p className="text-sm text-[#6B7280] font-body leading-relaxed">{body}</p>
            </div>
          ))}

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-6 mt-12">The registration process</h2>
          <div className="space-y-5 mb-10">
            {[
              ["1", "Check if you need to register", "Most care services require CQC registration. If you are providing personal care, nursing care, or any regulated activity to individuals, you almost certainly need to register."],
              ["2", "Create an account on the CQC provider portal", "The application is submitted online through CQC's portal. Set up your organisation account before starting the application."],
              ["3", "Complete the application", "Organisation details, nominated individual, registered manager details, description of the regulated activities you will carry out, the location from which you will operate."],
              ["4", "Submit supporting documents", "DBS checks, references, insurance documents, policies and procedures. Have these ready before you start so the submission is complete."],
              ["5", "CQC assessment", "May include an interview with the nominated individual and registered manager. CQC will assess your knowledge of the regulations and your readiness to operate safely."],
              ["6", "Decision", "Registration granted or refused with reasons. If refused you have the right to make representations before a final decision is issued."],
              ["7", "First inspection", "Usually within 12 months of registration. CQC will assess your service against the five key questions and issue a rating."],
            ].map(([n, title, body]) => (
              <div key={n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1A3C2E] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
                <div>
                  <p className="font-body font-semibold text-[#1C1C1E] mb-1">{title}</p>
                  <p className="text-sm text-[#6B7280] font-body leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-6">What to prepare before you apply</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="font-body font-semibold text-[#1C1C1E] mb-3">Policies you must have</h3>
              <ul className="space-y-2 text-sm text-[#6B7280] font-body">
                {["Safeguarding adults policy", "Medicines management policy", "Infection prevention and control", "Complaints procedure", "Whistleblowing policy", "Equality and diversity policy", "Mental capacity and DoLS policy", "Health and safety policy"].map((p) => (
                  <li key={p} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0" />{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-body font-semibold text-[#1C1C1E] mb-3">Systems you need</h3>
              <ul className="space-y-2 text-sm text-[#6B7280] font-body">
                {["Staff recruitment and DBS process", "Staff training programme", "Care plan process", "Incident and accident reporting", "Medication management system", "Quality monitoring process"].map((p) => (
                  <li key={p} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0" />{p}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-6">Common reasons agencies fail registration</h2>
          <ul className="space-y-3 mb-10 list-none">
            {[
              "Weak policies that are generic rather than specific to the service — inspectors can tell when a policy has been copied from the internet and never adapted",
              "Nominated individual or registered manager not demonstrating knowledge of CQC requirements during the assessment interview",
              "No clear evidence of how safeguarding will be managed in practice — not just a policy, but a process",
              "Medication management process not clearly defined — how will medications be stored, administered, and recorded?",
              "No system for monitoring quality and making improvements — governance needs to be demonstrable, not theoretical",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#6B7280] font-body leading-relaxed">
                <span className="font-semibold text-[#1C1C1E] flex-shrink-0">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>

          <h2 className="font-display text-3xl text-[#1C1C1E] mb-6">Why digital systems matter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <h3 className="font-body font-semibold text-[#1C1C1E] mb-3">Paper-based agencies struggle because:</h3>
              <ul className="space-y-2 text-sm text-[#6B7280] font-body">
                {["Evidence is scattered and hard to find", "No audit trail of care delivery", "Inspectors cannot see real-time evidence of good care", "Complaints and incidents are poorly tracked"].map((p) => <li key={p}>— {p}</li>)}
              </ul>
            </div>
            <div className="bg-[#E8F5EE] rounded-xl p-5 border border-[#E8F5EE]">
              <h3 className="font-body font-semibold text-[#1C1C1E] mb-3">Digital agencies have:</h3>
              <ul className="space-y-2 text-sm text-[#6B7280] font-body">
                {["Automatic evidence creation from every interaction", "Real-time compliance monitoring", "Searchable incident and complaint records", "Care plan version history", "DBS and training compliance tracking"].map((p) => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          </div>

          <h2 id="careroot" className="font-display text-3xl text-[#1C1C1E] mb-6">How Careroot prepares you for CQC</h2>
          <div className="space-y-6 mb-10">
            {[
              { key: "Safe", features: ["Medication management with eMAR", "Risk assessment tools", "Safeguarding concern flagging", "DBS tracking and alerts", "Emergency response system", "Incident management"] },
              { key: "Effective", features: ["AI care plan drafting", "Training record management", "Outcome tracking", "GP Connect ready (coming Q4 2026)"] },
              { key: "Caring", features: ["Person-centred onboarding wizard", "Cultural and personal preferences", "Nutrition and meal planning", "Family portal involvement", "Dignity in all documentation"] },
              { key: "Responsive", features: ["Complaints system with 28-day tracker", "Person-centred care plans", "Family communication tools", "Flexible care plan updates"] },
              { key: "Well-led", features: ["Compliance dashboard", "Staff wellbeing monitoring", "Quality reporting", "Audit trail of everything"] },
            ].map(({ key, features }) => (
              <div key={key}>
                <h3 className="font-body font-semibold text-[#1C1C1E] mb-3">For {key}:</h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs font-body bg-[#E8F5EE] text-[#1A3C2E]">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA box */}
          <div className="bg-[#E8F5EE] border-l-4 border-[#1A3C2E] rounded-xl p-8 mb-16">
            <h3 className="font-display text-2xl text-[#1C1C1E] mb-3">See Careroot in action</h3>
            <p className="text-sm text-[#6B7280] font-body leading-relaxed mb-5">
              Book a 30-minute demo and we will show you exactly how Careroot prepares your agency for CQC registration.
            </p>
            <Link href="/demo" className="inline-block bg-[#1A3C2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#4A7C5E] transition-colors">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cr-ivory py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-[#1C1C1E] mb-8">Frequently asked questions</h2>
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
