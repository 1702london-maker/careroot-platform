"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";

type ReportRow = Record<string, string | number>;
type ReportSection = { title: string; desc: string; rows: ReportRow[] };
type CarerRow = {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

function exportCSV(data: ReportRow[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function DataSection({ section }: { section: ReportSection }) {
  const headers = Object.keys(section.rows[0] ?? { status: "" });
  return (
    <div className="mb-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-lg font-semibold text-cr-charcoal">{section.title}</h3>
          <p className="mt-0.5 text-xs text-cr-slate">{section.desc}</p>
        </div>
        <button
          onClick={() => exportCSV(section.rows, `careroot-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 font-body text-xs font-medium transition-colors hover:border-cr-forest"
        >
          <Download size={12} /> Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-cr-mint">
            <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cr-slate">{h.replace(/_/g, " ")}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {section.rows.map((row, i) => <tr key={i}>{headers.map((h) => <td key={h} className="px-3 py-2.5 text-cr-charcoal">{String(row[h] ?? "")}</td>)}</tr>)}
            {!section.rows.length && <tr><td colSpan={headers.length} className="py-6 text-center text-xs text-cr-slate">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StaffReportsPage() {
  const supabase = createClient();
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (dateRange === "quarter" ? 3 : 1), 1).toISOString();

      // Fetch carers first so their IDs can scope shift_logs (no org_id column on shift_logs)
      const { data: carers } = await supabase
        .from("users")
        .select("id, first_name, last_name, created_at")
        .eq("organisation_id", u.organisation_id)
        .eq("role", "carer");

      const carerIds = (carers ?? []).map((c: CarerRow) => c.id);

      const [{ data: visits }, { data: compliance }, { data: shiftLogs }] = await Promise.all([
        supabase.from("visits").select("carer_id, status, actual_start, actual_end, scheduled_start").eq("organisation_id", u.organisation_id).gte("scheduled_start", start),
        carerIds.length > 0
          ? supabase.from("staff_compliance").select("staff_id, compliance_item, status, valid_until").in("staff_id", carerIds)
          : Promise.resolve({ data: [] }),
        carerIds.length > 0
          ? supabase.from("shift_logs").select("staff_id, id").gte("server_timestamp", start).in("staff_id", carerIds)
          : Promise.resolve({ data: [] }),
      ]);

      const carerRows = (carers ?? []) as CarerRow[]; // already fetched and scoped to org
      const scheduled: Record<string, number> = {};
      const completed: Record<string, number> = {};
      const hours: Record<string, number> = {};
      (visits ?? []).forEach((visit) => {
        if (!visit.carer_id) return;
        scheduled[visit.carer_id] = (scheduled[visit.carer_id] ?? 0) + 1;
        if (visit.status === "completed") {
          completed[visit.carer_id] = (completed[visit.carer_id] ?? 0) + 1;
          if (visit.actual_start && visit.actual_end) {
            hours[visit.carer_id] = (hours[visit.carer_id] ?? 0) + (new Date(visit.actual_end).getTime() - new Date(visit.actual_start).getTime()) / 3600000;
          }
        }
      });

      const notes: Record<string, number> = {};
      (shiftLogs ?? []).forEach((log) => {
        if (log.staff_id) notes[log.staff_id] = (notes[log.staff_id] ?? 0) + 1;
      });

      const name = (c: CarerRow) => `${c.first_name} ${c.last_name}`.trim();
      const completionRate = (id: string) => scheduled[id] ? Math.round(((completed[id] ?? 0) / scheduled[id]) * 100) : 0;
      const complianceFor = (id: string, matcher: (item: string) => boolean) => (compliance ?? []).filter((row) => row.staff_id === id && matcher(String(row.compliance_item)));

      setSections([
        {
          title: "Hours Worked",
          desc: "Total hours delivered per carer in the selected period.",
          rows: carerRows.map((c) => ({ carer: name(c), visits: completed[c.id] ?? 0, hours: Math.round((hours[c.id] ?? 0) * 10) / 10, completion_rate: `${completionRate(c.id)}%` })),
        },
        {
          title: "Attendance Report",
          desc: "Percentage of scheduled visits completed per carer.",
          rows: carerRows.map((c) => ({ carer: name(c), scheduled_visits: scheduled[c.id] ?? 0, completed_visits: completed[c.id] ?? 0, attendance_rate: `${completionRate(c.id)}%` })),
        },
        {
          title: "Training Completion",
          desc: "Required training completion by carer.",
          rows: carerRows.map((c) => {
            const rows = complianceFor(c.id, (item) => item.includes("training"));
            const current = rows.filter((row) => row.status === "current").length;
            return { carer: name(c), training_items: rows.length, current_items: current, completion_rate: rows.length ? `${Math.round((current / rows.length) * 100)}%` : "No records" };
          }),
        },
        {
          title: "DBS Renewal",
          desc: "Staff DBS certificate status with renewal reminders.",
          rows: carerRows.map((c) => {
            const dbsRows = complianceFor(c.id, (item) => item.toLowerCase().includes("dbs"));
            const nextExpiry = dbsRows
              .map((row) => row.valid_until)
              .filter(Boolean)
              .sort()[0];
            const days = nextExpiry ? Math.ceil((new Date(nextExpiry).getTime() - now.getTime()) / 86400000) : null;
            return { carer: name(c), dbs_expiry: nextExpiry ? new Date(nextExpiry).toLocaleDateString("en-GB") : "Missing", status: days === null ? "missing" : days < 0 ? "expired" : days <= 60 ? "expiring soon" : "current" };
          }),
        },
        {
          title: "Carer Performance",
          desc: "Visit completion, care-note output, and hours worked.",
          rows: carerRows.map((c) => ({ carer: name(c), visit_completion: `${completionRate(c.id)}%`, notes_submitted: notes[c.id] ?? 0, hours_worked: Math.round((hours[c.id] ?? 0) * 10) / 10 })),
        },
        {
          title: "Right to Work",
          desc: "Right to work verification status by staff member.",
          rows: carerRows.map((c) => {
            const rows = complianceFor(c.id, (item) => item.toLowerCase().includes("right to work"));
            return { carer: name(c), status: rows.some((row) => row.status === "current" || row.status === "verified") ? "verified" : "missing" };
          }),
        },
      ]);
    });
  }, [dateRange]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-cr-charcoal">Staff Reports</h1>
          <p className="mt-0.5 font-body text-sm text-cr-slate">Hours, attendance, burnout indicators, training, DBS, and right to work.</p>
        </div>
        <div className="flex gap-2">
          {[["month", "This month"], ["quarter", "Last quarter"]].map(([v, l]) => (
            <button key={v} onClick={() => setDateRange(v)} className={`rounded-lg border px-3 py-1.5 font-body text-xs font-medium transition-colors ${dateRange === v ? "border-cr-forest bg-cr-forest text-white" : "border-gray-200 text-cr-charcoal hover:border-cr-forest"}`}>{l}</button>
          ))}
        </div>
      </div>
      {sections.map((section) => <DataSection key={section.title} section={section} />)}
    </div>
  );
}
