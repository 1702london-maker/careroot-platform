import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { Calendar, Users, AlertTriangle, MessageSquare, ShieldAlert, CheckCircle } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [
    { count: totalVisitsMonth },
    { count: completedVisitsMonth },
    { count: activeClients },
    { count: openIncidents },
    { count: openComplaints },
    { count: openRiskFlags },
    { data: evidence },
  ] = await Promise.all([
    supabase.from("visits").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .gte("scheduled_start", monthStart)
      .lte("scheduled_start", monthEnd),
    supabase.from("visits").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("status", "completed")
      .gte("scheduled_start", monthStart)
      .lte("scheduled_start", monthEnd),
    supabase.from("clients").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("status", "active"),
    supabase.from("incidents").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("status", "open"),
    supabase.from("complaints").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("status", "open"),
    supabase.from("risk_flags").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("status", "open"),
    supabase.from("compliance_evidence").select("status")
      .eq("organisation_id", orgId),
  ]);

  const total = totalVisitsMonth ?? 0;
  const completed = completedVisitsMonth ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const evidenceTotal = evidence?.length ?? 0;
  const evidenceCompliant = evidence?.filter((e) => e.status === "compliant").length ?? 0;
  const complianceScore = evidenceTotal > 0 ? Math.round((evidenceCompliant / evidenceTotal) * 100) : 0;

  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <CRPageHeader
        title="Reports"
        subtitle={`Summary statistics for ${monthLabel}`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <CRStatCard
          label="Total Visits This Month"
          value={total}
          icon={<Calendar size={20} />}
        />
        <CRStatCard
          label="Visit Completion Rate"
          value={`${completionRate}%`}
          icon={<CheckCircle size={20} />}
          variant={completionRate >= 90 ? "success" : completionRate >= 70 ? "default" : "warning"}
        />
        <CRStatCard
          label="Active Clients"
          value={activeClients ?? 0}
          icon={<Users size={20} />}
        />
        <CRStatCard
          label="Open Incidents"
          value={openIncidents ?? 0}
          icon={<AlertTriangle size={20} />}
          variant={(openIncidents ?? 0) > 0 ? "warning" : "default"}
        />
        <CRStatCard
          label="Open Complaints"
          value={openComplaints ?? 0}
          icon={<MessageSquare size={20} />}
          variant={(openComplaints ?? 0) > 0 ? "danger" : "default"}
        />
        <CRStatCard
          label="Open AI Risk Flags"
          value={openRiskFlags ?? 0}
          icon={<ShieldAlert size={20} />}
          variant={(openRiskFlags ?? 0) > 0 ? "warning" : "default"}
        />
        <CRStatCard
          label="Compliance Score"
          value={`${complianceScore}%`}
          icon={<CheckCircle size={20} />}
          variant={complianceScore >= 80 ? "success" : complianceScore >= 60 ? "warning" : "danger"}
        />
      </div>
    </div>
  );
}
