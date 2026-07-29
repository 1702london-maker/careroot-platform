"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, ShieldCheck } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function monthKey(date: string) {
  return new Date(date).toLocaleString("en-GB", { month: "short", year: "2-digit" });
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type DbsRow = { carer: string; compliance_item: string; expiry: string; days: number | null; status: string };
type CarePlanRow = { client: string; status: string; review_date: string; days_to_review: number | null; approved: string };
type EvidenceRow = { framework: string; statement: string; status: string; count: number };

export default function ComplianceReportsPage() {
  const supabase = createClient();
  const [incidentData, setIncidentData] = useState<{ month: string; low: number; medium: number; high: number; critical: number }[]>([]);
  const [complaintData, setComplaintData] = useState<{ month: string; received: number; resolved: number }[]>([]);
  const [medicationData, setMedicationData] = useState<{ name: string; value: number }[]>([]);
  const [dbsRows, setDbsRows] = useState<DbsRow[]>([]);
  const [trainingRows, setTrainingRows] = useState<DbsRow[]>([]);
  const [carePlanRows, setCarePlanRows] = useState<CarePlanRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [safeguardingRows, setSafeguardingRows] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const start = new Date();
      start.setMonth(start.getMonth() - 6);

      const [incidentRes, complaintRes, medRes, complianceRes, carePlanRes, evidenceRes, safeguardingRes] = await Promise.all([
        supabase.from("incidents").select("*").eq("organisation_id", u.organisation_id).gte("created_at", start.toISOString()),
        supabase.from("complaints").select("*").eq("organisation_id", u.organisation_id).gte("created_at", start.toISOString()),
        supabase.from("medication_records").select("status, clients!inner(organisation_id)").eq("clients.organisation_id", u.organisation_id).gte("created_at", start.toISOString()),
        supabase.from("staff_compliance").select("compliance_item, status, valid_until, staff:users!inner(first_name,last_name,organisation_id)").eq("staff.organisation_id", u.organisation_id),
        supabase.from("care_plans").select("status, is_current, review_date, approved_at, clients(first_name,last_name)").eq("organisation_id", u.organisation_id),
        supabase.from("compliance_evidence").select("framework, category, subcategory, status").eq("organisation_id", u.organisation_id),
        supabase.from("safeguarding_concerns").select("status, staff:users!inner(organisation_id)").eq("staff.organisation_id", u.organisation_id),
      ]);

      const iMap: Record<string, { low: number; medium: number; high: number; critical: number }> = {};
      (incidentRes.data ?? []).forEach((i: { created_at: string; severity?: string }) => {
        const key = monthKey(i.created_at);
        if (!iMap[key]) iMap[key] = { low: 0, medium: 0, high: 0, critical: 0 };
        const sev = (i.severity ?? "low") as keyof typeof iMap[string];
        if (sev in iMap[key]) iMap[key][sev]++;
      });
      setIncidentData(Object.entries(iMap).map(([month, d]) => ({ month, ...d })));

      const cMap: Record<string, { received: number; resolved: number }> = {};
      (complaintRes.data ?? []).forEach((c: { created_at: string; status: string }) => {
        const key = monthKey(c.created_at);
        if (!cMap[key]) cMap[key] = { received: 0, resolved: 0 };
        cMap[key].received++;
        if (["resolved", "closed"].includes(c.status)) cMap[key].resolved++;
      });
      setComplaintData(Object.entries(cMap).map(([month, d]) => ({ month, ...d })));

      const medMap: Record<string, number> = {};
      (medRes.data ?? []).forEach((m: { status: string }) => {
        medMap[m.status] = (medMap[m.status] ?? 0) + 1;
      });
      setMedicationData([
        { name: "Administered", value: (medMap.administered ?? 0) + (medMap.given ?? 0) },
        { name: "Refused", value: medMap.refused ?? 0 },
        { name: "Omitted/Missed", value: (medMap.omitted ?? 0) + (medMap.missed ?? 0) },
      ]);

      const staffRows = (complianceRes.data ?? []).map((r) => {
        const staff = one(r.staff);
        return {
          carer: `${staff?.first_name ?? ""} ${staff?.last_name ?? ""}`.trim() || "Unknown staff",
          compliance_item: r.compliance_item,
          expiry: r.valid_until ?? "",
          days: daysUntil(r.valid_until),
          status: r.status,
        };
      });
      setDbsRows(staffRows.filter((r) => /dbs/i.test(r.compliance_item)));
      setTrainingRows(staffRows.filter((r) => !/dbs/i.test(r.compliance_item)));

      setCarePlanRows((carePlanRes.data ?? []).map((p) => {
        const client = one(p.clients);
        return {
          client: `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "Unknown client",
          status: p.status ?? "draft",
          review_date: p.review_date ?? "",
          days_to_review: daysUntil(p.review_date),
          approved: p.approved_at ? "Yes" : "No",
        };
      }));

      const evMap: Record<string, EvidenceRow> = {};
      (evidenceRes.data ?? []).forEach((e: { framework?: string; category?: string; subcategory?: string; status?: string }) => {
        const statement = [e.category, e.subcategory].filter(Boolean).join(" / ") || "unmapped";
        const key = `${e.framework ?? "cqc"}:${statement}:${e.status ?? "unknown"}`;
        evMap[key] = evMap[key] ?? { framework: e.framework ?? "cqc", statement, status: e.status ?? "unknown", count: 0 };
        evMap[key].count++;
      });
      setEvidenceRows(Object.values(evMap));

      const safeMap: Record<string, number> = {};
      (safeguardingRes.data ?? []).forEach((s: { status?: string }) => {
        const status = s.status ?? "open";
        safeMap[status] = (safeMap[status] ?? 0) + 1;
      });
      setSafeguardingRows(Object.entries(safeMap).map(([status, count]) => ({ status, count })));
    });
  }, [supabase]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-cr-charcoal">Compliance Reports</h1>
        <p className="text-sm text-cr-slate font-body mt-0.5">Live CQC evidence, DBS, training, care-plan, safeguarding, complaint, incident and medication reports.</p>
      </div>

      <ReportCard title="Incident Trend" subtitle="Incidents per month by severity level" data={incidentData} filename="careroot-incident-trend">
        {incidentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="low" fill="#E8F5EE" name="Low" stackId="a" />
              <Bar dataKey="medium" fill="#F59E0B" name="Medium" stackId="a" />
              <Bar dataKey="high" fill="#1A3C2E" name="High" stackId="a" />
              <Bar dataKey="critical" fill="#DC2626" name="Critical" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState text="No incidents logged in the last 6 months." />}
      </ReportCard>

      <ReportCard title="Complaint Analysis" subtitle="Complaints received vs resolved per month" data={complaintData} filename="careroot-complaints">
        {complaintData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={complaintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="received" stroke="#DC2626" name="Received" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#1A3C2E" name="Resolved" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState text="No complaints logged in this period." />}
      </ReportCard>

      <ReportCard title="Medication Adherence" subtitle="Administered, refused, omitted and missed records" data={medicationData} filename="careroot-medication-adherence">
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={220} height={180}>
            <PieChart>
              <Pie data={medicationData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                {medicationData.map((_, i) => <Cell key={i} fill={["#1A3C2E", "#F59E0B", "#DC2626"][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <SummaryList rows={medicationData.map((d) => ({ label: d.name, value: d.value }))} />
        </div>
      </ReportCard>

      <TableReport title="DBS Status Report" subtitle="Live DBS compliance from staff records" rows={dbsRows} filename="careroot-dbs-status" columns={["carer", "compliance_item", "expiry", "days", "status"]} />
      <TableReport title="Training Compliance" subtitle="Live training and staff compliance records" rows={trainingRows} filename="careroot-training-compliance" columns={["carer", "compliance_item", "expiry", "days", "status"]} />
      <TableReport title="Care Plan Compliance" subtitle="Approved and review-due status by client" rows={carePlanRows} filename="careroot-care-plan-compliance" columns={["client", "status", "review_date", "days_to_review", "approved"]} />
      <TableReport title="CQC Evidence Summary" subtitle="Evidence counts by framework, statement and status" rows={evidenceRows} filename="careroot-cqc-evidence" columns={["framework", "statement", "status", "count"]} />
      <TableReport title="Safeguarding Summary" subtitle="Open, acknowledged and resolved safeguarding concerns" rows={safeguardingRows} filename="careroot-safeguarding-summary" columns={["status", "count"]} />
    </div>
  );
}

function ReportCard({ title, subtitle, data, filename, children }: { title: string; subtitle: string; data: Record<string, unknown>[]; filename: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-body font-semibold text-cr-charcoal text-lg">{title}</h3>
          <p className="text-xs text-cr-slate mt-0.5">{subtitle}</p>
        </div>
        <button onClick={() => exportCSV(data, `${filename}-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
      </div>
      {children}
    </div>
  );
}

function TableReport({ title, subtitle, rows, columns, filename }: { title: string; subtitle: string; rows: Record<string, unknown>[]; columns: string[]; filename: string }) {
  return (
    <ReportCard title={title} subtitle={subtitle} data={rows} filename={filename}>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{columns.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h.replace(/_/g, " ")}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, index) => (
                <tr key={index}>{columns.map((column) => <td key={column} className="px-3 py-2.5 text-cr-charcoal">{String(row[column] ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState text="No live records found for this report." />}
    </ReportCard>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-44 flex items-center justify-center bg-cr-mint/30 rounded-lg">
      <div className="text-center">
        <ShieldCheck size={30} className="mx-auto text-cr-forest mb-2" />
        <p className="text-sm text-cr-slate font-body">{text}</p>
      </div>
    </div>
  );
}

function SummaryList({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <div className="space-y-3 min-w-52">
      {rows.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: ["#1A3C2E", "#F59E0B", "#DC2626"][i] }} />
          <span className="text-sm font-body text-cr-charcoal">{d.label}</span>
          <span className="ml-auto font-semibold text-cr-charcoal">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
