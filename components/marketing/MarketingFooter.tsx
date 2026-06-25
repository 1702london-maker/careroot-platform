import Link from "next/link";
import { Leaf } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-[#F3F4F6] pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#1A3C2E] rounded-full flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display text-xl font-semibold text-[#1C1C1E]">Careroot</span>
            </div>
            <p className="text-xs font-body text-[#6B7280] leading-relaxed mb-5">
              The UK&rsquo;s most intelligent care management platform. Built for CQC 2026.
            </p>
            <div className="flex gap-3">
              {[
                { letter: "W", href: "#", label: "Website" },
                { letter: "E", href: "mailto:onboarding@careroot.co.uk", label: "Email" },
                { letter: "L", href: "#", label: "LinkedIn" },
                { letter: "X", href: "#", label: "Twitter" },
              ].map(({ letter, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-body font-bold text-[#6B7280] hover:text-[#1A3C2E] hover:bg-[#E8F5EE] transition-colors">
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <p className="text-xs font-body font-semibold text-[#6B7280] uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-2.5">
              {[
                ["Features", "/features"],
                ["Pricing", "/pricing"],
                ["Custom App", "/custom-app"],
                ["Book a Demo", "/demo"],
                ["Start Free Trial", "/signup"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-[#6B7280] hover:text-[#1A3C2E] transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Solutions */}
          <div>
            <p className="text-xs font-body font-semibold text-[#6B7280] uppercase tracking-widest mb-4">Solutions</p>
            <ul className="space-y-2.5">
              {[
                ["Domiciliary Care", "/solutions/domiciliary"],
                ["Supported Living", "/solutions/supported-living"],
                ["Residential Care", "/solutions/residential"],
                ["NHS Community Teams", "/solutions/nhs"],
                ["New Care Agencies", "/solutions/new-agencies"],
                ["CQC Registration", "/solutions/cqc-registration"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-[#6B7280] hover:text-[#1A3C2E] transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Company */}
          <div>
            <p className="text-xs font-body font-semibold text-[#6B7280] uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5">
              {[
                ["About", "/about"],
                ["Contact Us", "/contact"],
                ["FAQ", "/faq"],
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-[#6B7280] hover:text-[#1A3C2E] transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#F3F4F6] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm font-body text-[#6B7280]">
            &copy; 2026 Careroot Ltd &middot; All rights reserved
          </p>
          <Link href="/cookies" className="text-sm font-body text-[#6B7280] hover:text-[#1A3C2E] transition-colors duration-150">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
