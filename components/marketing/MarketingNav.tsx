"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Menu, X } from "lucide-react";

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          <Link href="/features" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Pricing</Link>
          <Link href="/white-label" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">White Label</Link>
          <Link href="/demo" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Book a Demo</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-body text-cr-forest font-medium hover:text-cr-sage transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-cr-forest text-white text-sm font-body font-semibold px-4 py-2 rounded-lg hover:bg-cr-sage transition-colors">
            Start free trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-cr-charcoal"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {[
            ["Features", "/features"],
            ["Pricing", "/pricing"],
            ["White Label", "/white-label"],
            ["Book a Demo", "/demo"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="block text-sm font-body text-cr-charcoal py-2 border-b border-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1 text-center text-sm font-body text-cr-forest border border-cr-forest rounded-lg py-2">
              Sign in
            </Link>
            <Link href="/signup" className="flex-1 text-center text-sm font-body font-semibold bg-cr-forest text-white rounded-lg py-2">
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
