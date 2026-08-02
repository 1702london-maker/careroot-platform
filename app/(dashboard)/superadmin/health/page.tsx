import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeUK } from "@/lib/utils";

type CronConfig = { path: string; schedule: string };
type CronRun = {
  job_name: string;
  path: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
  result: Record<string, unknown> | null;
};

const CRON_CONFIG: CronConfig[] = [
  { path: "/api/cron/check-missed-visits", schedule: "0 9 * * *" },
  { path: "/api/cron/check-dbs-expiry", schedule: "0 8 * * *" },
  { path: "/api/cron/calculate-burnout-risk", schedule: "0 7 * * 1" },
  { path: "/api/cron/cleanup-credentials", schedule: "0 2 * * *" },
  { path: "/api/cron/weekly-reports-trigger", schedule: "0 6 * * 1" },
  { path: "/api/cron/compliance-expiry-alerts", schedule: "0 8 * * 1" },
  { path: "/api/cron/sar-deadline-alerts", schedule: "0 9 * * *" },
  { path: "/api/cron/medication-escalation", schedule: "0 10 * * *" },
  { path: "/api/cron/data-retention", schedule: "0 3 1 * *" },
  { path: "/api/cron/credential-generation", schedule: "15 1 * * *" },
  { path: "/api/cron/shift-access-expiry", schedule: "30 1 * * *" },
  { path: "/api/cron/incident-wellbeing-check", schedule: "45 1 * * *" },
  { path: "/api/cron/refresh-evidence-packs", schedule: "0 4 * * *" },
];

function jobNameFromPath(cronPath: string) {
  return cronPath.split("/").filter(Boolean).pop() ?? cronPath;
}

function badgeForStatus(status?: string): "green" | "red" | "amber" | "slate" {
  if (status === "success") return "green";
  if (status === "failed" || status === "unauthorised") return "red";
  if (status === "started") return "amber";
  return "slate";
}

export default async function SuperadminHealthPage() {
  const supabase = await createClient();
  const crons = CRON_CONFIG;
  const { data: recentRuns } = await supabase
    .from("cron_run_logs")
    .select("job_name, path, status, started_at, finished_at, duration_ms, error, result")
    .order("started_at", { ascending: false })
    .limit(100);

  const latestByPath = new Map<string, CronRun>();
  for (const run of (recentRuns ?? []) as CronRun[]) {
    if (!latestByPath.has(run.path)) latestByPath.set(run.path, run);
  }

  const failedLatest = crons.filter((c) => ["failed", "unauthorised"].includes(latestByPath.get(c.path)?.status ?? "")).length;
  const neverSeen = crons.filter((c) => !latestByPath.has(c.path)).length;
  const healthy = crons.length - neverSeen - failedLatest;

  return (
    <div>
      <CRPageHeader
        title="Platform Health"
        subtitle="Cron schedule, last run status, and production operations visibility."
        breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CRCard className="flex items-center gap-3"><Activity className="text-cr-forest" size={20} /><div><p className="text-2xl font-display font-semibold">{crons.length}</p><p className="text-xs text-cr-slate">Configured cron jobs</p></div></CRCard>
        <CRCard className="flex items-center gap-3"><CheckCircle2 className="text-green-600" size={20} /><div><p className="text-2xl font-display font-semibold">{healthy}</p><p className="text-xs text-cr-slate">Recently healthy</p></div></CRCard>
        <CRCard className="flex items-center gap-3"><Clock className="text-amber-600" size={20} /><div><p className="text-2xl font-display font-semibold">{neverSeen}</p><p className="text-xs text-cr-slate">No run logged yet</p></div></CRCard>
        <CRCard className="flex items-center gap-3"><AlertTriangle className="text-red-600" size={20} /><div><p className="text-2xl font-display font-semibold">{failedLatest}</p><p className="text-xs text-cr-slate">Latest failures</p></div></CRCard>
      </div>

      <CRCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Job", "Schedule", "Last status", "Last run", "Duration", "Result/Error"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {crons.map((cron) => {
                const latest = latestByPath.get(cron.path);
                return (
                  <tr key={cron.path} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-cr-charcoal">{jobNameFromPath(cron.path)}</p>
                      <p className="text-xs text-cr-slate font-mono">{cron.path}</p>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-cr-charcoal">{cron.schedule}</td>
                    <td className="px-5 py-3"><CRBadge variant={badgeForStatus(latest?.status)} size="sm">{latest?.status ?? "not logged"}</CRBadge></td>
                    <td className="px-5 py-3 text-xs text-cr-slate">{latest?.started_at ? formatDateTimeUK(latest.started_at) : "-"}</td>
                    <td className="px-5 py-3 text-xs text-cr-slate">{latest?.duration_ms != null ? `${latest.duration_ms}ms` : "-"}</td>
                    <td className="px-5 py-3 text-xs text-cr-slate max-w-md truncate">{latest?.error ?? (latest?.result ? JSON.stringify(latest.result) : "-")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CRCard>
    </div>
  );
}
