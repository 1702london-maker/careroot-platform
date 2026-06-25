import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Shield, CheckCircle, AlertTriangle, XCircle, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

const OFSTED_FRAMEWORK = [
  {
    id: "quality_education",
    label: "Quality of Education",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    statements: [
      "Intent — curriculum ambition and design",
      "Implementation — teaching, assessment, curriculum delivery",
      "Impact — outcomes and progress",
      "Reading — phonics and reading quality",
      "SEND provision — identification and support",
      "Personal development within learning",
    ],
  },
  {
    id: "behaviour_attitudes",
    label: "Behaviour & Attitudes",
    color: "text-cr-forest",
    bg: "bg-cr-mint",
    border: "border-cr-mint",
    statements: [
      "Behaviour management culture",
      "Attitudes to learning and engagement",
      "Attendance and punctuality",
      "Relationships between staff and service users",
      "Bullying and discrimination — prevention and response",
    ],
  },
  {
    id: "personal_development",
    label: "Personal Development",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    statements: [
      "Wider development beyond formal outcomes",
      "British values and citizenship",
      "Physical and mental health promotion",
      "Relationships and sex education",
      "Careers guidance and aspirations",
      "Character development",
    ],
  },
  {
    id: "leadership_management",
    label: "Leadership & Management",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    statements: [
      "Ambitious vision and culture",
      "Leaders — accountability and improvement",
      "Safeguarding effectiveness",
      "Staff development, well-being and workload",
      "Governance and oversight",
      "Engagement with parents, carers and stakeholders",
      "Financial management and sustainability",
    ],
  },
  {
    id: "safeguarding",
    label: "Safeguarding",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    statements: [
      "Child protection policies and procedures",
      "Safer recruitment practices",
      "Single central record — completeness and accuracy",
      "Staff training — awareness and response",
      "Children with SEND — additional safeguards",
      "Online safety — culture and technical controls",
      "Missing child protocols",
    ],
  },
];

const RATINGS = ["Outstanding", "Good", "Requires Improvement", "Inadequate"];
const RATING_COLORS: Record<string, string> = {
  Outstanding: "bg-cr-mint text-cr-forest border-cr-forest/20",
  Good: "bg-blue-50 text-blue-700 border-blue-200",
  "Requires Improvement": "bg-amber-50 text-amber-700 border-amber-200",
  Inadequate: "bg-red-50 text-cr-red border-red-200",
};

function statusIcon(status: string) {
  if (status === "compliant") return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
  if (status === "partial") return <AlertTriangle size={16} className="text-cr-amber flex-shrink-0" />;
  if (status === "non_compliant") return <XCircle size={16} className="text-cr-red flex-shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />;
}

function statusBadge(status: string) {
  if (status === "compliant") return <CRBadge variant="green" size="sm">Compliant</CRBadge>;
  if (status === "partial") return <CRBadge variant="amber" size="sm">Partial</CRBadge>;
  if (status === "non_compliant") return <CRBadge variant="red" size="sm">Non-compliant</CRBadge>;
  return <CRBadge variant="slate" size="sm">Not assessed</CRBadge>;
}

export default async function OfstedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const { data: evidence } = await supabase
    .from("compliance_evidence")
    .select("*")
    .eq("organisation_id", userRecord?.organisation_id)
    .eq("framework", "ofsted");

  const evidenceMap: Record<string, Record<string, string>> = {};
  evidence?.forEach(e => {
    evidenceMap[e.category] = evidenceMap[e.category] ?? {};
    evidenceMap[e.category][e.requirement] = e.status;
  });

  const total = evidence?.length ?? 0;
  const compliant = evidence?.filter(e => e.status === "compliant").length ?? 0;
  const overallScore = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const ringColor = overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#F59E0B" : "#DC2626";

  const overallRating = overallScore >= 90 ? "Outstanding"
    : overallScore >= 70 ? "Good"
    : overallScore >= 50 ? "Requires Improvement"
    : "Inadequate";

  return (
    <div>
      <CRPageHeader
        title="Ofsted — Education Inspection Framework"
        subtitle="5 judgement areas · evidence-based self-assessment"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Compliance", href: "/compliance" },
        ]}
        action={
          <a
            href="https://www.gov.uk/government/publications/education-inspection-framework"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest px-4 py-2 rounded-btn hover:bg-cr-mint transition-colors"
          >
            <ExternalLink size={14} />
            Ofsted EIF
          </a>
        }
      />

      {/* Score summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {/* Overall */}
        <div className="col-span-2 md:col-span-1">
          <CRCard className="flex flex-col items-center justify-center py-6">
            <div className="relative w-20 h-20 mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={ringColor} strokeWidth="10"
                  strokeDasharray={`${overallScore * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-display font-bold" style={{ color: ringColor }}>{overallScore}</span>
              </div>
            </div>
            <p className="text-xs font-body font-semibold text-cr-charcoal text-center">Self-assessment</p>
            <div className={`mt-1 text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${RATING_COLORS[overallRating]}`}>
              {overallRating}
            </div>
          </CRCard>
        </div>

        {/* Per-section scores */}
        {OFSTED_FRAMEWORK.map(section => {
          const sectionEvidence = evidence?.filter(e => e.category === section.id) ?? [];
          const score = sectionEvidence.length > 0
            ? Math.round((sectionEvidence.filter(e => e.status === "compliant").length / sectionEvidence.length) * 100)
            : 0;
          return (
            <CRCard key={section.id} className="flex flex-col items-center justify-center py-5">
              <div className={`w-8 h-8 ${section.bg} rounded-lg flex items-center justify-center mb-2`}>
                <Shield size={16} className={section.color} />
              </div>
              <p className={`text-xl font-display font-bold ${section.color}`}>{score}%</p>
              <p className="text-xs font-body font-semibold text-cr-charcoal mt-0.5 text-center leading-tight px-1">{section.label}</p>
              <p className="text-xs font-body text-cr-slate">{sectionEvidence.length}/{section.statements.length}</p>
            </CRCard>
          );
        })}
      </div>

      {/* Rating guide */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RATINGS.map(r => (
          <span key={r} className={`text-xs font-body font-semibold px-3 py-1 rounded-full border ${RATING_COLORS[r]}`}>{r}</span>
        ))}
        <span className="text-xs font-body text-cr-slate flex items-center">← Ofsted judgements</span>
      </div>

      {/* Judgement sections */}
      <div className="space-y-6">
        {OFSTED_FRAMEWORK.map(section => (
          <div key={section.id} id={section.id}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-t-card border-b ${section.border} ${section.bg}`}>
              <Shield size={18} className={section.color} />
              <h2 className={`font-display text-lg font-semibold ${section.color}`}>{section.label}</h2>
              <span className="ml-auto text-xs font-body text-cr-slate">{section.statements.length} criteria</span>
            </div>
            <div className="border border-t-0 border-gray-100 rounded-b-card divide-y divide-gray-50 bg-white">
              {section.statements.map((stmt, i) => {
                const status = evidenceMap[section.id]?.[stmt] ?? "not_assessed";
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    {statusIcon(status)}
                    <span className="flex-1 text-sm font-body text-cr-charcoal">{stmt}</span>
                    {statusBadge(status)}
                    <Link
                      href={`/compliance/evidence?framework=ofsted&category=${section.id}&statement=${encodeURIComponent(stmt)}`}
                      className="text-cr-forest hover:text-cr-sage transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-body text-cr-slate">
        <Link href="/compliance" className="flex items-center gap-1.5 hover:text-cr-forest transition-colors">
          <ArrowLeft size={14} /> Back to Compliance
        </Link>
        <p>Ofsted Education Inspection Framework · {evidence?.length ?? 0} criteria assessed</p>
      </div>
    </div>
  );
}
