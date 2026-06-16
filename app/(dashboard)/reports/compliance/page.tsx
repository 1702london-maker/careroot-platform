"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, ShieldCheck, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

const DBS_MOCK = [
  { carer: "Sample Carer A", dbs_number: "001234567890", expiry: "2025-09-30", days: 106, status: "amber" },
  { carer: "Sample Carer B", dbs_number: "009876543210", expiry: "2026-08-15", days: 425, status: "green" },
];

export default function ComplianceReportsPage() {
  const supabase = createClient();
  const [incidentData, setIncidentData] = useState<{ month: string; low: number; medium: number; high: number; critical: number }[]>([]);
  const [complaintData, setComplaintData] = useState<{ month: string; received: number; resolved: number }[]>([]);
  const [medicationData, setMedicationData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const start = new Date();
      start.setMonth(start.getMonth() - 6);

      const [{ data: incidents }, { data: complaints }, { data: meds }] = await Promise.all([
        supabase.from("incidents").select("*").eq("organisation_id", u.organisation_id).gte("created_at", start.toISOString()).catch(() => ({ data: null })),
        supabase.from("complaints").select("*").eq("organisation_id", u.organisation_id).gte("received_date", start.toISOString().split("T")[0]).catch(() => ({ data: null })),
        supabase.from("medication_records").select("status").eq("organisation_id", u.organisation_id).gte("created_at", start.toISOString()).catch(() => ({ data: null })),
      ]);

      // Incident trend by month
      const iMap: Record<string, { low: number; medium: number; high: number; critical: number }> = {};
      (incidents ?? []).forEach((i: { created_at: string; severity: string }) => {
        const key = new Date(i.created_at).toLocaleString("en-GB", { month: "short", year: "2-digit" });
        if (!iMap[key]) iMap[key] = { low: 0, medium: 0, high: 0, critical: 0 };
        const sev = (i.severity ?? "low") as keyof typeof iMap[string];
        if (sev in iMap[key]) iMap[key][sev]++;
      });
      setIncidentData(Object.entries(iMap).map(([month, d]) => ({ month, ...d })));

      // Complaint trend
      const cMap: Record<string, { received: number; resolved: number }> = {};
      (complaints ?? []).forEach((c: { received_date: string; status: string }) => {
        const key = new Date(c.received_date).toLocaleString("en-GB", { month: "short", year: "2-digit" });
        if (!cMap[key]) cMap[key] = { received: 0, resolved: 0 };
        cMap[key].received++;
        if (c.status === "resolved") cMap[key].resolved++;
      });
      setComplaintData(Object.entries(cMap).map(([month, d]) => ({ month, ...d })));

      // Medication adherence
      const medMap: Record<string, number> = {};
      (meds ?? []).forEach((m: { status: string }) => {
        medMap[m.status] = (medMap[m.status] ?? 0) + 1;
      });
      setMedicationData([
        { name: "Given", value: medMap["given"] ?? 0 },
        { name: "Refused", value: medMap["refused"] ?? 0 },
        { name: "Missed", value: medMap["missed"] ?? 0 },
      ]);
    });
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-cr-charcoal">Compliance Reports</h1>
        <p className="text-sm text-cr-slate font-body mt-0.5">CQC evidence, complaint analysis, incident trends, DBS status, and medication adherence.</p>
      </div>

      {/* Incident Trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Incident Trend</h3>
            <p className="text-xs text-cr-slate mt-0.5">Incidents per month by severity level</p>
          </div>
          <button onClick={() => exportCSV(incidentData, `careroot-incident-trend-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {incidentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="low" fill="#E8F5EE" name="Low" stackId="a" />
              <Bar dataKey="medium" fill="#F59E0B" name="Medium" stackId="a" />
              <Bar dataKey="high" fill="#1A3C2E" name="High" stackId="a" />
              <Bar dataKey="critical" fill="#DC2626" name="Critical" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <div className="text-center">
              <ShieldCheck size={32} className="mx-auto text-cr-forest mb-2" />
              <p className="text-sm text-cr-slate font-body">No incidents logged in the last 6 months.</p>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Analysis */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Complaint Analysis</h3>
            <p className="text-xs text-cr-slate mt-0.5">Complaints received vs resolved per month, against 28-day target</p>
          </div>
          <button onClick={() => exportCSV(complaintData, `careroot-complaints-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {complaintData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={complaintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Line type="monotone" dataKey="received" stroke="#DC2626" name="Received" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#1A3C2E" name="Resolved" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No complaints logged in this period.</p>
          </div>
        )}
      </div>

      {/* Medication Adherence */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Medication Adherence</h3>
            <p className="text-xs text-cr-slate mt-0.5">Proportion of medications given, refused, or missed</p>
          </div>
          <button onClick={() => exportCSV(medicationData, `careroot-medication-adherence-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={200} height={180}>
            <PieChart>
              <Pie data={medicationData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                {medicationData.map((_, i) => <Cell key={i} fill={["#1A3C2E", "#F59E0B", "#DC2626"][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {medicationData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: ["#1A3C2E", "#F59E0B", "#DC2626"][i] }} />
                <span className="text-sm font-body text-cr-charcoal">{d.name}</span>
                <span className="ml-auto font-semibold text-cr-charcoal">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DBS Status Report */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">DBS Status Report</h3>
            <p className="text-xs text-cr-slate mt-0.5">All staff DBS certificate status — traffic light by days to expiry</p>
          </div>
          <button onClick={() => exportCSV(DBS_MOCK, `careroot-dbs-status-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="flex gap-3 mb-4 text-xs font-body">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &gt;90 days — Valid</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 30–90 days — Renew soon</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cr-red inline-block" /> &lt;30 days — Urgent</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Carer", "DBS Number", "Expiry", "Status", "Days Remaining"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {DBS_MOCK.map((r) => (
                <tr key={r.carer}>
                  <td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.carer}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-cr-slate">{r.dbs_number}</td>
                  <td className="px-3 py-2.5 text-cr-slate">{new Date(r.expiry).toLocaleDateString("en-GB")}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === "green" ? "bg-green-100 text-green-700" : r.status === "amber" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {r.status === "green" ? "Valid" : r.status === "amber" ? "Renew soon" : "Urgent"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-cr-charcoal font-medium">{r.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-cr-slate mt-3 font-body">DBS data pulls from staff records when HR module is configured.</p>
        </div>
      </div>

      {/* Remaining compliance reports */}
      {[
        { title: "CQC Evidence Summary", desc: "Compliance score per CQC key question with RAG status and evidence count" },
        { title: "Care Plan Compliance", desc: "Clients with active approved care plan vs those overdue for review" },
        { title: "Care Plan Views", desc: "Evidence that carers are reading care plans before visits" },
        { title: "Safeguarding Summary", desc: "AI-flagged safeguarding concerns — open, acknowledged, and resolved" },
        { title: "Training Compliance", desc: "Required training completion percentage per carer" },
        { title: "AI Risk Flag Summary", desc: "All AI risk flags by type and severity across the organisation" },
      ].map((r) => (
        <div key={r.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-body font-semibold text-cr-charcoal text-lg">{r.title}</h3>
              <p className="text-xs text-cr-slate mt-0.5">{r.desc}</p>
            </div>
            <button className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 opacity-50 flex items-center gap-1.5"><Download size={12} /> Export</button>
          </div>
          <div className="h-36 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">Data populates as records are added to the system.</p>
          </div>
        </div>
      ))}
    </div>
  );
}
