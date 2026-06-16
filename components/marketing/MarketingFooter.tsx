import Link from "next/link";
import { Leaf, Globe, Mail, MessageCircle, Share2 } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-cr-charcoal pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display text-xl font-semibold text-white">Careroot</span>
            </div>
            <p className="text-xs font-body text-white/50 leading-relaxed mb-5">
              The UK&rsquo;s most intelligent care management platform. Built for CQC 2026.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Globe, href: "#", label: "Website" },
                { icon: Mail, href: "mailto:hello@careroot.care", label: "Email" },
                { icon: MessageCircle, href: "#", label: "LinkedIn" },
                { icon: Share2, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <p className="text-xs font-body font-semibold text-white uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-2.5">
              {[
                ["Features", "/features"],
                ["Pricing", "/pricing"],
                ["White Label", "/white-label"],
                ["API", "/docs/api"],
                ["Security", "/features#security"],
                ["Changelog", "#"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Solutions */}
          <div>
            <p className="text-xs font-body font-semibold text-white uppercase tracking-widest mb-4">Solutions</p>
            <ul className="space-y-2.5">
              {[
                ["Domiciliary Care", "/features"],
                ["Supported Living", "/features"],
                ["Residential", "/features"],
                ["NHS Teams", "/demo"],
                ["New Agencies", "/pricing"],
                ["CQC Registration", "/features#compliance"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Company */}
          <div>
            <p className="text-xs font-body font-semibold text-white uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5">
              {[
                ["About", "#"],
                ["Book a Demo", "/demo"],
                ["Contact", "/demo"],
                ["Privacy Policy", "#"],
                ["Terms of Service", "#"],
                ["GDPR", "#"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-xs font-body text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs font-body text-white/30">
            © {new Date().getFullYear()} Careroot Ltd · Registered in England · UK data residency
          </p>
          <p className="text-xs font-body text-white/30">
            hello@careroot.care
          </p>
        </div>
      </div>
    </footer>
  );
}
