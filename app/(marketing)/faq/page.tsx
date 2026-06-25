"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import Link from "next/link";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How long does it take to set up Careroot?",
        a: "Most organisations are up and running in under an hour. You add your organisation details, invite your first carer, and onboard your first client. No IT team or technical knowledge required.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. Careroot is fully web-based and works in any modern browser. The carer app is a Progressive Web App — carers add it to their home screen like an app, with no app store required.",
      },
      {
        q: "Can I import my existing care plans?",
        a: "Yes. Careroot AI can import paper care plans and digitise them automatically. You can also manually enter client data, or use our CSV import for bulk uploads.",
      },
      {
        q: "What devices does Careroot work on?",
        a: "Careroot works on any device with a modern browser — desktop, tablet, and mobile. The carer app is optimised for mobile and works offline with no signal.",
      },
    ],
  },
  {
    category: "CQC Compliance",
    items: [
      {
        q: "How does Careroot help with CQC inspections?",
        a: "Careroot maps all evidence to the CQC 2026 Single Assessment Framework — all 5 key questions and 34 quality statements. Your live compliance score shows exactly where you stand and flags gaps before an inspector finds them.",
      },
      {
        q: "Is Careroot built for the new CQC Single Assessment Framework?",
        a: "Yes. The 2026 Single Assessment Framework is built into Careroot from day one — not retrofitted. Every care plan, visit note, and incident is automatically mapped to the relevant quality statements.",
      },
      {
        q: "Can I store CQC evidence documents in Careroot?",
        a: "Yes. The Evidence Library lets you upload documents, policies, certificates, and audit reports — all tagged to specific quality statements and key questions. You can generate a complete evidence pack in one click.",
      },
      {
        q: "What happens if I get a CQC inspection?",
        a: "Your compliance dashboard gives you an instant evidence export organised by key question. Inspectors can see exactly which quality statements are evidenced and where gaps exist.",
      },
    ],
  },
  {
    category: "Pricing & Trial",
    items: [
      {
        q: "Is the free trial really free?",
        a: "Yes. 30 days, every feature, no credit card required. You only enter payment details if you decide to continue after the trial.",
      },
      {
        q: "What happens to my data after the trial?",
        a: "If you don't upgrade, your account is paused and data is retained for 90 days. You can export everything at any time, or reactivate by upgrading to a paid plan.",
      },
      {
        q: "Can I change plan later?",
        a: "Yes. You can upgrade or downgrade at any time from your billing settings. Upgrades take effect immediately. Downgrades apply at the next billing cycle.",
      },
      {
        q: "Do you offer NHS or charity discounts?",
        a: "Yes. Contact us at onboarding@careroot.co.uk and we'll discuss pricing for NHS teams and registered charities.",
      },
    ],
  },
  {
    category: "Data & Security",
    items: [
      {
        q: "Where is my data stored?",
        a: "All data is stored in UK-based servers, fully encrypted at rest and in transit. Careroot is built on NHS-grade infrastructure that meets ISO 27001 standards.",
      },
      {
        q: "Who can see client data?",
        a: "Data is strictly org-isolated. Your carers can only see the clients assigned to them. Families see only their relative's data. You control every permission level.",
      },
      {
        q: "Is Careroot GDPR compliant?",
        a: "Yes. Careroot is fully GDPR compliant. We are the data processor; your organisation is the data controller. A Data Processing Agreement (DPA) is available on request.",
      },
      {
        q: "Can carers access client data on personal devices?",
        a: "Yes, securely. The carer app uses Supabase Row Level Security — carers can only access data for their assigned visits. Sessions are time-limited and device management controls are available on enterprise plans.",
      },
    ],
  },
  {
    category: "Features",
    items: [
      {
        q: "Does Careroot work offline?",
        a: "Yes. The carer app is a fully offline-capable PWA. Carers can complete visits, record medications, and write notes with no signal. Everything syncs automatically when back online.",
      },
      {
        q: "What is GP Connect?",
        a: "GP Connect is an NHS API that gives care providers direct access to a client's GP record — medications, allergies, conditions, and consultations. Careroot is currently applying for NHS Assured Supplier status to enable this. Register your interest at careroot.co.uk/gp-connect.",
      },
      {
        q: "Can families see what's happening with their relative?",
        a: "Yes. The family portal gives approved family members real-time visit updates, AI weekly briefings, meal records, and direct messaging with the care team.",
      },
      {
        q: "Does Careroot handle payroll?",
        a: "Yes. The payroll module calculates pay from visit data, handles different rates for different visit types, and exports to CSV for upload to your payroll provider.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-body font-semibold text-cr-charcoal leading-relaxed">{q}</span>
        {open
          ? <ChevronUp size={18} className="text-cr-forest flex-shrink-0 mt-0.5" />
          : <ChevronDown size={18} className="text-cr-slate flex-shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="text-sm font-body text-cr-slate leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <>
      <MarketingNav />
      <main className="bg-cr-ivory min-h-screen">
        {/* Hero */}
        <section className="pt-24 pb-14 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest text-cr-forest bg-cr-mint px-3 py-1.5 rounded-full mb-5">FAQ</span>
            <h1 className="font-display text-5xl text-cr-charcoal leading-tight mb-4">Frequently asked questions</h1>
            <p className="text-base font-body text-cr-slate max-w-xl mx-auto">
              Everything you need to know about Careroot. Can&rsquo;t find your answer?{" "}
              <Link href="/contact" className="text-cr-forest underline underline-offset-2 hover:text-cr-sage">Contact us</Link>.
            </p>
          </div>
        </section>

        {/* FAQ sections */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {FAQS.map((section) => (
              <div key={section.category}>
                <h2 className="font-display text-2xl text-cr-charcoal mb-4">{section.category}</h2>
                <div className="bg-white rounded-card border border-gray-100 shadow-card px-6">
                  {section.items.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-cr-forest py-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl text-white mb-3">Still have questions?</h2>
            <p className="text-sm font-body text-white/70 mb-6">Our team is happy to walk you through anything — book a demo or email us directly.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/demo" className="bg-white text-cr-forest rounded-btn px-6 py-3 font-body font-semibold text-sm hover:bg-cr-mint transition-colors">
                Book a free demo
              </Link>
              <a href="mailto:onboarding@careroot.co.uk" className="border border-white/40 text-white rounded-btn px-6 py-3 font-body font-semibold text-sm hover:bg-white/10 transition-colors">
                onboarding@careroot.co.uk
              </a>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
