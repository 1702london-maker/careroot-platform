"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Building, Stethoscope, RefreshCw, Building2, Home, Users, ChevronDown } from "lucide-react";

const WHO = [
  { Icon: Building, title: "Large care groups", body: "Managing multiple services who want brand consistency across all locations." },
  { Icon: Stethoscope, title: "NHS community care teams", body: "Teams that cannot be seen using a startup product. Your brand, our infrastructure." },
  { Icon: RefreshCw, title: "Franchise care agencies", body: "All franchise locations on one branded platform. Consistent experience everywhere." },
  { Icon: Building2, title: "Local authority care services", body: "Public sector teams with brand and procurement requirements." },
  { Icon: Home, title: "Housing associations", body: "Organisations with care services that want digital care management under their housing brand." },
  { Icon: Users, title: "Care consultancies", body: "Managing multiple care organisations under one branded management layer." },
];

const TABLE_ROWS = [
  ["App name", "Your organisation", "Careroot"],
  ["Logo", "Your logo", "Careroot logo"],
  ["Colours", "Your brand colours", "Careroot green"],
  ["Domain", "yourname.co.uk", "careroot.care"],
  ["Emails", "from@yourname.co.uk", "@careroot.care"],
  ["Play Store", "Your app listing", "Careroot app"],
  ["Family portal", "Your branded portal", "Careroot portal"],
  ["Staff app", "Your branded app", "Careroot app"],
];

const STEPS = [
  { n: "1", title: "Contact us", body: "Tell us about your organisation, how many staff, what care types you provide." },
  { n: "2", title: "We configure your branding", body: "Your logo, your colours, your domain set up in 48 hours." },
  { n: "3", title: "Your staff download the app", body: "Under your name from the Play Store or App Store." },
  { n: "4", title: "Families log in to your portal", body: "Branded with your organisation's name and colours." },
  { n: "5", title: "CQC inspectors see your system", body: "Professional. Digital. Yours." },
];

const PACKAGES = [
  {
    name: "Basic Custom App",
    price: "£500/month extra",
    features: ["Your logo, name, and brand colours", "Branded staff app and family portal", "Best for organisations wanting branded experience without domain change"],
  },
  {
    name: "Full Custom App",
    price: "£1,000/month extra",
    features: ["Everything in Basic", "Your own domain (yourname.co.uk)", "Emails from your domain", "Best for organisations wanting complete brand separation"],
  },
  {
    name: "Enterprise Custom App",
    price: "£1,500/month extra",
    features: ["Everything in Full", "Your own Play Store app listing", "Your own App Store listing", "Dedicated support team", "On-site training", "Best for NHS teams and large care groups"],
  },
];

const FAQS = [
  { q: "What does Custom App mean exactly?", a: "Your organisation's brand replaces Careroot everywhere. Your staff see your name and logo. Your families log into a portal with your branding. Emails come from your domain. The Play Store lists your app. Careroot powers everything in the background — completely invisible to everyone who uses it." },
  { q: "Who is Custom App designed for?", a: "Large care groups who want brand consistency across multiple services. NHS community care teams who cannot be seen using a third-party product. Franchise care agencies who want all locations on one branded platform. Housing associations and local authority care teams." },
  { q: "How long does setup take?", a: "Basic (logo and colours): 24 hours. Full (custom domain and emails): 48 to 72 hours. Enterprise (Play Store and App Store listing): 5 to 10 working days." },
  { q: "Is there a setup fee?", a: "Yes — a one-time £2,000 setup fee covering branding configuration, domain setup and verification, email domain configuration, and a staff onboarding call." },
  { q: "Can we see a preview before going live?", a: "Yes. Once we configure your branding you will see a preview of your logo and colours across the platform before anything goes live to your staff or families." },
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

export default function CustomAppPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#1C1C1E] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-white/10 text-white mb-6">Custom App</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white mb-5 leading-tight">Your care platform. Your name. Your brand.</h1>
          <p className="text-lg text-white/70 font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            Large care organisations, NHS teams, and franchise agencies run Careroot completely under their own brand. Your staff and the families you serve only ever see your name.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-white text-[#1C1C1E] font-medium rounded-lg px-6 py-3 hover:bg-white/90 transition-colors">Talk to our team</Link>
            <a href="#pricing" className="border border-white/60 text-white font-medium rounded-lg px-6 py-3 hover:bg-white/10 transition-colors">See pricing</a>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">Who uses Custom App?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHO.map(({ Icon, title, body }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <Icon size={24} style={{ color: "#1A3C2E" }} className="mb-3" />
                <h3 className="font-body font-semibold text-[#1C1C1E] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What changes */}
      <section className="bg-cr-ivory py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-4">What your organisation gets with Custom App</h2>
          <p className="text-center text-[#6B7280] font-body mb-10">Everything changes to your brand. Nothing changes about the platform.</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 bg-[#1A3C2E] text-white text-sm font-body font-medium">
              <div className="p-4">Element</div>
              <div className="p-4">With Custom App</div>
              <div className="p-4">Standard</div>
            </div>
            {TABLE_ROWS.map(([el, custom, standard]) => (
              <div key={el} className="grid grid-cols-3 border-b border-gray-100 text-sm font-body">
                <div className="p-4 text-[#1C1C1E] font-medium">{el}</div>
                <div className="p-4 text-[#1A3C2E] font-medium">{custom}</div>
                <div className="p-4 text-[#6B7280]">{standard}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-center text-[#6B7280] font-body mt-6 leading-relaxed">
            Everything underneath stays the same. All the AI. All the compliance tools. All the emergency features. All the care management. 100% of Careroot's capability under your name.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-12">How it works</h2>
          <div className="flex flex-col md:flex-row gap-6 overflow-x-auto">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex-1 min-w-[160px] text-center">
                <div className="w-10 h-10 rounded-full bg-[#1A3C2E] text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">{n}</div>
                <h3 className="font-body font-semibold text-[#1C1C1E] mb-2 text-sm">{title}</h3>
                <p className="text-xs text-[#6B7280] font-body leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="pricing" className="bg-cr-ivory py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl text-[#1C1C1E] text-center mb-4">Custom App packages</h2>
          <p className="text-center text-[#6B7280] font-body mb-10 text-sm">
            All packages include a £2,000 one-time setup fee covering branding configuration, domain setup, and a staff onboarding session.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map(({ name, price, features }) => (
              <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="font-body font-semibold text-[#1C1C1E] mb-1">{name}</h3>
                <p className="font-display text-2xl text-[#1A3C2E] mb-1">{price}</p>
                <p className="text-xs text-[#6B7280] font-body mb-5">+ £2,000 one-time setup fee</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="text-sm text-[#6B7280] font-body leading-snug">— {f}</li>
                  ))}
                </ul>
                <Link href="/contact" className="block text-center bg-[#1A3C2E] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#4A7C5E] transition-colors">
                  Talk to our team
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-[#1C1C1E] mb-8">Questions about Custom App</h2>
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Ready to run Careroot under your brand?</h2>
          <p className="text-lg text-white/80 font-body mb-8">Talk to our team. We will configure everything and have you live within 48 hours.</p>
          <Link href="/contact" className="inline-block bg-white text-[#1A3C2E] font-medium rounded-lg px-8 py-3 hover:bg-white/90 transition-colors">
            Get in touch
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
