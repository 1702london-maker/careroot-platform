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
import { formatDateTimeUK, formatTimeUK, getDaysSince } from "@/lib/utils";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organisation_id, first_name, role")
    .eq("id", user.id)
    .single();

  const orgId = userRecord?.organisation_id;
  if (!orgId) redirect("/signup");

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // Parallel data fetches
  const [
    { count: activeClients },
    { data: todayVisits },
    { data: openFlags },
    { data: openComplaints },
    { data: recentIncidents },
    { data: emergencyEvents },
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
  ]);

  const completedVisits = todayVisits?.filter(v => v.status === "completed").length ?? 0;
  const missedVisits = todayVisits?.filter(v => v.status === "missed").length ?? 0;
  const totalVisits = todayVisits?.length ?? 0;
  const highFlags = openFlags?.filter(f => f.severity === "high" || f.severity === "critical").length ?? 0;

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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <CRPageHeader
        title={`${greeting()}, ${userRecord?.first_name || ""}` }
        subtitle={`${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          label="AI Risk Flags"
          value={openFlags?.length ?? 0}
          icon={<Sparkles size={18} />}
          variant={highFlags > 0 ? "danger" : openFlags?.length ? "warning" : "default"}
        />
      </div>

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
          {/* AI Risk Flags */}
          <CRCard noPadding>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal flex items-center gap-1.5">
                <Sparkles size={16} className="text-cr-gold" />
                AI Risk Flags
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
                { label: "Generate AI Report", href: "/reports", icon: <FileText size={14} /> },
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
