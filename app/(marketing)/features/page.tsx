import Link from "next/link";
import {
  Leaf, Brain, Shield, Heart, Smartphone, AlertTriangle,
  Users, FileText, ClipboardList, Bell, BarChart3, Lock,
  CheckCircle, ArrowRight, Sparkles, Calendar, MessageSquare,
  Activity, Pill, Camera, Mic
} from "lucide-react";
import { CRAIBadge } from "@/components/ui/CRAIBadge";

const features = [
  {
    icon: Brain,
    category: "AI-Powered Care",
    title: "AI care planning and risk analysis",
    desc: "Claude AI reads your carers' visit notes and generates structured care plans, spots deterioration patterns before they become crises, and flags safeguarding concerns in real time.",
    bullets: [
      "Automatic note structuring from free-text carer entries",
      "Risk flags for falls, nutrition decline, social isolation, medication concerns",
      "Care plan drafts ready in seconds, reviewed and approved by coordinators",
      "Appetite and fluid intake trend analysis over 14 days",
    ],
  },
  {
    icon: Shield,
    category: "CQC Compliance",
    title: "CQC 2026 Single Assessment Framework built in",
    desc: "Every interaction creates a compliance evidence trail. Our AI scores your service against all five CQC quality statements and tells you exactly what to fix before an inspection.",
    bullets: [
      "Real-time compliance score across Safe, Effective, Caring, Responsive, Well-led",
      "Evidence mapping to specific statement references",
      "Automated incident categorisation and investigation tracking",
      "Complaint log with 28-day timeline management",
    ],
  },
  {
    icon: Smartphone,
    category: "Carer Mobile App",
    title: "Everything your carers need at the point of care",
    desc: "A fast, offline-capable mobile interface built for carers working in the field. No training required — carers pick it up in under five minutes.",
    bullets: [
      "Today's visit list with full client profile",
      "Clock-in with GPS verification",
      "Voice note recording with automatic transcription",
      "Emergency button with one-tap 999-ready alert",
    ],
  },
  {
    icon: AlertTriangle,
    category: "Emergency Response",
    title: "Emergency QR cards and instant alerts",
    desc: "Every client gets a unique QR card that paramedics can scan for instant access to medications, DNR status, allergies, and GP details — no login required, PIN-protected.",
    bullets: [
      "PIN-protected emergency record for paramedics",
      "Instant SMS to on-call manager and family contacts",
      "Full medication list, DNR, allergies surfaced immediately",
      "Manager notified every time the emergency record is accessed",
    ],
  },
  {
    icon: Heart,
    category: "Family Engagement",
    title: "Families kept in the loop automatically",
    desc: "AI-generated family briefings sent weekly or on demand. Family members get a warm, plain-English summary of how their relative is doing — without putting extra work on your coordinators.",
    bullets: [
      "AI briefs drafted from visit notes and care records",
      "Coordinator reviews and approves before sending",
      "Branded emails with your agency name",
      "Audit trail of every brief sent and when",
    ],
  },
  {
    icon: Calendar,
    category: "Rota & Visits",
    title: "Intelligent rota and visit management",
    desc: "Schedule visits, assign carers, and track progress across your whole service in one view. Automated alerts when visits are missed or running late.",
    bullets: [
      "Drag-and-drop rota scheduling",
      "Automated missed-visit detection at 15 minutes overdue",
      "Visit handover notes shared between carers",
      "Mileage and travel time tracking",
    ],
  },
  {
    icon: Users,
    category: "Staff Management",
    title: "DBS tracking, training records, and burnout monitoring",
    desc: "Never miss a DBS renewal. Track mandatory training completion and get early warnings when a carer's workload is putting them at risk of burnout.",
    bullets: [
      "DBS expiry alerts at 90, 60, and 30 days",
      "Training record management with completion certificates",
      "Burnout risk scoring from visit patterns and feedback",
      "Secure right-to-work document storage",
    ],
  },
  {
    icon: Lock,
    category: "Security & Compliance",
    title: "NHS-grade security, UK data residency",
    desc: "All data stored in the UK, encrypted at rest and in transit. Multi-tenant architecture with complete data isolation between organisations. Fully GDPR-compliant.",
    bullets: [
      "Row-level security — no data leakage between organisations",
      "Full audit log of every action taken in the system",
      "Role-based access: owner, manager, coordinator, carer, family",
      "Two-factor authentication for all staff logins",
    ],
  },
];

export const metadata = {
  title: "Features — Careroot",
  description: "Every feature your care agency needs — AI care planning, CQC compliance, emergency response, family engagement, and more.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-body text-cr-forest font-medium">Features</Link>
            <Link href="/pricing" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Pricing</Link>
            <Link href="/demo" className="text-sm font-body text-cr-slate hover:text-cr-charcoal transition-colors">Book a Demo</Link>
            <Link href="/login" className="text-sm font-body text-cr-forest font-medium hover:text-cr-sage transition-colors">Sign in</Link>
            <Link href="/signup" className="cr-btn-primary text-sm px-4 py-2">Start free trial</Link>
          </div>
          <Link href="/signup" className="md:hidden cr-btn-primary text-sm px-3 py-1.5">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <CRAIBadge label="Powered by Claude AI" className="mb-6" />
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-cr-charcoal leading-tight mb-6">
            Everything a care agency needs.<br />
            <span className="text-cr-forest">Nothing it doesn't.</span>
          </h1>
          <p className="text-lg font-body text-cr-slate mb-8 max-w-xl leading-relaxed">
            Built specifically for UK domiciliary care providers. Every feature exists because a care coordinator told us they needed it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="cr-btn-primary px-6 py-3 text-base flex items-center justify-center gap-2">
              Start free trial
              <ArrowRight size={18} />
            </Link>
            <Link href="/demo" className="cr-btn-secondary px-6 py-3 text-base flex items-center justify-center gap-2">
              Book a demo
            </Link>
          </div>
          <p className="mt-3 text-xs font-body text-cr-slate">30 days free · No credit card required · Set up in under an hour</p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="border border-gray-100 rounded-2xl p-8 hover:border-cr-forest/30 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cr-mint flex items-center justify-center">
                    <Icon size={20} className="text-cr-forest" />
                  </div>
                  <span className="text-xs font-body font-semibold text-cr-forest uppercase tracking-wide">{f.category}</span>
                </div>
                <h2 className="font-display text-2xl font-semibold text-cr-charcoal mb-3">{f.title}</h2>
                <p className="text-cr-slate font-body text-sm leading-relaxed mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm font-body text-cr-slate">
                      <CheckCircle size={15} className="text-cr-forest mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integrations strip */}
      <section className="bg-cr-ivory py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-center text-xs font-body font-semibold text-cr-slate uppercase tracking-widest mb-8">Works with</p>
          <div className="flex flex-wrap justify-center gap-8 items-center text-cr-slate font-body text-sm font-medium">
            {["NHS Spine (planned)", "Anthropic Claude AI", "OpenAI Whisper", "Twilio SMS", "Resend Email", "Stripe Billing"].map((i) => (
              <span key={i} className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-xs">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CQC callout */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="bg-cr-forest rounded-2xl p-10 md:p-14 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-body font-medium mb-6">
              <Shield size={12} />
              CQC 2026 Single Assessment Framework
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Built for the inspection you haven't had yet.
            </h2>
            <p className="text-white/75 font-body text-base leading-relaxed mb-8">
              The CQC's 2026 framework puts AI-assisted evidence at the centre of how services are assessed. Careroot generates that evidence automatically — from every visit note, every incident, every family update.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-cr-forest font-body font-semibold text-sm px-6 py-3 rounded-lg hover:bg-cr-ivory transition-colors">
                Start free trial
                <ArrowRight size={16} />
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-body text-sm px-6 py-3 rounded-lg hover:border-white/60 transition-colors">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={13} className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-cr-charcoal">Careroot</span>
          </div>
          <div className="flex gap-6 text-sm font-body text-cr-slate">
            <Link href="/features" className="hover:text-cr-charcoal transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-cr-charcoal transition-colors">Pricing</Link>
            <Link href="/demo" className="hover:text-cr-charcoal transition-colors">Demo</Link>
            <Link href="/login" className="hover:text-cr-charcoal transition-colors">Sign in</Link>
          </div>
          <p className="text-xs font-body text-cr-slate">© 2026 Careroot Ltd · UK care management platform</p>
        </div>
      </footer>
    </div>
  );
}
