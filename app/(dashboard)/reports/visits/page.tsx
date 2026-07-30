"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CompletionRow = { week: string; scheduled: number; completed: number; missed: number; rate: number };
type WorkloadRow = { name: string; visits: number; hours: number };
type ExceptionRow = { metric: string; value: number; action: string };

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function weekLabel(value: string) {
  const d = new Date(value);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function VisitReportsPage() {
  const supabase = createClient();
  const [completionData, setCompletionData] = useState<CompletionRow[]>([]);
  const [carerWorkload, setCarerWorkload] = useState<WorkloadRow[]>([]);
  const [exceptionData, setExceptionData] = useState<ExceptionRow[]>([]);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const now = new Date();
      const start = dateRange === "week"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        : new Date(now.getFullYear(), now.getMonth() - (dateRange === "quarter" ? 3 : 1), 1).toISOString();

      const { data: visits } = await supabase
        .from("visits")
        .select("*, users!visits_carer_id_fkey(first_name, last_name)")
        .eq("organisation_id", u.organisation_id)
        .gte("scheduled_start", start);

      if (!visits) return;

      const weekMap: Record<string, { scheduled: number; completed: number; missed: number }> = {};
      const carerMap: Record<string, WorkloadRow> = {};

      visits.forEach((v) => {
        const week = weekLabel(v.scheduled_start);
        if (!weekMap[week]) weekMap[week] = { scheduled: 0, completed: 0, missed: 0 };
        weekMap[week].scheduled += 1;
        if (v.status === "completed") weekMap[week].completed += 1;
        if (v.status === "missed") weekMap[week].missed += 1;

        if (v.status === "completed") {
          const carer = v.users as { first_name: string; last_name: string } | null;
          const name = carer ? `${carer.first_name} ${carer.last_name}` : "Unassigned";
          if (!carerMap[name]) carerMap[name] = { name, visits: 0, hours: 0 };
          carerMap[name].visits += 1;
          if (v.actual_start && v.actual_end) {
            carerMap[name].hours += (new Date(v.actual_end).getTime() - new Date(v.actual_start).getTime()) / 3600000;
          }
        }
      });

      setCompletionData(Object.entries(weekMap).map(([week, d]) => ({
        week,
        ...d,
        rate: d.scheduled ? Math.round((d.completed / d.scheduled) * 100) : 0,
      })));

      setCarerWorkload(Object.values(carerMap).map((r) => ({ ...r, hours: Math.round(r.hours * 10) / 10 })).sort((a, b) => b.hours - a.hours).slice(0, 10));

      const gpsVerified = visits.filter((v) => v.check_in_lat && v.check_out_lat).length;
      const lateVisits = visits.filter((v) => v.actual_start && v.scheduled_start && new Date(v.actual_start).getTime() - new Date(v.scheduled_start).getTime() > 15 * 60 * 1000).length;
      const missingNotes = visits.filter((v) => v.status === "completed" && !v.notes_submitted_at).length;
      setExceptionData([
        { metric: "Late check-ins over 15 minutes", value: lateVisits, action: "Review punctuality and contact affected clients" },
        { metric: "Completed visits missing notes", value: missingNotes, action: "Chase carers before payroll and compliance close" },
        { metric: "Missed visits", value: visits.filter((v) => v.status === "missed").length, action: "Audit reason and management response" },
        { metric: "Cancelled visits", value: visits.filter((v) => v.status === "cancelled").length, action: "Check cancellation reason and billing impact" },
        { metric: "GPS not fully verified", value: visits.length - gpsVerified, action: "Check location permissions and device compliance" },
      ]);
    });
  }, [dateRange, supabase]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-cr-charcoal">Visit Reports</h1>
          <p className="text-sm text-cr-slate font-body mt-0.5">Completion rates, missed visits, GPS verification, duration and operational exceptions.</p>
        </div>
        <div className="flex gap-2">
          {[["week", "This week"], ["month", "This month"], ["quarter", "Last 3 months"]].map(([v, l]) => (
            <button key={v} onClick={() => setDateRange(v)} className={`text-xs font-body font-medium px-3 py-1.5 rounded-lg border transition-colors ${dateRange === v ? "bg-cr-forest text-white border-cr-forest" : "border-gray-200 text-cr-charcoal hover:border-cr-forest"}`}>{l}</button>
          ))}
        </div>
      </div>

      <ReportCard title="Visit Completion Rate" description="Completed vs scheduled visits by week-start date." data={completionData} filename="careroot-visit-completion">
        {completionData.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Line type="monotone" dataKey="scheduled" stroke="#6B7280" name="Scheduled" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" stroke="#1A3C2E" name="Completed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="missed" stroke="#DC2626" name="Missed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState>No visit data for this period.</EmptyState>}
        <DataTable rows={completionData as unknown as Record<string, unknown>[]} />
      </ReportCard>

      <ReportCard title="Carer Workload" description="Completed visits and actual hours per carer." data={carerWorkload} filename="careroot-carer-workload">
        {carerWorkload.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carerWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "DM Sans" }} width={130} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="hours" fill="#1A3C2E" name="Hours" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState>No completed visits for this period.</EmptyState>}
        <DataTable rows={carerWorkload as unknown as Record<string, unknown>[]} />
      </ReportCard>

      <ReportCard title="Operational Exceptions" description="Live exception summary for missed visits, late check-ins, note gaps and GPS gaps." data={exceptionData} filename="careroot-visit-exceptions">
        <DataTable rows={exceptionData as unknown as Record<string, unknown>[]} />
      </ReportCard>
    </div>
  );
}

function ReportCard({ title, description, data, filename, children }: { title: string; description: string; data: Record<string, unknown>[]; filename: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-body font-semibold text-cr-charcoal text-lg">{title}</h3>
          <p className="text-xs text-cr-slate mt-0.5">{description}</p>
        </div>
        <button onClick={() => exportCSV(data, `${filename}-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg"><p className="text-sm text-cr-slate font-body">{children}</p></div>;
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm font-body">
        <thead className="bg-cr-mint"><tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h.replace(/_/g, " ")}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => <tr key={i}>{headers.map((h) => <td key={h} className="px-3 py-2.5 text-cr-charcoal">{String(row[h] ?? "")}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
