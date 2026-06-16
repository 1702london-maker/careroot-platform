import Link from "next/link";
import {
  Brain, ShieldCheck, AlertTriangle, Heart, Smartphone,
  UtensilsCrossed, MessageSquare, Users, Lock, CheckCircle,
  ArrowRight, Sparkles, AlertCircle, QrCode, Shield,
  Mic, FileText, Star, Crown,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const JUMP_LINKS = [
  { label: "AI Care Planning", id: "ai" },
  { label: "CQC Compliance", id: "compliance" },
  { label: "Emergency", id: "emergency" },
  { label: "Carer App", id: "carer" },
  { label: "Family Portal", id: "family" },
  { label: "Nutrition", id: "nutrition" },
  { label: "Complaints", id: "complaints" },
  { label: "Staff", id: "staff" },
  { label: "Security", id: "security" },
  { label: "White Label", id: "white-label" },
];

function SectionBadge({ children, colour = "forest" }: { children: React.ReactNode; colour?: "forest" | "gold" | "red" | "sage" }) {
  const classes = {
    forest: "bg-cr-mint text-cr-forest border-cr-sage/20",
    gold: "bg-cr-gold/10 text-cr-gold border-cr-gold/20",
    red: "bg-red-50 text-cr-red border-red-100",
    sage: "bg-cr-mint text-cr-sage border-cr-sage/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold border ${classes[colour]} mb-5`}>
      {children}
    </span>
  );
}

function FeatureCheck({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle size={15} className={`mt-0.5 flex-shrink-0 ${gold ? "text-cr-gold" : "text-cr-sage"}`} />
      <span className="text-sm font-body text-cr-charcoal leading-relaxed">{children}</span>
    </li>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="bg-cr-ivory py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cr-mint text-cr-forest text-xs font-body font-semibold border border-cr-sage/20 mb-6">
            200+ features. One platform.
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-cr-charcoal leading-tight mb-5 max-w-3xl">
            Everything a care agency needs. Nothing it doesn&rsquo;t.
          </h1>
          <p className="text-lg font-body text-cr-slate mb-10 max-w-2xl leading-relaxed">
            Every feature exists because a care coordinator, registered manager, or CQC inspector told us they needed it. Built for the real world of UK domiciliary and supported living care.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link href="/signup" className="bg-cr-forest text-white rounded-xl px-6 py-3 font-body font-semibold text-sm hover:bg-cr-sage transition-colors flex items-center justify-center gap-2">
              Start free trial <ArrowRight size={16} />
            </Link>
            <Link href="/demo" className="border border-cr-forest text-cr-forest rounded-xl px-6 py-3 font-body font-semibold text-sm hover:bg-cr-mint transition-colors flex items-center justify-center">
              Book a demo
            </Link>
          </div>

          {/* Jump links */}
          <div className="flex flex-wrap gap-2">
            {JUMP_LINKS.map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-body font-semibold text-cr-charcoal hover:border-cr-forest hover:text-cr-forest transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 1: AI CARE PLANNING ── */}
      <section id="ai" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="gold">
            <Sparkles size={12} />
            AI-powered
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            Care plans that write themselves.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-2xl leading-relaxed">
            Stop spending 3 hours on a care plan. Careroot AI drafts it from your assessment data in seconds. Your coordinator reviews, edits, and approves. The AI learns from your service&rsquo;s language and preferences over time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-14">
            <ul className="space-y-4">
              {[
                "Full 6-step client onboarding wizard capturing every detail",
                "AI generates a complete care plan from onboarding data",
                "All 10 care plan sections including nutrition and cultural preferences",
                "Manager reviews and approves — never auto-activated",
                "Nine care plan templates across all care categories",
                "Import existing paper care plans via PDF — AI structures them digitally",
                "Full version history with every change logged",
                "Care plan views logged automatically as CQC evidence",
              ].map((item) => <FeatureCheck key={item} gold>{item}</FeatureCheck>)}
            </ul>

            {/* Mock care plan card */}
            <div className="bg-cr-charcoal rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-body font-semibold text-white/40 uppercase tracking-widest">Care Plan Draft</span>
                <span className="px-2.5 py-1 bg-cr-gold/20 text-cr-gold text-xs font-body font-bold rounded-full border border-cr-gold/30 flex items-center gap-1">
                  <Sparkles size={10} /> AI Draft
                </span>
              </div>
              <h4 className="font-display text-lg font-semibold text-white mb-4">Margaret Davies — Personal Care Plan</h4>
              <div className="space-y-2">
                {[
                  "1. Personal Profile & Background",
                  "2. Communication & Sensory Needs",
                  "3. Personal Care & Hygiene",
                  "4. Nutrition & Hydration",
                  "5. Mobility & Moving",
                  "6. Medication Management",
                  "7. Safety & Risk Assessment",
                  "8. Social & Wellbeing",
                  "9. Emergency Contacts & DNR",
                  "10. Review & Monitoring",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <CheckCircle size={13} className="text-cr-sage flex-shrink-0" />
                    <span className="text-sm font-body text-white/70">{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-cr-forest text-white text-xs font-body font-semibold">Approve</button>
                <button className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 text-xs font-body font-semibold">Request edits</button>
              </div>
            </div>
          </div>

          {/* Sub-feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Mic size={18} className="text-cr-gold" />,
                title: "Voice Notes",
                body: "Carers speak their notes. AI structures them into clinical format automatically — observations, mood, concerns, actions. All organised without extra work.",
              },
              {
                icon: <Brain size={18} className="text-cr-gold" />,
                title: "Risk Pattern Detection",
                body: "AI analyses 30 days of visit notes, medications, meals, and incidents per client. Flags deterioration patterns before they become crises. Evidence-cited and urgent when urgent.",
              },
              {
                icon: <FileText size={18} className="text-cr-gold" />,
                title: "Paper Import",
                body: "Upload existing paper care plans as PDF. AI reads every page and converts to digital format. Manager reviews each one before it goes live.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-cr-ivory rounded-2xl p-6 border border-cr-sage/20">
                <div className="w-9 h-9 rounded-xl bg-cr-gold/10 flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">{card.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CQC COMPLIANCE ── */}
      <section id="compliance" className="bg-cr-ivory py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="forest">
            <ShieldCheck size={12} />
            CQC 2026 Ready
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            Know your inspection score before the inspector does.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-2xl leading-relaxed">
            Careroot maps every interaction — every visit note, every medication record, every complaint — to the CQC 2026 Single Assessment Framework. You always know where you stand.
          </p>

          {/* Five CQC key questions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { q: "Safe", score: 82 },
              { q: "Effective", score: 91 },
              { q: "Caring", score: 88 },
              { q: "Responsive", score: 79 },
              { q: "Well-led", score: 85 },
            ].map(({ q, score }) => (
              <div key={q} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-widest mb-3">{q}</p>
                <p className="font-display text-3xl font-semibold text-cr-forest mb-2">{score}%</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-cr-forest h-1.5 rounded-full" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <ul className="space-y-4">
              {[
                "Live compliance score across all 5 CQC key questions",
                "All 34 quality statements mapped and evidenced",
                "Ofsted framework module for children and young people services",
                "Real-time evidence library with document upload",
                "AI assessment of uploaded evidence against framework",
                "Compliance gaps identified with priority ranking",
                "Quick wins suggested by AI",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
            <ul className="space-y-4">
              {[
                "Every carer visit creates compliance evidence automatically",
                "Care plan views logged — evidence carers read plans",
                "Incident categorisation and investigation tracking",
                "Complaint log with mandatory 28-day timeline",
                "DBS and training compliance tracking",
                "Staff wellbeing monitoring for Well-led evidence",
                "Export full evidence pack for inspection",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
          </div>

          <div className="bg-cr-forest rounded-2xl p-7">
            <p className="font-display text-xl font-semibold text-white mb-2">Built for CQC 2026</p>
            <p className="text-sm font-body text-white/70 leading-relaxed max-w-3xl">
              The CQC&rsquo;s 2026 Single Assessment Framework requires digital evidence at the centre of how services are assessed. Careroot generates that evidence from every interaction — automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: EMERGENCY ── */}
      <section id="emergency" className="bg-cr-charcoal py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold border bg-red-500/20 text-red-400 border-red-500/30 mb-5">
            <AlertCircle size={12} />
            No other platform has this
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-5">
            Built for the moments that matter most.
          </h2>
          <p className="text-base font-body text-white/60 mb-14 max-w-xl leading-relaxed">
            Every care agency will face a medical emergency. Most are not prepared. Careroot is.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* SOS */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
              <AlertCircle size={36} className="text-cr-red mb-5" />
              <h3 className="font-display text-xl font-semibold text-white mb-3">One-tap emergency cascade</h3>
              <p className="text-sm font-body text-white/60 mb-5 leading-relaxed">
                The red SOS button is fixed at the bottom of every carer&rsquo;s visit screen — always visible, never scrolled away. One tap and simultaneously: SMS to on-call manager with GPS, SMS to all emergency contacts, email to GP, incident auto-created, event logged with full details.
              </p>
              <div className="flex flex-wrap gap-2">
                {["SMS cascade", "WhatsApp alerts", "Voice call", "Auto incident", "GPS logged"].map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-cr-red/20 text-red-400 text-xs font-body font-semibold rounded-full border border-cr-red/30">{t}</span>
                ))}
              </div>
            </div>

            {/* QR */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
              <QrCode size={36} className="text-cr-red mb-5" />
              <h3 className="font-display text-xl font-semibold text-white mb-3">Full medical record in 10 seconds — no login</h3>
              <p className="text-sm font-body text-white/60 mb-5 leading-relaxed">
                Every client gets a unique QR code and 6-digit PIN generated at onboarding. The manager prints an A5 card — it goes on the client&rsquo;s fridge door. When paramedics arrive: scan QR, see full medical record immediately.
              </p>
              <p className="text-xs font-body text-white/40 mb-3 uppercase tracking-widest font-semibold">Paramedics see</p>
              <ul className="space-y-1.5">
                {[
                  "DNR status — red banner if applicable",
                  "Full active medication list",
                  "All allergies with severity",
                  "Medical conditions and diagnoses",
                  "GP name and phone number",
                  "Emergency contacts",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-cr-red flex-shrink-0" />
                    <span className="text-xs font-body text-white/50">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-body text-white/30 mt-4">Access time-limited to 4 hours. Manager notified by SMS instantly.</p>
            </div>

            {/* DNR */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
              <Shield size={36} className="text-cr-red mb-5" />
              <h3 className="font-display text-xl font-semibold text-white mb-3">Family and client SOS</h3>
              <p className="text-sm font-body text-white/60 mb-5 leading-relaxed">
                The SOS button is not just for carers. Family members on the portal have a visible emergency button. Clients with portal access have one too. Same cascade. Same response. Because emergencies don&rsquo;t only happen during visits.
              </p>
              <div className="bg-cr-red/10 border border-cr-red/20 rounded-xl p-4">
                <p className="text-xs font-body font-semibold text-red-400 mb-1">DNR status cannot be missed</p>
                <p className="text-xs font-body text-white/50 leading-relaxed">
                  Do Not Resuscitate status displays as a red banner at the top of every screen — care plans, visit screens, paramedic access, family portal. Every person sees it immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cr-red rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-5">
            <p className="font-display text-xl md:text-2xl font-semibold text-white">
              Is your agency ready for a medical emergency right now?
            </p>
            <Link href="/signup" className="flex-shrink-0 bg-white text-cr-red rounded-xl px-6 py-3 font-body font-semibold text-sm hover:bg-red-50 transition-colors">
              Start free trial →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CARER APP ── */}
      <section id="carer" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="sage">PWA — no app store required</SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            Your carers will actually use this one.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-xl leading-relaxed">
            Built for one-handed use on any smartphone. No training required. Carers pick it up in under 5 minutes. Works completely offline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-14">
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">Today&rsquo;s visits</h3>
                <ul className="space-y-3">
                  {[
                    "All visits for the day in chronological order",
                    "Client photo, name, address, risk level badge",
                    "DNR and allergy banners load first — before anything else",
                    "Tap to open active visit",
                  ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">During a visit — 5 tabs</h3>
                <div className="space-y-4">
                  {[
                    {
                      tab: "Overview",
                      items: ["Full care plan summary", "GPS check-in and check-out", "Care plan view logged as evidence", "Notifications to managers when plan updated"],
                    },
                    {
                      tab: "Tasks",
                      items: ["Task checklist from care plan", "Large tap targets — designed for one hand", "Notes per task"],
                    },
                    {
                      tab: "Medications",
                      items: ["Every medication due at this visit", "Four-button recording: Given, Refused, Unavailable, Not Required", "Allergy reminder above medication list"],
                    },
                    {
                      tab: "Meals",
                      items: ["Meals scheduled for this visit", "Allergy warnings before every meal", "Step-by-step numbered preparation instructions", "Record consumption and fluid intake in ml"],
                    },
                    {
                      tab: "Notes",
                      items: ["Typed notes or voice recording", "Voice: tap record, speak, tap stop, see transcript", "AI structures note automatically on save"],
                    },
                  ].map(({ tab, items }) => (
                    <div key={tab}>
                      <p className="text-xs font-body font-semibold text-cr-forest uppercase tracking-widest mb-2">{tab}</p>
                      <ul className="space-y-2 pl-3">
                        {items.map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Device mockups */}
            <div className="space-y-4">
              {[
                {
                  label: "Today's visits",
                  items: ["09:00 — Margaret Davies · High risk", "11:30 — John Smith · Medium risk", "14:00 — Patricia Brown · Low risk"],
                },
                {
                  label: "Active visit — Medications",
                  items: ["⚠ ALLERGY: Penicillin", "Amlodipine 5mg — Given ✓", "Ramipril 10mg — Given ✓", "Metformin 500mg — Refused"],
                },
                {
                  label: "Meal preparation — Scrambled Eggs",
                  items: ["Step 1: Crack 2 eggs into a bowl", "Step 2: Add splash of milk, whisk", "Step 3: Cook on low heat — stir slowly", "Note: Margaret likes them soft, not dry"],
                },
              ].map(({ label, items }) => (
                <div key={label} className="bg-cr-charcoal rounded-2xl p-5 border border-white/10">
                  <p className="text-xs font-body font-semibold text-white/40 uppercase tracking-widest mb-4">{label}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-cr-sage flex-shrink-0" />
                        <span className="text-xs font-body text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Offline callout */}
          <div className="bg-cr-mint border border-cr-sage/30 rounded-2xl p-8">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-cr-forest flex items-center justify-center flex-shrink-0">
                <Smartphone size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Works underground. In a basement. In rural areas with no signal.</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">
                  Careroot caches everything needed for each visit before carers leave the house. Complete the entire visit offline — notes, medications, meals, tasks, check-in, check-out. Everything syncs automatically the moment signal returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FAMILY PORTAL ── */}
      <section id="family" className="bg-cr-ivory py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="sage">
            <Heart size={12} />
            Family engagement
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            Give families the visibility they deserve.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-2xl leading-relaxed">
            When families can see what&rsquo;s happening, they trust your agency. When they trust your agency, they refer you to others. The family portal is your best marketing tool.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              { level: "Limited", items: ["Weekly AI briefings", "Direct message thread", "Meal records"] },
              { level: "Standard", items: ["All Limited features", "Live visit status", "Visit notes", "Care plan view", "Medication summary", "Incident reports", "Complaints portal"] },
              { level: "Full", items: ["All Standard features", "AI risk flag summaries", "Full nutrition records", "Family meal suggestions"] },
            ].map(({ level, items }) => (
              <div key={level} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-xs font-body font-semibold text-cr-forest uppercase tracking-widest mb-4">{level} Access</p>
                <ul className="space-y-2.5">
                  {items.map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <ul className="space-y-4">
              {[
                "Live visit status: see when carer has arrived and how long they stayed",
                "Full visit notes — manager controls what family can see",
                "Active care plan in read-only format",
                "Medication list and daily eMAR summary",
                "Incident reports filtered by severity",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
            <ul className="space-y-4">
              {[
                "Weekly AI briefings in warm, plain English",
                "Nutrition profile and meal records per visit",
                "Submit and track complaints directly",
                "Suggest meals with step-by-step instructions for manager approval",
                "Direct message thread with care manager",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
          </div>

          {/* Meal suggestion callout */}
          <div className="bg-cr-charcoal rounded-2xl p-8">
            <p className="font-display text-2xl font-semibold text-white mb-3">
              &ldquo;She loves Nigerian pepper soup on cold days.&rdquo;
            </p>
            <p className="text-sm font-body text-white/60 leading-relaxed max-w-2xl">
              The client&rsquo;s daughter knows her mum loves pepper soup in winter and remembers exactly how she makes it. She submits the recipe with steps. Manager approves. It appears on the carer&rsquo;s visit screen the next morning. That is person-centred care.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: NUTRITION ── */}
      <section id="nutrition" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="gold">Person-centred care starts here</SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            Margaret only eats from the blue plates.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-xl leading-relaxed">
            Care plans describe what support someone needs. Food plans describe who they are. Careroot captures both.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">Dietary profile</h3>
                <ul className="space-y-3">
                  {[
                    "Diet type, allergies with severity, intolerances",
                    "Loved foods and foods to avoid",
                    "IDDSI-standard texture requirements (5 levels)",
                    "Daily fluid targets in ml with thickener requirements",
                    "Nutritional supplements and special diets",
                  ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">Step-by-step meal instructions</h3>
                <ul className="space-y-3">
                  {[
                    "Numbered preparation steps for every meal",
                    "Notes and warnings per step",
                    "Cultural significance of food noted",
                    "Weekly traditions (fish and chips every Friday)",
                    "Special occasion meals",
                    "Foods connected to memories and personal history",
                  ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-3">AI appetite analysis</h3>
                <ul className="space-y-3">
                  {[
                    "Detects reduced appetite patterns over 14 days",
                    "Flags inadequate fluid intake trends",
                    "Identifies sudden changes indicating health deterioration",
                    "Alerts manager with evidence and recommended actions",
                  ].map((item) => <FeatureCheck key={item} gold>{item}</FeatureCheck>)}
                </ul>
              </div>
            </div>

            {/* Mock meal preparation card */}
            <div className="bg-cr-charcoal rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-body font-semibold text-white/40 uppercase tracking-widest">Meal Preparation</span>
              </div>
              <h4 className="font-display text-lg font-semibold text-white mb-1">Scrambled Eggs — John&rsquo;s way</h4>
              <p className="text-xs font-body text-white/40 mb-4">Breakfast · Est. 8 minutes</p>
              <div className="bg-cr-red/20 border border-cr-red/30 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs font-body font-bold text-red-400">⚠ ALLERGY: Dairy — use oat milk only</p>
              </div>
              <div className="space-y-3">
                {[
                  { n: 1, step: "Crack 2 eggs into a bowl, add 2 tbsp oat milk" },
                  { n: 2, step: "Whisk well until combined and slightly frothy" },
                  { n: 3, step: "Heat pan on low — John likes it soft, not rubbery" },
                  { n: 4, step: "Stir slowly and continuously — remove while still soft" },
                  { n: 5, step: "Serve on the blue plates — he won't eat from other plates" },
                ].map(({ n, step }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cr-forest text-white text-xs font-body font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                    <span className="text-sm font-body text-white/70 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-body text-white/40 mb-3 uppercase tracking-widest font-semibold">Record intake</p>
                <div className="grid grid-cols-2 gap-2">
                  {["All of it", "Most of it", "About half", "Very little"].map((option) => (
                    <button key={option} className="py-2 rounded-lg bg-white/5 text-white/60 text-xs font-body hover:bg-cr-forest hover:text-white transition-colors">
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: COMPLAINTS ── */}
      <section id="complaints" className="bg-cr-ivory py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="forest">
            <MessageSquare size={12} />
            Complaints management
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5 max-w-2xl">
            CQC compliance starts with how you handle complaints.
          </h2>
          <p className="text-base font-body text-cr-slate mb-12 max-w-2xl leading-relaxed">
            A complaint handled well is evidence of a well-led service. Careroot makes sure every complaint is logged, tracked, and resolved within the legal 28-day requirement.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            {[
              "Accessible from family portal, manager dashboard, and client profile",
              "Client describes complaint in their own words — person-centred",
              "Categories: care quality, staff conduct, missed visit, communication, medication, food",
              "Anonymous submission option always available",
              "CQC escalation option always offered — legal requirement",
              "Auto-generated reference number: CR-2026-XXXXX",
              "Manager notified by email and SMS on submission",
              "28-day response tracker: amber at 14 days, red at 7, flashing when overdue",
              "Status tracking: open, investigating, resolved, escalated, withdrawn",
              "Carers cannot see the complaints table — enforced at database level",
              "Carers cannot see complaints made about them specifically",
              "Full audit trail for CQC inspection evidence",
            ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
          </ul>
        </div>
      </section>

      {/* ── SECTION 8: STAFF ── */}
      <section id="staff" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="forest">
            <Users size={12} />
            Staff management
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-10">
            Your team, fully managed.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <ul className="space-y-4">
              {[
                "Full staff directory with search and filter",
                "DBS number and expiry date per staff member",
                "DBS status badges: green, amber, red",
                "Automated expiry warnings at 90, 60, and 30 days",
                "Right-to-work verification records and document storage",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
            <ul className="space-y-4">
              {[
                "Qualifications and training records with expiry dates",
                "Burnout risk scoring: low, medium, high — updated weekly",
                "Wellbeing score per carer",
                "Visit history and completion rate per carer",
                "Staff limit enforcement per subscription plan",
              ].map((item) => <FeatureCheck key={item}>{item}</FeatureCheck>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: SECURITY ── */}
      <section id="security" className="bg-cr-ivory py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge colour="forest">
            <Lock size={12} />
            Security & data
          </SectionBadge>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-12">
            NHS-grade security. UK data residency.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: <Lock size={22} className="text-cr-forest" />,
                title: "Row Level Security",
                body: "26 database tables. Every query scoped to your organisation. No data ever leaks between organisations. Enforced at database level — not just application logic.",
              },
              {
                icon: <ShieldCheck size={22} className="text-cr-forest" />,
                title: "Encryption",
                body: "All data encrypted in transit (TLS 1.3) and at rest. Supabase infrastructure with UK data residency on Enterprise plans. Fully GDPR compliant.",
              },
              {
                icon: <FileText size={22} className="text-cr-forest" />,
                title: "Audit Trail",
                body: "Every action logged. Every note. Every care plan view. Every login. Every emergency access. Full forensic trail for CQC inspections.",
              },
              {
                icon: <Users size={22} className="text-cr-forest" />,
                title: "Role Based Access",
                body: "Seven roles: Superadmin, Org Admin, Manager, Coordinator, Carer, Family, GP. Each sees only what they need. Carers cannot see complaints. Family cannot see internal notes.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-cr-mint flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-2">{card.title}</h3>
                <p className="text-sm font-body text-cr-slate leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 10: WHITE LABEL ── */}
      <section id="white-label" className="bg-cr-forest py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold border bg-cr-gold/20 text-cr-gold border-cr-gold/30 mb-5">
            <Crown size={12} />
            White Label
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-5 max-w-2xl">
            Your brand. Our platform.
          </h2>
          <p className="text-base font-body text-white/70 mb-12 max-w-xl leading-relaxed">
            Large care groups, NHS community care teams, and franchise agencies run Careroot under their own name. Staff, families, and CQC inspectors only ever see your brand.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <ul className="space-y-4">
              {[
                "Your logo and brand colours throughout the entire platform",
                "Your own domain — premiercare.co.uk not careroot.care",
                "All emails sent from your domain",
                "Your name in the Play Store and App Store",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={15} className="text-cr-gold mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-body text-white/80 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-4">
              {[
                "Your support contact details shown everywhere",
                "Staff, families, and CQC inspectors only see your brand",
                "Three packages: Basic £500/mo, Full £1,000/mo, Enterprise £1,500/mo",
                "One-time £2,000 setup fee — we handle everything",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={15} className="text-cr-gold mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-body text-white/80 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/demo?subject=white-label"
            className="inline-block px-7 py-3.5 bg-white text-cr-forest rounded-xl font-body font-semibold text-sm hover:bg-cr-mint transition-colors"
          >
            Talk to us about white label →
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-5">
            Ready to see it in action?
          </h2>
          <p className="text-base font-body text-cr-slate mb-10 max-w-lg mx-auto">
            Start your 30-day free trial today. No credit card. No commitment. Set up in under an hour.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="bg-cr-forest text-white rounded-xl px-7 py-3.5 font-body font-semibold text-base hover:bg-cr-sage transition-colors flex items-center justify-center gap-2">
              Start free trial <ArrowRight size={16} />
            </Link>
            <Link href="/demo" className="border border-cr-forest text-cr-forest rounded-xl px-7 py-3.5 font-body font-semibold text-base hover:bg-cr-mint transition-colors flex items-center justify-center">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
