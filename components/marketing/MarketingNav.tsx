"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, ShieldCheck, Smartphone, Heart, UtensilsCrossed, AlertTriangle,
  FileText, Users, Lock, Zap, Home, Building, Building2, Stethoscope,
  Star, Award, HelpCircle, BookOpen, Code, MessageCircle, Calendar,
  Crown, ChevronDown, ArrowRight, Menu, X, Leaf,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DropdownLink {
  icon: React.ElementType;
  headline: string;
  subtext: string;
  href: string;
  iconColour?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PLATFORM_LEFT: DropdownLink[] = [
  { icon: Brain, headline: "AI Care Planning", subtext: "Care plans drafted in minutes", href: "/features#ai" },
  { icon: ShieldCheck, headline: "CQC Compliance", subtext: "2026 Single Assessment Framework", href: "/features#compliance" },
  { icon: Smartphone, headline: "Carer Mobile App", subtext: "Offline-capable, one-handed use", href: "/features#carer" },
  { icon: Heart, headline: "Family Portal", subtext: "Real-time updates for families", href: "/features#family" },
  { icon: UtensilsCrossed, headline: "Nutrition Planning", subtext: "Step-by-step meal instructions", href: "/features#nutrition" },
  { icon: AlertTriangle, headline: "Emergency Response", subtext: "SOS cascade and paramedic access", href: "/features#emergency", iconColour: "#DC2626" },
];

const PLATFORM_RIGHT: DropdownLink[] = [
  { icon: FileText, headline: "Complaints Management", subtext: "28-day CQC tracker built in", href: "/features#complaints" },
  { icon: Users, headline: "Staff Management", subtext: "DBS tracking and burnout monitoring", href: "/features#staff" },
  { icon: Lock, headline: "Security", subtext: "NHS-grade, UK data residency", href: "/features#security" },
  { icon: Zap, headline: "White Label", subtext: "Your brand, our platform", href: "/white-label", iconColour: "#C9A84C" },
];

const SOLUTIONS: DropdownLink[] = [
  { icon: Home, headline: "Domiciliary Care", subtext: "Home care agencies of all sizes", href: "/features" },
  { icon: Building, headline: "Supported Living", subtext: "Learning disability and mental health", href: "/features" },
  { icon: Building2, headline: "Residential Care", subtext: "Care homes and nursing homes", href: "/features" },
  { icon: Stethoscope, headline: "NHS Community Teams", subtext: "White label for NHS providers", href: "/white-label" },
  { icon: Star, headline: "New Care Agencies", subtext: "Preparing for CQC registration", href: "/features" },
  { icon: Award, headline: "Large Care Groups", subtext: "Multi-site enterprise and white label", href: "/white-label" },
];

const RESOURCES: DropdownLink[] = [
  { icon: HelpCircle, headline: "FAQ", subtext: "Answers to common questions", href: "/faq" },
  { icon: BookOpen, headline: "CQC Preparation Guide", subtext: "Free guide to CQC registration", href: "/faq#cqc" },
  { icon: Code, headline: "API Documentation", subtext: "For developers and integrations", href: "/features#security" },
  { icon: MessageCircle, headline: "Contact Us", subtext: "We reply within 2 hours", href: "/contact" },
  { icon: Calendar, headline: "Book a Demo", subtext: "30-minute tailored walkthrough", href: "/demo" },
];

// ─── Dropdown link row ────────────────────────────────────────────────────────

function DropLink({ item, onClick }: { item: DropdownLink; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-[#E8F5EE] transition-colors group"
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={18} style={{ color: item.iconColour ?? "#1A3C2E" }} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#1C1C1E] leading-snug">{item.headline}</p>
        <p className="text-xs text-[#6B7280] leading-snug mt-0.5">{item.subtext}</p>
      </div>
    </Link>
  );
}

// ─── Desktop dropdown panel ───────────────────────────────────────────────────

function PlatformDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-1 w-[520px] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-dropdown">
      <div className="p-6 grid grid-cols-2 gap-x-4">
        {/* Left column */}
        <div>
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">Features</p>
          <div className="space-y-0.5">
            {PLATFORM_LEFT.map((item) => (
              <DropLink key={item.href + item.headline} item={item} onClick={onClose} />
            ))}
          </div>
        </div>
        {/* Divider */}
        <div className="border-l border-gray-100 pl-4">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">More</p>
          <div className="space-y-0.5">
            {PLATFORM_RIGHT.map((item) => (
              <DropLink key={item.href + item.headline} item={item} onClick={onClose} />
            ))}
          </div>
        </div>
      </div>
      {/* Footer strip */}
      <div className="bg-[#E8F5EE] border-t border-gray-200 px-6 py-3 flex items-center justify-between rounded-b-xl">
        <Link href="/features" onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium text-[#1A3C2E] hover:text-[#4A7C5E] transition-colors">
          See all features <ArrowRight size={14} />
        </Link>
        <Link href="/signup" onClick={onClose} className="text-sm font-medium text-[#1A3C2E] hover:text-[#4A7C5E] transition-colors">
          Start free trial →
        </Link>
      </div>
    </div>
  );
}

function SolutionsDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-1 w-[400px] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-dropdown">
      <div className="p-6">
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">By Care Type</p>
        <div className="space-y-0.5">
          {SOLUTIONS.map((item) => (
            <DropLink key={item.href + item.headline} item={item} onClick={onClose} />
          ))}
        </div>
      </div>
      <div className="bg-[#E8F5EE] border-t border-gray-200 px-6 py-3 flex items-center justify-between rounded-b-xl">
        <Link href="/features" onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium text-[#1A3C2E] hover:text-[#4A7C5E] transition-colors">
          Explore all solutions <ArrowRight size={14} />
        </Link>
        <Link href="/demo" onClick={onClose} className="text-sm font-medium text-[#1A3C2E] hover:text-[#4A7C5E] transition-colors">
          Talk to enterprise sales →
        </Link>
      </div>
    </div>
  );
}

function ResourcesDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-1 w-[300px] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-dropdown">
      <div className="p-6">
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">Help and Information</p>
        <div className="space-y-0.5">
          {RESOURCES.map((item) => (
            <DropLink key={item.href + item.headline} item={item} onClick={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop nav item with hover dropdown ─────────────────────────────────────

type DropdownKey = "platform" | "solutions" | "resources" | null;

function NavDropdownItem({
  label,
  dropKey,
  activeDropdown,
  setActiveDropdown,
  children,
  isTransparent,
}: {
  label: string;
  dropKey: DropdownKey;
  activeDropdown: DropdownKey;
  setActiveDropdown: (k: DropdownKey) => void;
  children: React.ReactNode;
  isTransparent: boolean;
}) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpen = activeDropdown === dropKey;

  const open = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(dropKey);
  }, [dropKey, setActiveDropdown]);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  }, [setActiveDropdown]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const textColour = isTransparent ? "text-white/90 hover:text-white" : "text-[#1C1C1E] hover:text-[#1A3C2E]";

  return (
    <div
      className="relative"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <button
        className={`flex items-center gap-1 text-sm font-medium transition-colors duration-150 py-1 ${textColour}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setActiveDropdown(isOpen ? null : dropKey)}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Mobile accordion section ─────────────────────────────────────────────────

function MobileSection({
  label,
  items,
  onClose,
}: {
  label: string;
  items: DropdownLink[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        className="w-full flex items-center justify-between py-4 text-lg font-medium text-white"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown size={18} className={`transition-transform duration-200 text-white/60 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-4 space-y-1 pl-2">
          {items.map((item) => (
            <Link
              key={item.href + item.headline}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 py-2.5"
            >
              <item.icon size={16} className="text-white/50 flex-shrink-0" />
              <span className="text-base text-white/80">{item.headline}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Announcement banner ──────────────────────────────────────────────────────

function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("cr_banner_dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("cr_banner_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-[#C9A84C] h-10 flex items-center justify-center px-4 relative">
      <p className="text-white text-sm font-body text-center">
        🎉 30-day free trial on all plans — no credit card required.{" "}
        <Link href="/signup" className="font-semibold underline underline-offset-2 hover:text-white/80 transition-colors">
          Start today →
        </Link>
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="absolute right-4 text-white/70 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Main nav ─────────────────────────────────────────────────────────────────

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);

  const isHomepage = pathname === "/";
  const isTransparent = isHomepage && !scrolled;

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const activeLinkClass = (href: string) =>
    isActive(href)
      ? "text-[#1A3C2E] border-b-2 border-[#1A3C2E] pb-0.5"
      : "";

  const linkColour = isTransparent
    ? "text-white/90 hover:text-white"
    : "text-[#1C1C1E] hover:text-[#1A3C2E]";

  return (
    <>
      <AnnouncementBanner />

      <nav
        className={`sticky top-0 z-50 transition-all duration-200 ${
          isTransparent ? "bg-transparent" : "bg-white border-b border-gray-100"
        } ${scrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-[68px]">

          {/* ── LEFT: Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Careroot home">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1A3C2E" }}>
              <Leaf size={16} className="text-white" />
            </div>
            <span
              className={`font-display text-xl font-semibold transition-colors ${
                isTransparent ? "text-white" : "text-[#1C1C1E]"
              }`}
            >
              Careroot
            </span>
          </Link>

          {/* ── CENTRE: Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-7">
            {/* Platform */}
            <NavDropdownItem
              label="Platform"
              dropKey="platform"
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isTransparent={isTransparent}
            >
              <PlatformDropdown onClose={() => setActiveDropdown(null)} />
            </NavDropdownItem>

            {/* Solutions */}
            <NavDropdownItem
              label="Solutions"
              dropKey="solutions"
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isTransparent={isTransparent}
            >
              <SolutionsDropdown onClose={() => setActiveDropdown(null)} />
            </NavDropdownItem>

            {/* Pricing */}
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors duration-150 ${linkColour} ${activeLinkClass("/pricing")}`}
            >
              Pricing
            </Link>

            {/* Resources */}
            <NavDropdownItem
              label="Resources"
              dropKey="resources"
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isTransparent={isTransparent}
            >
              <ResourcesDropdown onClose={() => setActiveDropdown(null)} />
            </NavDropdownItem>

            {/* White Label — gold */}
            <Link
              href="/white-label"
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-150 hover:opacity-80 ${activeLinkClass("/white-label")}`}
              style={{ color: "#C9A84C" }}
            >
              <Crown size={12} style={{ color: "#C9A84C" }} />
              White Label
            </Link>
          </div>

          {/* ── RIGHT: Auth + mobile toggle ── */}
          <div className="flex items-center gap-4">
            {/* Desktop auth */}
            <Link
              href="/login"
              className={`hidden md:block text-sm font-medium transition-colors duration-150 ${
                isTransparent ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#1C1C1E]"
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden md:block text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ backgroundColor: "#1A3C2E" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4A7C5E")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1A3C2E")}
            >
              Start free trial
            </Link>

            {/* Mobile: Start free + menu toggle */}
            <Link
              href="/signup"
              className="md:hidden text-xs font-medium text-white px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#1A3C2E" }}
            >
              Start free
            </Link>
            <button
              className="md:hidden p-1 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={24} style={{ color: isTransparent ? "#ffffff" : "#1C1C1E" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: "#1A3C2E" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Overlay header */}
          <div className="flex items-center justify-between px-6 h-[60px] flex-shrink-0 border-b border-white/10">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display text-xl font-semibold text-white">Careroot</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-1 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Overlay nav */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <MobileSection label="Platform" items={[...PLATFORM_LEFT, ...PLATFORM_RIGHT]} onClose={() => setMobileOpen(false)} />
            <MobileSection label="Solutions" items={SOLUTIONS} onClose={() => setMobileOpen(false)} />

            <div className="border-b border-white/10">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block py-4 text-lg font-medium text-white"
              >
                Pricing
              </Link>
            </div>

            <MobileSection label="Resources" items={RESOURCES} onClose={() => setMobileOpen(false)} />

            <div className="border-b border-white/10">
              <Link
                href="/white-label"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-4 text-lg font-medium"
                style={{ color: "#C9A84C" }}
              >
                <Crown size={16} style={{ color: "#C9A84C" }} />
                White Label
              </Link>
            </div>

            {/* Auth */}
            <div className="mt-8 space-y-3 pb-8">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-3 text-base font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-3 text-base font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: "#ffffff", color: "#1A3C2E" }}
              >
                Start free trial — 30 days free
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Dropdown animation styles ── */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdown {
          animation: dropdownIn 150ms ease-out forwards;
        }
      `}</style>
    </>
  );
}
