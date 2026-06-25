"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

type CarerRow = { id: string; first_name: string; last_name: string; created_at: string };
type HoursRow = { name: string; hours: number; visits: number; completion: number };

export default function StaffReportsPage() {
  const supabase = createClient();
  const [hoursData, setHoursData] = useState<HoursRow[]>([]);
  const [burnoutData, setBurnoutData] = useState<{ name: string; hours: number; risk: string }[]>([]);
  const [retentionData, setRetentionData] = useState<{ name: string; start_date: string; tenure_months: number }[]>([]);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (dateRange === "quarter" ? 3 : 1), 1).toISOString();

      const [{ data: carers }, { data: visits }] = await Promise.all([
        supabase.from("users").select("id, first_name, last_name, created_at").eq("organisation_id", u.organisation_id).eq("role", "carer").eq("is_active", true),
        supabase.from("visits").select("carer_id, status, actual_start, actual_end, scheduled_start").eq("organisation_id", u.organisation_id).gte("scheduled_start", start),
      ]);

      if (!carers || !visits) return;

      // Hours worked per carer
      const carerMap: Record<string, HoursRow> = {};
      (carers as CarerRow[]).forEach((c) => {
        carerMap[c.id] = { name: `${c.first_name} ${c.last_name}`, hours: 0, visits: 0, completion: 0 };
      });

      const scheduledCount: Record<string, number> = {};
      visits.forEach((v) => {
        if (!v.carer_id || !carerMap[v.carer_id]) return;
        scheduledCount[v.carer_id] = (scheduledCount[v.carer_id] ?? 0) + 1;
        if (v.status === "completed") {
          carerMap[v.carer_id].visits++;
          if (v.actual_start && v.actual_end) {
            carerMap[v.carer_id].hours += (new Date(v.actual_end).getTime() - new Date(v.actual_start).getTime()) / 3600000;
          }
        }
      });

      const hoursRows = Object.values(carerMap).map((r) => ({
        ...r,
        hours: Math.round(r.hours * 10) / 10,
        completion: scheduledCount[Object.keys(carerMap).find((k) => carerMap[k] === r) ?? ""] ? Math.round((r.visits / (scheduledCount[Object.keys(carerMap).find((k) => carerMap[k] === r) ?? ""] || 1)) * 100) : 0,
      })).sort((a, b) => b.hours - a.hours);
      setHoursData(hoursRows);

      // Burnout risk (simple: based on hours vs typical 37.5h contract)
      setBurnoutData(hoursRows.map((r) => ({
        name: r.name,
        hours: r.hours,
        risk: r.hours > 48 ? "high" : r.hours > 40 ? "medium" : "low",
      })));

      // Retention
      const today = new Date();
      setRetentionData((carers as CarerRow[]).map((c) => {
        const start = new Date(c.created_at);
        const months = Math.floor((today.getTime() - start.getTime()) / (30 * 24 * 3600000));
        return { name: `${c.first_name} ${c.last_name}`, start_date: start.toLocaleDateString("en-GB"), tenure_months: months };
      }).sort((a, b) => b.tenure_months - a.tenure_months));
    });
  }, [dateRange]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-cr-charcoal">Staff Reports</h1>
          <p className="text-sm text-cr-slate font-body mt-0.5">Hours worked, attendance, burnout risk, training, and retention.</p>
        </div>
        <div className="flex gap-2">
          {[["month", "This month"], ["quarter", "Last quarter"]].map(([v, l]) => (
            <button key={v} onClick={() => setDateRange(v)} className={`text-xs font-body font-medium px-3 py-1.5 rounded-lg border transition-colors ${dateRange === v ? "bg-cr-forest text-white border-cr-forest" : "border-gray-200 text-cr-charcoal hover:border-cr-forest"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Hours Worked */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Hours Worked</h3>
            <p className="text-xs text-cr-slate mt-0.5">Total hours delivered per carer in the selected period</p>
          </div>
          <button onClick={() => exportCSV(hoursData, `careroot-staff-hours-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {hoursData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hoursData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Sans" }} unit="h" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "DM Sans" }} width={130} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} formatter={(v) => [`${Number(v ?? 0)}h`, "Hours"]} />
              <Bar dataKey="hours" fill="#1A3C2E" name="Hours" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No active carers found or no visits in this period.</p>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Carer", "Visits", "Hours", "Completion Rate"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {hoursData.map((r) => <tr key={r.name}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td><td className="px-3 py-2.5 text-cr-slate">{r.visits}</td><td className="px-3 py-2.5 text-cr-charcoal">{r.hours}h</td><td className="px-3 py-2.5"><span className={`text-xs font-semibold ${r.completion >= 90 ? "text-cr-forest" : r.completion >= 70 ? "text-amber-600" : "text-cr-red"}`}>{r.completion}%</span></td></tr>)}
              {!hoursData.length && <tr><td colSpan={4} className="text-center py-6 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Burnout Risk */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Burnout Risk</h3>
            <p className="text-xs text-cr-slate mt-0.5">Traffic light based on hours worked vs standard contract (37.5h/week)</p>
          </div>
          <button onClick={() => exportCSV(burnoutData, `careroot-burnout-risk-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Carer", "Hours This Period", "Burnout Risk", "Recommended Action"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {burnoutData.map((r) => (
                <tr key={r.name}>
                  <td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td>
                  <td className="px-3 py-2.5 text-cr-charcoal">{r.hours}h</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${r.risk === "high" ? "bg-red-100 text-red-700" : r.risk === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {r.risk.charAt(0).toUpperCase() + r.risk.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-cr-slate text-xs">{r.risk === "high" ? "Review workload — consider reducing hours" : r.risk === "medium" ? "Monitor — approaching overtime threshold" : "No action needed"}</td>
                </tr>
              ))}
              {!burnoutData.length && <tr><td colSpan={4} className="text-center py-6 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Retention */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Staff Retention</h3>
            <p className="text-xs text-cr-slate mt-0.5">Active carers by start date and tenure</p>
          </div>
          <button onClick={() => exportCSV(retentionData, `careroot-staff-retention-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Carer", "Start Date", "Tenure"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {retentionData.map((r) => <tr key={r.name}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td><td className="px-3 py-2.5 text-cr-slate">{r.start_date}</td><td className="px-3 py-2.5 text-cr-charcoal">{r.tenure_months >= 12 ? `${Math.floor(r.tenure_months / 12)}y ${r.tenure_months % 12}m` : `${r.tenure_months}m`}</td></tr>)}
              {!retentionData.length && <tr><td colSpan={3} className="text-center py-6 text-cr-slate text-xs">No active carers</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remaining staff reports */}
      {[
        { title: "Attendance Report", desc: "Percentage of scheduled visits completed per carer" },
        { title: "Training Completion", desc: "Required training completion by carer — compliance percentages" },
        { title: "DBS Renewal", desc: "Staff DBS certificate status with renewal reminders" },
        { title: "Carer Performance", desc: "Visit completion rate, note submission rate, and client sentiment" },
        { title: "Right to Work", desc: "All staff right to work verification status and document expiry" },
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
