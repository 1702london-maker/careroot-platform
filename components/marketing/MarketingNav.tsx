"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Menu, X } from "lucide-react";

export function MarketingNav() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setScrolled(true);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomepage]);

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

  const transparent = isHomepage && !scrolled;

  const navBg = transparent ? "bg-transparent" : "bg-white border-b border-gray-100 shadow-sm";
  const logoText = transparent ? "text-white" : "text-[#1C1C1E]";
  const logoIconBg = transparent ? "bg-white/20" : "bg-[#1A3C2E]";
  const signInColour = transparent ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#1C1C1E]";
  const trialBtn = transparent
    ? "bg-white text-[#1A3C2E] hover:bg-white/90"
    : "bg-[#1A3C2E] text-white hover:bg-[#4A7C5E]";
  const menuIconColour = transparent ? "#ffffff" : "#1C1C1E";

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    if (transparent) return "text-white hover:text-white/80";
    return isActive
      ? "text-[#1A3C2E]"
      : "text-[#1C1C1E] hover:text-[#1A3C2E]";
  };

  const NAV_LINKS = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Custom App", href: "/custom-app" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Careroot home">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${logoIconBg}`}>
              <Leaf size={16} className="text-white" />
            </div>
            <span className={`font-display text-xl font-semibold transition-colors ${logoText}`}>
              Careroot
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className={`text-sm font-medium transition-colors duration-150 ${linkClass(href)}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <Link href="/login" className={`hidden md:block text-sm font-medium transition-colors duration-150 ${signInColour}`}>
              Sign in
            </Link>
            <Link href="/signup" className={`hidden md:block text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 ${trialBtn}`}>
              Start free trial
            </Link>
            <Link href="/signup" className="md:hidden text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-[#1A3C2E]">
              Start free
            </Link>
            <button className="md:hidden p-1" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} style={{ color: menuIconColour }} />
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
                className="py-4 text-2xl font-display font-semibold text-white border-b border-white/10">
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
