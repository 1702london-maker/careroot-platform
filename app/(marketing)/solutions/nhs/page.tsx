import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Lock, Zap, Users, Palette } from "lucide-react";

export const metadata: Metadata = {
  title: "Careroot for NHS Community Care Teams",
  description: "Care management for NHS community care teams. Your brand, NHS-grade security, UK data residency.",
};

const NEED_CARDS = [
  { headline: "UK data residency — guaranteed", body: "All data stored in the UK on Enterprise plans. Full security documentation available for NHS procurement processes." },
  { headline: "Your brand — not ours", body: "Your staff see your trust name. Your patients' families log into a portal with your logo. See Custom App." },
  { headline: "SLA guarantee and dedicated support", body: "Enterprise includes a formal SLA with uptime guarantee and incident response times." },
];

const SOLUTIONS = [
  { Icon: Palette, headline: "Your brand throughout", body: "Staff open an app with your NHS trust name. Families log into a portal with your logo. Careroot powers everything invisibly. Your brand is all they see. See our Custom App page for details." },
  { Icon: Lock, headline: "UK data residency", body: "All data stored in the UK on Enterprise plans. Row-level security. Security documentation available for NHS procurement." },
  { Icon: Zap, headline: "SLA guarantee", body: "Enterprise includes formal SLA with uptime guarantee and incident response times. The reliability NHS infrastructure demands." },
  { Icon: Users, headline: "Dedicated implementation", body: "We work with your team to configure, migrate records, and train staff. Not a login and a help article." },
];

export default function NHSPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      <section className="bg-cr-ivory py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-body bg-cr-gold/10 text-cr-gold border border-cr-gold/20 mb-6">NHS Community Care</span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-cr-charcoal mb-5 leading-tight">NHS-grade care management. Under your brand.</h1>
          <p className="text-lg text-cr-slate font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            NHS community care teams need software that meets their security requirements, integrates with existing systems, and carries their brand. Careroot Enterprise delivers that.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-cr-forest text-white font-medium rounded-lg px-6 py-3 hover:bg-cr-sage transition-colors">Talk to our team</Link>
            <Link href="/custom-app" className="border border-[#1A3C2E] text-[#1A3C2E] font-medium rounded-lg px-6 py-3 hover:bg-cr-mint transition-colors">See Custom App options</Link>
          </div>
        </div>
      </section>

      {/* Need cards */}
      <section className="bg-white py-8 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NEED_CARDS.map((c) => (
              <div key={c.headline} className="bg-cr-ivory rounded-xl p-6 border border-gray-100">
                <h3 className="font-body font-semibold text-lg text-[#1C1C1E] mb-2">{c.headline}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#1C1C1E] text-center mb-12">Built for NHS requirements.</h2>
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

      {/* Pricing note */}
      <section className="bg-cr-ivory py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#E8F5EE] rounded-xl p-6 border-l-4 border-[#1A3C2E]">
            <p className="text-sm font-body text-[#1C1C1E] leading-relaxed mb-4">
              NHS and public sector pricing is available. Contact our team for procurement documentation and data processing agreements.
            </p>
            <Link href="/contact" className="inline-block bg-[#1A3C2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#4A7C5E] transition-colors">
              Contact our team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A3C2E] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Talk to our enterprise team.</h2>
          <Link href="/contact" className="inline-block mt-8 bg-white text-[#1A3C2E] font-medium rounded-lg px-8 py-3 hover:bg-white/90 transition-colors">
            Get in touch
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
