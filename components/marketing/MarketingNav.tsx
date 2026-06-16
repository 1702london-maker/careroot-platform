"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Menu, X } from "lucide-react";

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const NAV_LINKS = [
    { label: "ABOUT", href: "/about" },
    { label: "FEATURES", href: "/features" },
    { label: "PRICING", href: "/pricing" },
    { label: "CUSTOM APP", href: "/custom-app" },
    { label: "CONTACT", href: "/contact" },
  ];

  return (
    <>
      {/* Gold announcement bar */}
      <div className="bg-cr-gold text-white text-center text-xs font-body font-semibold py-2 px-4">
        CQC 2026 Single Assessment Framework is live —{" "}
        <Link href="/solutions/cqc-registration" className="underline underline-offset-2 hover:no-underline">
          See how Careroot keeps you compliant →
        </Link>
      </div>

      <nav className="sticky top-0 z-50 bg-white border-b border-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Careroot home">
            <div className="w-8 h-8 rounded-lg bg-[#1A3C2E] flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-[#1C1C1E]">Careroot</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-semibold font-body uppercase tracking-wide transition-colors duration-150 ${
                  isActive(href) ? "text-[#1A3C2E]" : "text-[#1C1C1E] hover:text-[#1A3C2E]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium text-[#6B7280] hover:text-[#1C1C1E] transition-colors duration-150">
              Sign in
            </Link>
            <Link href="/signup" className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg bg-[#1A3C2E] text-white hover:bg-[#4A7C5E] transition-colors duration-150">
              Start free trial
            </Link>
            <Link href="/signup" className="md:hidden text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-[#1A3C2E]">
              Start free
            </Link>
            <button className="md:hidden p-1" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} className="text-[#1C1C1E]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: "#1A3C2E" }} role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-6 h-[68px] border-b border-white/10">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display text-xl font-semibold text-white">Careroot</span>
            </Link>
            <button onClick={() => setMobileOpen(false)} aria-label="Close" className="text-white/70 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center px-8 gap-2">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="py-4 text-xl font-body font-semibold uppercase tracking-wide text-white border-b border-white/10">
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="py-4 text-2xl font-display font-semibold text-white/60 border-b border-white/10">
              Sign in
            </Link>
            <div className="mt-8">
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-4 text-base font-semibold rounded-xl bg-white text-[#1A3C2E]">
                Start free trial — 30 days free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
