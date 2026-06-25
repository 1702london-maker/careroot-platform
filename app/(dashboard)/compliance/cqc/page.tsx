import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Shield, CheckCircle, AlertTriangle, XCircle, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CQC_FRAMEWORK = [
  {
    id: "safe",
    label: "Safe",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    statements: [
      "Learning culture",
      "Safe systems, pathways and transitions",
      "Safeguarding",
      "Involving people to manage risks",
      "Safe environments",
      "Safe and effective staffing",
      "Infection prevention and control",
      "Medicines optimisation",
    ],
  },
  {
    id: "effective",
    label: "Effective",
    color: "text-cr-forest",
    bg: "bg-cr-mint",
    border: "border-cr-mint",
    statements: [
      "Assessing needs",
      "Delivering evidence-based care and treatment",
      "How staff, teams and services work together",
      "Supporting people to live healthier lives",
      "Monitoring and improving outcomes",
      "Consent to care and treatment",
    ],
  },
  {
    id: "caring",
    label: "Caring",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    statements: [
      "Kindness, compassion and dignity",
      "Treating people as individuals",
      "Independence, choice and control",
      "Responding to people's immediate needs",
      "Workforce wellbeing and enablement",
    ],
  },
  {
    id: "responsive",
    label: "Responsive",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    statements: [
      "Person-centred care",
      "Care provision, integration and continuity",
      "Providing information",
      "Listening to and involving people",
      "Equity in access",
      "Equity in experiences and outcomes",
      "Planning for the future",
    ],
  },
  {
    id: "well-led",
    label: "Well-led",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    statements: [
      "Shared direction and culture",
      "Capable, compassionate and inclusive leaders",
      "Freedom to speak up",
      "Workforce equality, diversity and inclusion",
      "Governance, management and sustainability",
      "Partnerships and communities",
      "Learning, improvement and innovation",
    ],
  },
];

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

export default async function CQCDetailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const { data: evidence } = await supabase
    .from("compliance_evidence")
    .select("*")
    .eq("organisation_id", userRecord?.organisation_id)
    .eq("framework", "cqc");

  const evidenceMap: Record<string, Record<string, string>> = {};
  evidence?.forEach((e) => {
    evidenceMap[e.category] = evidenceMap[e.category] ?? {};
    evidenceMap[e.category][e.requirement] = e.status;
  });

  const total = evidence?.length ?? 0;
  const compliant = evidence?.filter(e => e.status === "compliant").length ?? 0;
  const overallScore = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const ringColor = overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#F59E0B" : "#DC2626";

  return (
    <div>
      <CRPageHeader
        title="CQC — 2026 Single Assessment Framework"
        subtitle="All 34 quality statements across 5 key questions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Compliance", href: "/compliance" },
        ]}
        action={
          <Link href="/compliance/evidence" className="flex items-center gap-1.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest px-4 py-2 rounded-btn hover:bg-cr-mint transition-colors">
            <Shield size={14} />
            Evidence Library
          </Link>
        }
      />

      {/* Score summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
            <p className="text-xs font-body font-semibold text-cr-charcoal text-center">Overall Score</p>
            <p className="text-xs font-body text-cr-slate text-center mt-0.5">
              {overallScore >= 80 ? "Good" : overallScore >= 60 ? "Requires Improvement" : "Inadequate"}
            </p>
          </CRCard>
        </div>
        {CQC_FRAMEWORK.map((section) => {
          const sectionEvidence = evidence?.filter(e => e.category === section.id) ?? [];
          const sectionScore = sectionEvidence.length > 0
            ? Math.round((sectionEvidence.filter(e => e.status === "compliant").length / sectionEvidence.length) * 100)
            : 0;
          return (
            <CRCard key={section.id} className="flex flex-col items-center justify-center py-5">
              <div className={`w-8 h-8 ${section.bg} rounded-lg flex items-center justify-center mb-2`}>
                <Shield size={16} className={section.color} />
              </div>
              <p className={`text-xl font-display font-bold ${section.color}`}>{sectionScore}%</p>
              <p className="text-xs font-body font-semibold text-cr-charcoal mt-0.5">{section.label}</p>
              <p className="text-xs font-body text-cr-slate">{sectionEvidence.length}/{section.statements.length} assessed</p>
            </CRCard>
          );
        })}
      </div>

      {/* Key questions detail */}
      <div className="space-y-6">
        {CQC_FRAMEWORK.map((section) => (
          <div key={section.id} id={section.id}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-t-card border-b ${section.border} ${section.bg}`}>
              <Shield size={18} className={section.color} />
              <h2 className={`font-display text-lg font-semibold ${section.color}`}>{section.label}</h2>
              <span className="ml-auto text-xs font-body text-cr-slate">{section.statements.length} quality statements</span>
            </div>
            <div className="border border-t-0 border-gray-100 rounded-b-card divide-y divide-gray-50 bg-white">
              {section.statements.map((statement, i) => {
                const status = evidenceMap[section.id]?.[statement] ?? "not_assessed";
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    {statusIcon(status)}
                    <span className="flex-1 text-sm font-body text-cr-charcoal">{statement}</span>
                    {statusBadge(status)}
                    <Link
                      href={`/compliance/evidence?category=${section.id}&statement=${encodeURIComponent(statement)}`}
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
        <p>CQC Single Assessment Framework 2026 · {evidence?.length ?? 0} statements assessed</p>
      </div>
    </div>
  );
}
