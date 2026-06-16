import Link from "next/link";
import {
  Brain, ShieldCheck, AlertTriangle, Heart, Smartphone,
  UtensilsCrossed, MessageSquare, Users, Lock, CheckCircle,
  QrCode, Shield, Mic, FileText, Zap, Eye, Clock,
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
  { label: "Custom App", id: "custom-app" },
];

function Check({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${gold ? "text-[#C9A84C]" : "text-[#1A3C2E]"}`} />
      <span className="text-sm text-[#6B7280] leading-relaxed">{children}</span>
    </li>
  );
}

function SectionLabel({ children, colour = "green" }: { children: React.ReactNode; colour?: "green" | "gold" | "red" }) {
  const cls = {
    green: "text-[#1A3C2E]",
    gold: "text-[#C9A84C]",
    red: "text-[#DC2626]",
  };
  return (
    <p className={`text-xs font-semibold uppercase tracking-[2px] mb-3 ${cls[colour]}`}>
      {children}
    </p>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#F9F7F4] pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#E8F5EE] text-[#1A3C2E] text-xs font-semibold rounded-full px-4 py-1.5 mb-6">
            200+ features. One platform.
          </div>
          <h1 className="font-display font-bold text-[52px] md:text-[64px] leading-[1.1] text-[#1C1C1E] mb-5">
            Everything a care agency needs.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto mb-8">
            Every feature exists because a care coordinator, registered manager, or CQC inspector told us they needed it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="bg-[#1A3C2E] text-white px-7 py-3 rounded-[8px] font-semibold text-sm hover:bg-[#4A7C5E] transition-colors">
              Start free trial
            </Link>
            <Link href="/demo" className="border-2 border-[#1A3C2E] text-[#1A3C2E] px-7 py-3 rounded-[8px] font-semibold text-sm hover:bg-[#E8F5EE] transition-colors">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <div className="bg-white border-y border-gray-100 sticky top-[68px] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {JUMP_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="flex-shrink-0 text-xs font-medium text-[#6B7280] hover:text-[#1A3C2E] hover:bg-[#E8F5EE] px-3 py-1.5 rounded-full transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* AI Care Planning */}
      <section id="ai" className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <SectionLabel colour="gold">AI-powered</SectionLabel>
              <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-4">
                Care plans that write themselves.
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-8">
                Stop spending 3 hours on a care plan. Careroot AI drafts it from your assessment data in seconds. Your coordinator reviews, edits, and approves.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Full 6-step client onboarding wizard capturing every detail",
                  "AI generates complete care plan from onboarding data",
                  "All 10 care plan sections including nutrition and cultural preferences",
                  "Manager reviews and approves — never auto-activated",
                  "Nine care plan templates across all care categories",
                  "Import paper care plans via PDF — AI structures them digitally",
                  "Full version history with every change logged",
                  "Care plan views logged automatically as CQC evidence",
                ].map((item) => <Check key={item} gold>{item}</Check>)}
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Mic, title: "Voice Notes", body: "Carers speak their notes. AI structures them into clinical format automatically." },
                  { icon: Brain, title: "Risk Detection", body: "AI analyses 30 days of data and flags deterioration before it becomes a crisis." },
                  { icon: FileText, title: "Paper Import", body: "Upload existing paper care plans as PDF. AI converts to digital in minutes." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="bg-[#F9F7F4] rounded-[12px] p-4">
                    <div className="w-8 h-8 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon size={16} className="text-[#C9A84C]" />
                    </div>
                    <h4 className="font-semibold text-sm text-[#1C1C1E] mb-1">{title}</h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock care plan card */}
            <div className="bg-white border border-gray-100 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#6B7280] font-medium">AI Draft</p>
                  <h4 className="font-semibold text-[#1C1C1E]">Margaret Davies — Care Plan</h4>
                </div>
                <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold px-2 py-1 rounded">AI</span>
              </div>
              <div className="space-y-2">
                {["Personal Profile & Background", "Communication & Sensory Needs", "Personal Care & Hygiene", "Nutrition & Hydration", "Mobility & Moving Support", "Medication Management", "Safety & Risk Assessment", "Social & Emotional Wellbeing", "Emergency Contacts & DNR", "Review & Monitoring Schedule"].map((section, i) => (
                  <div key={section} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-[#9CA3AF] w-4">{i + 1}</span>
                    <span className="text-sm text-[#1C1C1E]">{section}</span>
                    <CheckCircle size={14} className="text-[#1A3C2E] ml-auto" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-[#1A3C2E] text-white text-sm font-semibold py-2.5 rounded-[8px]">Approve</button>
                <button className="flex-1 border border-gray-200 text-[#6B7280] text-sm font-semibold py-2.5 rounded-[8px]">Request edits</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CQC Compliance */}
      <section id="compliance" className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>CQC 2026 Ready</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-4">
            Know your inspection score before the inspector does.
          </h2>
          <p className="text-[#6B7280] leading-relaxed max-w-xl mb-12">
            Careroot maps every interaction to the CQC 2026 Single Assessment Framework. You always know where you stand.
          </p>

          {/* Score gauges */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { label: "Safe", score: 82 },
              { label: "Effective", score: 91 },
              { label: "Caring", score: 88 },
              { label: "Responsive", score: 79 },
              { label: "Well-led", score: 85 },
            ].map(({ label, score }) => {
              const colour = score >= 80 ? "#1A3C2E" : score >= 60 ? "#F59E0B" : "#DC2626";
              return (
                <div key={label} className="bg-white rounded-[12px] p-5 border border-gray-100 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="text-3xl font-bold mb-1" style={{ color: colour }}>{score}%</div>
                  <p className="text-sm font-medium text-[#1C1C1E]">{label}</p>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: colour }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <ul className="space-y-2.5">
              {[
                "Live compliance score across all 5 CQC key questions",
                "All 34 quality statements mapped and evidenced",
                "Ofsted framework module for children's services",
                "Real-time evidence library with document upload",
                "AI assessment of uploaded evidence against framework",
                "Compliance gaps identified with priority ranking",
                "Quick wins suggested by AI",
              ].map((item) => <Check key={item}>{item}</Check>)}
            </ul>
            <ul className="space-y-2.5">
              {[
                "Every carer visit creates compliance evidence automatically",
                "Care plan views logged — evidence carers read plans",
                "Incident categorisation and investigation tracking",
                "Complaint log with mandatory 28-day timeline",
                "DBS and training compliance tracking",
                "Staff wellbeing monitoring for Well-led evidence",
                "Export full evidence pack for inspection",
              ].map((item) => <Check key={item}>{item}</Check>)}
            </ul>
          </div>

          <div className="bg-[#1A3C2E] text-white rounded-[12px] px-6 py-4">
            <p className="text-sm font-medium">
              The CQC's 2026 Single Assessment Framework requires digital evidence at the centre of how services are assessed. Careroot generates that evidence from every interaction — automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency */}
      <section id="emergency" className="bg-[#1C1C1E] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel colour="red">No other platform has this</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-white max-w-2xl mb-4">
            Built for the moments that matter most.
          </h2>
          <p className="text-white/60 leading-relaxed max-w-xl mb-12">
            Every care agency will face a medical emergency. Most are not prepared. Careroot is.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[
              {
                icon: AlertTriangle,
                title: "One-tap emergency cascade",
                body: "The red SOS button is fixed at the bottom of every carer's visit screen. One tap: SMS to on-call manager with GPS, SMS to all emergency contacts, email to GP, incident auto-created — all in 3 seconds.",
                pills: ["SMS cascade", "WhatsApp alerts", "Voice call", "Auto incident", "GPS logged"],
              },
              {
                icon: QrCode,
                title: "Full medical record in 10 seconds",
                body: "Every client gets a unique QR code and PIN for their fridge. Paramedics scan it, see full medical record instantly. No login. No account. No delay.",
                list: ["DNR status — red banner if applicable", "Full active medication list", "All allergies with severity", "GP name and phone number", "Emergency contacts"],
              },
              {
                icon: Heart,
                title: "Family and client SOS",
                body: "The SOS button is not just for carers. Family members on the portal have it. Clients with portal access have it too. Same cascade. Because emergencies don't only happen during visits.",
              },
            ].map(({ icon: Icon, title, body, pills, list }) => (
              <div key={title} className="bg-white/5 border border-[#DC2626]/20 rounded-[16px] p-6">
                <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 flex items-center justify-center mb-4">
                  <Icon size={16} className="text-[#DC2626]" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-3">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">{body}</p>
                {pills && (
                  <div className="flex flex-wrap gap-1.5">
                    {pills.map((p) => (
                      <span key={p} className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                )}
                {list && (
                  <ul className="space-y-1.5">
                    {list.map((item) => (
                      <li key={item} className="text-xs text-white/60 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#DC2626] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-[12px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">DNR status that cannot be missed</p>
              <p className="text-white/60 text-sm">Do Not Resuscitate status shows as a red banner at the top of every screen — care plans, visit screens, paramedic access, family portal.</p>
            </div>
            <Link href="/signup" className="flex-shrink-0 bg-white text-[#1C1C1E] text-sm font-semibold px-5 py-2.5 rounded-[8px] hover:bg-[#F9F7F4] transition-colors">
              Start free trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Carer App */}
      <section id="carer" className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-block bg-[#E8F5EE] text-[#1A3C2E] text-xs font-semibold rounded-full px-3 py-1 mb-4">
            PWA — no app store required
          </div>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-4">
            Your carers will actually use this one.
          </h2>
          <p className="text-[#6B7280] leading-relaxed max-w-xl mb-12">
            Built for one-handed use on any smartphone. No training required. Works completely offline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {[
              { title: "Overview", body: "Care plan, GPS check-in/out, view logging" },
              { title: "Tasks", body: "Large tap targets, one-handed checklist" },
              { title: "Medications", body: "Given, Refused, Unavailable, Not Required" },
              { title: "Meals", body: "Step-by-step prep, allergy warnings, consumption tracking" },
              { title: "Notes", body: "Typed or voice, AI structures automatically on save" },
            ].map(({ title, body }) => (
              <div key={title} className="bg-[#F9F7F4] rounded-[12px] p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-[#1C1C1E] mb-1">{title}</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Mock screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-[#1A3C2E] rounded-[20px] p-4 text-white">
              <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wide">Today's visits</p>
              {[
                { name: "Margaret Davies", time: "09:00", risk: "High", status: "Done" },
                { name: "John Smith", time: "11:30", risk: "Medium", status: "Active" },
                { name: "Patricia Brown", time: "14:00", risk: "Low", status: "Later" },
              ].map((v) => (
                <div key={v.name} className="bg-white/10 rounded-[10px] p-3 mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-white/60">{v.time} · {v.risk} risk</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.status === "Done" ? "bg-white/20" : v.status === "Active" ? "bg-[#F59E0B]/30 text-[#F59E0B]" : "bg-white/10"}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#F9F7F4] rounded-[20px] p-4">
              <div className="bg-[#DC2626] rounded-[8px] p-2 text-white text-xs font-bold mb-2">
                ⚠ ALLERGY: Penicillin — Severe
              </div>
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide mb-2">Medications</p>
              {[
                { name: "Amlodipine 5mg", status: "Given", ok: true },
                { name: "Ramipril 10mg", status: "Given", ok: true },
                { name: "Metformin 500mg", status: "Refused", ok: false },
              ].map((m) => (
                <div key={m.name} className="bg-white rounded-[8px] p-3 mb-2 flex items-center justify-between border border-gray-100">
                  <span className="text-sm text-[#1C1C1E]">{m.name}</span>
                  <span className={`text-xs font-semibold ${m.ok ? "text-[#1A3C2E]" : "text-[#DC2626]"}`}>{m.status}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#F9F7F4] rounded-[20px] p-4">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide mb-2">Meal preparation</p>
              <p className="font-semibold text-[#1C1C1E] mb-1">Scrambled Eggs — John's way</p>
              <p className="text-xs text-[#9CA3AF] mb-3">Breakfast · Est. 8 minutes</p>
              <div className="bg-red-50 border border-red-100 rounded-[8px] p-2 text-xs text-[#DC2626] font-semibold mb-3">
                ⚠ ALLERGY: Dairy — use oat milk only
              </div>
              {["Crack 2 eggs, add 2 tbsp oat milk", "Whisk well until combined", "Cook on LOW heat — stir slowly", "Serve on the blue plates only"].map((step, i) => (
                <div key={step} className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#E8F5EE] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#1A3C2E]">{i + 1}</span>
                  </div>
                  <p className="text-xs text-[#1C1C1E] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A3C2E]/5 border border-[#1A3C2E]/10 rounded-[12px] p-6">
            <h4 className="font-semibold text-[#1C1C1E] mb-2">Works underground. In a basement. In rural areas with no signal.</h4>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Careroot caches everything for each visit before carers leave. Complete the entire visit offline — notes, medications, meals, tasks, check-in, check-out. Everything syncs automatically when signal returns.
            </p>
          </div>
        </div>
      </section>

      {/* Family Portal */}
      <section id="family" className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Family engagement</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-4">
            Give families the visibility they deserve.
          </h2>
          <p className="text-[#6B7280] leading-relaxed max-w-xl mb-12">
            When families can see what's happening, they trust your agency. When they trust your agency, they refer you to others.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              { tier: "Limited", items: ["Weekly AI briefings", "Direct messaging", "Meal records"] },
              { tier: "Standard", highlight: true, items: ["Live visit status", "Full visit notes", "Care plan view", "Medication summary", "Incident reports", "Complaints portal", "Meal suggestions"] },
              { tier: "Full", items: ["Everything in Standard", "AI risk flag summaries", "Full nutrition records", "Cultural meal suggestions"] },
            ].map(({ tier, items, highlight }) => (
              <div key={tier} className={`rounded-[16px] p-6 ${highlight ? "bg-[#1A3C2E] text-white" : "bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
                <p className={`text-xs font-semibold uppercase tracking-[2px] mb-4 ${highlight ? "text-white/60" : "text-[#6B7280]"}`}>{tier} Access</p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className={`flex items-center gap-2 text-sm ${highlight ? "text-white/80" : "text-[#6B7280]"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${highlight ? "bg-white/60" : "bg-[#1A3C2E]"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl">
            <p className="text-2xl mb-2">🍲</p>
            <p className="font-semibold text-[#1C1C1E] mb-2">"She loves Nigerian pepper soup on cold days."</p>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              The client's daughter submits the recipe with steps. Manager approves. It appears on the carer's visit screen the next morning. That is person-centred care.
            </p>
          </div>
        </div>
      </section>

      {/* Nutrition */}
      <section id="nutrition" className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <SectionLabel>Person-centred care starts here</SectionLabel>
              <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-4">
                Margaret only eats from the blue plates.
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-8">
                Care plans describe what support someone needs. Food plans describe who they are. Careroot captures both.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Dietary profile", items: ["Diet type, allergies with severity, intolerances", "Loved foods and foods to avoid", "IDDSI texture requirements (5 levels)", "Daily fluid targets and thickener requirements", "Nutritional supplements"] },
                  { title: "Step-by-step meal instructions", items: ["Numbered preparation steps for every meal", "Notes and warnings per step", "Cultural significance of food", "Weekly traditions and special occasion meals", "Foods connected to memories"] },
                  { title: "AI appetite analysis", items: ["Detects reduced appetite over 14 days", "Flags inadequate fluid intake", "Identifies sudden changes", "Alerts manager with evidence"] },
                ].map(({ title, items }) => (
                  <div key={title}>
                    <h4 className="font-semibold text-[#1C1C1E] mb-2">{title}</h4>
                    <ul className="space-y-1.5">
                      {items.map((item) => <Check key={item}>{item}</Check>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock meal card */}
            <div className="bg-[#F9F7F4] rounded-[16px] p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#9CA3AF]">Meal Preparation</p>
                  <h4 className="font-semibold text-[#1C1C1E]">Scrambled Eggs — John's way</h4>
                  <p className="text-xs text-[#9CA3AF]">Breakfast · Est. 8 minutes</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-[8px] p-2.5 text-xs text-[#DC2626] font-semibold mb-4">
                ⚠ ALLERGY: Dairy — use oat milk only
              </div>
              {[
                "Crack 2 eggs into a bowl, add 2 tbsp oat milk",
                "Whisk well until combined and slightly frothy",
                "Heat pan on low — John likes it soft, not rubbery",
                "Stir slowly and continuously — remove while still soft",
                "Serve on the blue plates — he won't eat from other plates",
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F5EE] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#1A3C2E]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[#1C1C1E] leading-relaxed">{step}</p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-[#6B7280] font-semibold mb-2">Record intake</p>
                <div className="grid grid-cols-4 gap-2">
                  {["All of it", "Most of it", "About half", "Very little"].map((opt) => (
                    <button key={opt} className="text-xs font-medium text-[#1C1C1E] bg-white border border-gray-200 rounded-[8px] py-1.5 hover:bg-[#E8F5EE] hover:border-[#1A3C2E] transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complaints */}
      <section id="complaints" className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Complaints management</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-4">
            CQC compliance starts with how you handle complaints.
          </h2>
          <p className="text-[#6B7280] leading-relaxed max-w-xl mb-10">
            A complaint handled well is evidence of a well-led service. Careroot ensures every complaint is resolved within the legal 28-day requirement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 bg-white rounded-[10px] p-4 border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0 mt-1.5" />
                <p className="text-sm text-[#6B7280] leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff */}
      <section id="staff" className="bg-white py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Staff management</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-12">
            Your team, fully managed.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: "Staff directory", body: "Full directory with search and filter. DBS status, contract type, burnout risk badge, active visits today count." },
              { icon: Shield, title: "DBS tracking", body: "DBS number and expiry per carer. Automated warnings at 90, 60, and 30 days. Red badges on expired DBS." },
              { icon: FileText, title: "Training records", body: "Qualifications and training with expiry dates. Compliance percentage per carer. Overdue training flagged." },
              { icon: Heart, title: "Burnout monitoring", body: "Weekly burnout risk score. Low, medium, high — based on visit patterns, note sentiment, and flagged concerns." },
              { icon: CheckCircle, title: "Right to work", body: "Document storage and verification status per carer. Expiry tracking for time-limited documents." },
              { icon: Eye, title: "Wellbeing scores", body: "Wellbeing score per carer. Staff limit enforcement per subscription plan with upgrade prompts." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4 bg-[#F9F7F4] rounded-[12px] p-5">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5EE] flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#1A3C2E]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1C1C1E] mb-1">{title}</h4>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="bg-[#F9F7F4] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Security and data</SectionLabel>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] max-w-2xl mb-12">
            NHS-grade security. UK data residency.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Lock, title: "Row Level Security", body: "26 database tables. Every query scoped to your organisation. No data leaks between organisations. Enforced at database level." },
              { icon: Shield, title: "Encryption", body: "All data encrypted in transit (TLS 1.3) and at rest. UK data residency on Enterprise plans. Fully GDPR compliant." },
              { icon: Eye, title: "Audit Trail", body: "Every action logged. Every note. Every care plan view. Every login. Every emergency access. Full forensic trail." },
              { icon: Users, title: "Role Based Access", body: "Seven roles. Each sees only what they need. Carers cannot see complaints. Family cannot see internal notes." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5EE] flex items-center justify-center mb-4">
                  <Icon size={16} className="text-[#1A3C2E]" />
                </div>
                <h4 className="font-semibold text-[#1C1C1E] mb-2">{title}</h4>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom App */}
      <section id="custom-app" className="bg-[#1A3C2E] py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">Custom App</p>
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-white max-w-2xl mb-4">
            Your brand. Our platform.
          </h2>
          <p className="text-white/70 leading-relaxed max-w-xl mb-10">
            Large care groups, NHS community care teams, and franchise agencies run Careroot under their own name. Staff, families, and CQC inspectors only ever see your brand.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-w-2xl">
            {[
              "Your logo and brand colours throughout the entire platform",
              "Your own domain — yourname.co.uk not careroot.care",
              "All emails sent from your domain",
              "Your name in the Play Store and App Store",
              "Your support contact details shown everywhere",
              "Three packages: Basic £500/mo, Full £1,000/mo, Enterprise £1,500/mo",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <p className="text-sm text-white/80">{item}</p>
              </div>
            ))}
          </div>
          <Link href="/custom-app" className="inline-flex items-center gap-2 bg-white text-[#1A3C2E] font-semibold px-6 py-3 rounded-[8px] hover:bg-[#E8F5EE] transition-colors">
            Learn more about Custom App →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F9F7F4] py-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-[40px] leading-[48px] text-[#1C1C1E] mb-4">
            Ready to see it in action?
          </h2>
          <p className="text-[#6B7280] leading-relaxed mb-8">
            Start your 30-day free trial today. No credit card. No commitment. Set up in under an hour.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="bg-[#1A3C2E] text-white px-8 py-3.5 rounded-[8px] font-semibold hover:bg-[#4A7C5E] transition-colors w-full sm:w-auto text-center">
              Start free trial
            </Link>
            <Link href="/demo" className="border-2 border-[#1A3C2E] text-[#1A3C2E] px-8 py-3.5 rounded-[8px] font-semibold hover:bg-[#E8F5EE] transition-colors w-full sm:w-auto text-center">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
