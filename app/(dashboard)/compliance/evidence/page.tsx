import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { FileCheck, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default async function EvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: evidence } = await supabase
    .from("compliance_evidence")
    .select("*")
    .eq("organisation_id", orgId)
    .order("framework")
    .order("statement_ref");

  // Group by framework
  const byFramework: Record<string, typeof evidence> = {};
  for (const item of evidence || []) {
    const fw = String(item.framework || "Other").toUpperCase();
    if (!byFramework[fw]) byFramework[fw] = [];
    byFramework[fw]!.push(item);
  }

  const statusIcon = (status: string) => {
    if (status === "compliant") return <CheckCircle size={16} className="text-green-500" />;
    if (status === "partial") return <AlertTriangle size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-cr-red" />;
  };

  const statusVariant = (s: string): "green" | "slate" | "red" => {
    if (s === "compliant") return "green";
    if (s === "non_compliant") return "red";
    return "slate";
  };

  return (
    <div>
      <CRPageHeader
        title="Evidence Library"
        subtitle="Compliance evidence grouped by regulatory framework"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Compliance", href: "/compliance" },
        ]}
      />

      {Object.keys(byFramework).length === 0 ? (
        <CREmptyState
          icon={<FileCheck className="text-cr-slate" size={40} />}
          title="No evidence items found"
          description="Compliance evidence will appear here once added via the CQC assessment tool"
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byFramework).map(([framework, items]) => (
            <div key={framework}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
                  <FileCheck size={16} className="text-white" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cr-charcoal">{framework}</h2>
                <span className="text-sm text-cr-slate">({items?.length} items)</span>
              </div>
              <div className="space-y-2">
                {(items || []).map((item) => (
                  <CRCard key={String(item.id)}>
                    <div className="flex items-center gap-3">
                      {statusIcon(String(item.status))}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.statement_ref && (
                            <span className="text-xs font-mono bg-cr-mint text-cr-forest px-2 py-0.5 rounded font-medium">
                              {String(item.statement_ref)}
                            </span>
                          )}
                          <p className="text-sm font-body text-cr-charcoal">
                            {String(item.description || item.title || "Evidence item")}
                          </p>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-cr-slate mt-1">{String(item.notes)}</p>
                        )}
                      </div>
                      <CRBadge variant={statusVariant(String(item.status))}>
                        {String(item.status).replace("_", " ")}
                      </CRBadge>
                    </div>
                  </CRCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
