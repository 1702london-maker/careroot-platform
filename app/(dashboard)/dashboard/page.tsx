import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge, riskVariant, statusVariant } from "@/components/ui/CRBadge";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CRAvatar } from "@/components/ui/CRAvatar";
import {
  Users, Clock, AlertTriangle, Sparkles,
  Shield, MessageSquare, UserCheck, Plus,
  Calendar, FileText
} from "lucide-react";
import { formatTimeUK, getDaysSince } from "@/lib/utils";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organisation_id, first_name, role, is_active")
    .eq("id", user.id)
    .single();

  const orgId = userRecord?.organisation_id;
  if (!orgId) redirect("/onboarding");

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // Parallel data fetches
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: orgClientsForMedication } = await supabase
    .from("clients")
    .select("id")
    .eq("organisation_id", orgId);
  const orgClientIds = orgClientsForMedication?.map((client) => client.id) ?? [];

  const [
    { count: activeClients },
    { data: todayVisits },
    { data: openFlags },
    { data: openComplaints },
    { data: recentIncidents },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { data: _emergencyData },
    { count: staffOnShift },
    { data: recentMedications },
    { data: overdueSupervisions },
    { data: sosTriggers },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId).eq("status", "active"),
    supabase.from("visits").select("*, clients(first_name, last_name, dnr_status, risk_level), users!visits_carer_id_fkey(first_name, last_name)")
      .eq("organisation_id", orgId)
      .gte("scheduled_start", todayStart)
      .lte("scheduled_start", todayEnd)
      .order("scheduled_start"),
    supabase.from("ai_risk_flags").select("*, clients(first_name, last_name)")
      .eq("organisation_id", orgId).eq("status", "open")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("complaints").select("*")
      .eq("organisation_id", orgId).eq("status", "open")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("incidents").select("*, clients(first_name, last_name)")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("emergency_events").select("*, clients(first_name, last_name)")
      .eq("organisation_id", orgId)
      .order("triggered_at", { ascending: false }).limit(5),
    supabase.from("shifts").select("*", { count: "exact", head: true })
      .eq("organisation_id", orgId).eq("status", "active"),
    orgClientIds.length
      ? supabase.from("medication_records").select("id, status, administered_at, scheduled_time, server_timestamp, clients(first_name, last_name)")
        .in("client_id", orgClientIds)
        .gte("server_timestamp", thirtyDaysAgo.toISOString())
        .order("server_timestamp", { ascending: false })
        .limit(200)
      : Promise.resolve({ data: [] }),
    supabase.from("staff_supervision").select("id, staff_id, next_due_date, users!staff_supervision_staff_id_fkey(first_name, last_name)")
      .eq("organisation_id", orgId)
      .lt("next_due_date", todayStart)
      .order("next_due_date")
      .limit(5),
    supabase.from("lone_working_check_ins").select("id, status, sos_triggered_at, users!lone_working_check_ins_staff_id_fkey(first_name, last_name)")
      .eq("organisation_id", orgId)
      .eq("status", "sos_triggered")
      .order("sos_triggered_at", { ascending: false })
      .limit(3),
  ]);

  const completedVisits = todayVisits?.filter(v => v.status === "completed").length ?? 0;
  const missedVisits = todayVisits?.filter(v => v.status === "missed").length ?? 0;
  const totalVisits = todayVisits?.length ?? 0;
  const highFlags = openFlags?.filter(f => f.severity === "high" || f.severity === "critical").length ?? 0;

  // Medication compliance rate (last 30 days)
  const totalMedAdmin = recentMedications?.length ?? 0;
  const givenMedAdmin = recentMedications?.filter(m => m.status === "given").length ?? 0;
  const medComplianceRate = totalMedAdmin > 0 ? Math.round((givenMedAdmin / totalMedAdmin) * 100) : null;
  const missedHighRiskMeds = recentMedications?.filter(m => m.status === "refused" || m.status === "missed").length ?? 0;

  // Chart data — visit status breakdown
  const visitStatus = {
    completed: completedVisits,
    in_progress: todayVisits?.filter(v => v.status === "in_progress").length ?? 0,
    scheduled: todayVisits?.filter(v => v.status === "scheduled").length ?? 0,
    missed: missedVisits,
    cancelled: todayVisits?.filter(v => v.status === "cancelled").length ?? 0,
  };

  // Weekly visits — last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: weekVisits } = await supabase
    .from("visits")
    .select("scheduled_start, status")
    .eq("organisation_id", orgId)
    .gte("scheduled_start", sevenDaysAgo.toISOString());

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyMap: Record<string, { visits: number; completed: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weeklyMap[DAY_LABELS[d.getDay()]] = { visits: 0, completed: 0 };
  }
  weekVisits?.forEach(v => {
    const label = DAY_LABELS[new Date(v.scheduled_start).getDay()];
    if (weeklyMap[label]) {
      weeklyMap[label].visits++;
      if (v.status === "completed") weeklyMap[label].completed++;
    }
  });
  const weeklyVisits = Object.entries(weeklyMap).map(([day, data]) => ({ day, ...data }));

  // CQC compliance scores per key question
  const { data: cqcEvidence } = await supabase
    .from("compliance_evidence")
    .select("category, status")
    .eq("organisation_id", orgId)
    .eq("framework", "cqc");

  const calcScore = (cat: string) => {
    const items = cqcEvidence?.filter(e => e.category === cat) ?? [];
    if (!items.length) return 0;
    return Math.round((items.filter(e => e.status === "compliant").length / items.length) * 100);
  };
  const compliance = {
    safe: calcScore("safe"),
    effective: calcScore("effective"),
    caring: calcScore("caring"),
    responsive: calcScore("responsive"),
    wellLed: calcScore("well-led"),
  };

  const greeting = "Welcome";

  return (
    <div>
      <CRPageHeader
        title={`${greeting}, ${userRecord?.first_name || ""}`}
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        action={
          <div className="flex gap-2">
            <Link href="/clients/new" className="cr-btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={16} />
              Add Client
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <CRStatCard
          label="Active Clients"
          value={activeClients ?? 0}
          icon={<Users size={18} />}
        />
        <CRStatCard
          label="Visits Today"
          value={`${completedVisits}/${totalVisits}`}
          icon={<Clock size={18} />}
          variant={missedVisits > 0 ? "danger" : "default"}
        />
        <CRStatCard
          label="Missed Visits"
          value={missedVisits}
          icon={<AlertTriangle size={18} />}
          variant={missedVisits > 0 ? "danger" : "default"}
        />
        <CRStatCard
          label="Risk Flags"
          value={openFlags?.length ?? 0}
          icon={<Sparkles size={18} />}
          variant={highFlags > 0 ? "danger" : openFlags?.length ? "warning" : "default"}
        />
        <CRStatCard
          label="Staff On Shift"
          value={staffOnShift ?? 0}
          icon={<UserCheck size={18} />}
        />
        <CRStatCard
          label="Med Compliance"
          value={medComplianceRate !== null ? `${medComplianceRate}%` : "—"}
          icon={<Shield size={18} />}
          variant={medComplianceRate !== null && medComplianceRate < 85 ? "danger" : medComplianceRate !== null && medComplianceRate < 95 ? "warning" : "default"}
        />
      </div>

      {/* Intelligence alerts */}
      {(sosTriggers && sosTriggers.length > 0) || (overdueSupervisions && overdueSupervisions.length > 0) || missedHighRiskMeds > 5 ? (
        <div className="mb-6 space-y-2">
          {sosTriggers && sosTriggers.length > 0 && sosTriggers.map((sos) => {
            const u = sos.users as unknown as Record<string, string> | null;
            return (
              <CRAlertBanner
                key={sos.id}
                variant="red"
                title={`SOS triggered — ${u?.first_name} ${u?.last_name}`}
                description={`Lone working emergency triggered at ${new Date(sos.sos_triggered_at).toLocaleTimeString("en-GB")}. Check carer status immediately.`}
              />
            );
          })}
          {missedHighRiskMeds > 5 && (
            <CRAlertBanner
              variant="amber"
              title={`${missedHighRiskMeds} missed or refused medications in last 30 days`}
              description="Review medication administration records for high-risk clients."
            />
          )}
          {overdueSupervisions && overdueSupervisions.length > 0 && (
            <CRAlertBanner
              variant="amber"
              title={`${overdueSupervisions.length} staff supervision${overdueSupervisions.length > 1 ? "s" : ""} overdue`}
              description="Overdue supervisions may affect CQC compliance. Review staff supervision records."
            />
          )}
        </div>
      ) : null}

      {/* Charts row */}
      <DashboardCharts
        visitStatus={visitStatus}
        weeklyVisits={weeklyVisits}
        compliance={compliance}
      />

      {/* Missed visit alert */}
      {missedVisits > 0 && (
        <CRAlertBanner
          variant="red"
          title={`${missedVisits} missed visit${missedVisits > 1 ? "s" : ""} today`}
          description="No check-in recorded. Please investigate immediately."
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's visits */}
        <div className="lg:col-span-2">
          <CRCard noPadding>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-semibold text-cr-charcoal">
                Today&rsquo;s Visits
              </h2>
              <Link href="/visits" className="text-xs font-body text-cr-forest hover:text-cr-sage transition-colors">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {todayVisits?.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar size={32} className="mx-auto text-cr-slate opacity-30 mb-2" />
                  <p className="text-sm font-body text-cr-slate">No visits scheduled today</p>
                </div>
              ) : (
                todayVisits?.map((visit) => {
                  const client = visit.clients as Record<string, string> | null;
                  const carer = visit.users as Record<string, string> | null;
                  return (
                    <Link
                      key={visit.id}
                      href={`/visits/${visit.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <CRAvatar
                        firstName={client?.first_name}
                        lastName={client?.last_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-cr-charcoal truncate">
                          {client?.first_name} {client?.last_name}
                        </p>
                        <p className="text-xs font-body text-cr-slate">
                          {carer?.first_name} {carer?.last_name} · {formatTimeUK(visit.scheduled_start)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {client?.risk_level && client.risk_level !== "low" && (
                          <CRBadge variant={riskVariant(client.risk_level)} size="sm">
                            {client.risk_level}
                          </CRBadge>
                        )}
                        <CRBadge variant={statusVariant(visit.status)} size="sm">
                          {visit.status.replace("_", " ")}
                        </CRBadge>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CRCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Risk Flags */}
          <CRCard noPadding>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal flex items-center gap-1.5">
                <Sparkles size={16} className="text-cr-gold" />
                Risk Flags
              </h2>
              <Link href="/ai/risk-flags" className="text-xs font-body text-cr-forest hover:text-cr-sage">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {openFlags?.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-body text-cr-slate">No open flags</p>
                </div>
              ) : (
                openFlags?.slice(0, 4).map((flag) => {
                  const client = flag.clients as Record<string, string> | null;
                  return (
                    <div key={flag.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-body font-medium text-cr-charcoal">
                          {client?.first_name} {client?.last_name}
                        </p>
                        <CRBadge variant={riskVariant(flag.severity)} size="sm">
                          {flag.severity}
                        </CRBadge>
                      </div>
                      <p className="text-xs font-body text-cr-slate mt-0.5 line-clamp-2">
                        {flag.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CRCard>

          {/* Open Complaints */}
          <CRCard noPadding>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal flex items-center gap-1.5">
                <MessageSquare size={16} className="text-cr-slate" />
                Open Complaints
              </h2>
              <Link href="/complaints" className="text-xs font-body text-cr-forest hover:text-cr-sage">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {openComplaints?.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-body text-cr-slate">No open complaints</p>
                </div>
              ) : (
                openComplaints?.slice(0, 3).map((c) => {
                  const days = getDaysSince(c.created_at);
                  const urgency = days >= 28 ? "red" : days >= 14 ? "amber" : "slate";
                  return (
                    <Link key={c.id} href="/complaints" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-body font-medium text-cr-charcoal">{c.reference_number}</p>
                        <p className="text-xs font-body text-cr-slate capitalize">{c.category?.replace("_", " ")}</p>
                      </div>
                      <CRBadge variant={urgency} size="sm">{days}d</CRBadge>
                    </Link>
                  );
                })
              )}
            </div>
          </CRCard>

          {/* Intelligence panel */}
          <CRCard noPadding>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal flex items-center gap-1.5">
                <Sparkles size={16} className="text-cr-forest" />
                Intelligence
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {/* Med compliance */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-cr-charcoal">Medication compliance</p>
                  <span className={`text-sm font-bold ${medComplianceRate !== null && medComplianceRate < 85 ? "text-cr-red" : medComplianceRate !== null && medComplianceRate < 95 ? "text-amber-600" : "text-green-600"}`}>
                    {medComplianceRate !== null ? `${medComplianceRate}%` : "No data"}
                  </span>
                </div>
                <p className="text-xs text-cr-slate mt-0.5">
                  {givenMedAdmin}/{totalMedAdmin} administrations recorded · 30 days
                </p>
              </div>
              {/* Supervisions overdue */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-cr-charcoal">Supervisions overdue</p>
                  <span className={`text-sm font-bold ${(overdueSupervisions?.length ?? 0) > 0 ? "text-cr-red" : "text-green-600"}`}>
                    {overdueSupervisions?.length ?? 0}
                  </span>
                </div>
                {overdueSupervisions && overdueSupervisions.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {overdueSupervisions.slice(0, 3).map(s => {
                      const u = s.users as unknown as Record<string, string> | null;
                      return (
                        <p key={s.id} className="text-xs text-cr-slate">
                          {u?.first_name} {u?.last_name} · Due {new Date(s.next_due_date).toLocaleDateString("en-GB")}
                        </p>
                      );
                    })}
                    {overdueSupervisions.length > 3 && (
                      <Link href="/staff/supervisions" className="text-xs text-cr-forest hover:underline">
                        +{overdueSupervisions.length - 3} more
                      </Link>
                    )}
                  </div>
                )}
              </div>
              {/* Open incidents */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-cr-charcoal">Recent incidents</p>
                  <span className={`text-sm font-bold ${(recentIncidents?.length ?? 0) > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {recentIncidents?.length ?? 0}
                  </span>
                </div>
                <p className="text-xs text-cr-slate mt-0.5">
                  <Link href="/incidents" className="text-cr-forest hover:underline">Review all incidents</Link>
                </p>
              </div>
            </div>
          </CRCard>

          {/* Quick actions */}
          <CRCard>
            <h2 className="font-display text-base font-semibold text-cr-charcoal mb-3">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: "Add Client", href: "/clients/new", icon: <Users size={14} /> },
                { label: "Schedule Visit", href: "/rota", icon: <Calendar size={14} /> },
                { label: "Log Incident", href: "/clients", icon: <AlertTriangle size={14} /> },
                { label: "View Compliance", href: "/compliance", icon: <Shield size={14} /> },
                { label: "Generate Report", href: "/reports", icon: <FileText size={14} /> },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-cr-charcoal hover:bg-cr-mint hover:text-cr-forest transition-colors"
                >
                  <span className="text-cr-forest">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </CRCard>
        </div>
      </div>
    </div>
  );
}
