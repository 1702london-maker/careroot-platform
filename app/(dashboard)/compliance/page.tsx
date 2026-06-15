import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function CompliancePage() {
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

  const total = evidence?.length ?? 0;
  const compliant = evidence?.filter(e => e.status === "compliant").length ?? 0;
  const partial = evidence?.filter(e => e.status === "partial").length ?? 0;
  const nonCompliant = evidence?.filter(e => e.status === "non_compliant").length ?? 0;

  const overallScore = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const scoreColor = overallScore >= 80 ? "text-green-600" : overallScore >= 60 ? "text-cr-amber" : "text-cr-red";
  const ringColor = overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#F59E0B" : "#DC2626";

  const categories = ["Safe", "Effective", "Caring", "Responsive", "Well-led"];

  return (
    <div>
      <CRPageHeader
        title="CQC Compliance"
        subtitle="2026 Single Assessment Framework"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/compliance/cqc" className="cr-btn-secondary flex items-center gap-1.5 text-sm">
            <RefreshCw size={16} />
            Rescore
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Score ring */}
        <CRCard className="flex flex-col items-center justify-center py-8">
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={ringColor} strokeWidth="8"
                strokeDasharray={`${overallScore * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-display font-semibold ${scoreColor}`}>
                {overallScore}
              </span>
            </div>
          </div>
          <p className="text-sm font-body font-medium text-cr-charcoal">Overall CQC Score</p>
          <p className="text-xs font-body text-cr-slate mt-1">
            {overallScore >= 80 ? "Good" : overallScore >= 60 ? "Requires Improvement" : "Inadequate"}
          </p>
        </CRCard>

        {/* Evidence breakdown */}
        <CRCard>
          <h3 className="font-display text-base font-semibold text-cr-charcoal mb-4">Evidence Status</h3>
          <div className="space-y-3">
            {[
              { label: "Compliant", count: compliant, icon: <CheckCircle size={16} className="text-green-500" />, color: "text-green-600" },
              { label: "Partial", count: partial, icon: <AlertTriangle size={16} className="text-cr-amber" />, color: "text-amber-600" },
              { label: "Non-compliant", count: nonCompliant, icon: <XCircle size={16} className="text-cr-red" />, color: "text-cr-red" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {s.icon}
                  <span className="text-sm font-body text-cr-charcoal">{s.label}</span>
                </div>
                <span className={`text-sm font-body font-semibold ${s.color}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </CRCard>

        {/* Quick links */}
        <CRCard>
          <h3 className="font-display text-base font-semibold text-cr-charcoal mb-4">CQC Key Questions</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/compliance/cqc#${cat.toLowerCase()}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cr-mint transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-cr-forest" />
                  <span className="text-sm font-body text-cr-charcoal">{cat}</span>
                </div>
                <CRBadge variant="slate" size="sm">View</CRBadge>
              </Link>
            ))}
          </div>
        </CRCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/compliance/cqc" className="block">
          <CRCard hover className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cr-mint rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-cr-forest" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-cr-charcoal">CQC Detailed View</h3>
              <p className="text-xs font-body text-cr-slate">All 34 quality statements across 5 key questions</p>
            </div>
          </CRCard>
        </Link>
        <Link href="/compliance/evidence" className="block">
          <CRCard hover className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cr-mint rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-cr-forest" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-cr-charcoal">Evidence Library</h3>
              <p className="text-xs font-body text-cr-slate">Upload and manage compliance documents</p>
            </div>
          </CRCard>
        </Link>
      </div>
    </div>
  );
}
