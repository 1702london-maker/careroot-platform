"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Heart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

type ClientRow = { id: string; first_name: string; last_name: string; risk_level: string; care_plan_status: string; care_plan_last_reviewed: string | null };

export default function ClientReportsPage() {
  const supabase = createClient();
  const [riskData, setRiskData] = useState<{ name: string; risk_level: string; plan_status: string; plan_due: string }[]>([]);
  const [visitFreqData, setVisitFreqData] = useState<{ name: string; scheduled: number; actual: number; pct: number }[]>([]);
  const [riskChart, setRiskChart] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const [{ data: clients }, { data: visits }] = await Promise.all([
        supabase.from("clients").select("id, first_name, last_name, risk_level, care_plan_status, care_plan_last_reviewed").eq("organisation_id", u.organisation_id).eq("is_active", true),
        supabase.from("visits").select("client_id, status, scheduled_start").eq("organisation_id", u.organisation_id).gte("scheduled_start", new Date(Date.now() - 30 * 24 * 3600000).toISOString()),
      ]);

      if (!clients) return;
      const cl = clients as ClientRow[];

      // Risk overview
      setRiskData(cl.map((c) => {
        const dueDate = c.care_plan_last_reviewed ? new Date(new Date(c.care_plan_last_reviewed).getTime() + 180 * 24 * 3600000) : null;
        return { name: `${c.first_name} ${c.last_name}`, risk_level: c.risk_level ?? "low", plan_status: c.care_plan_status ?? "draft", plan_due: dueDate ? dueDate.toLocaleDateString("en-GB") : "Not set" };
      }));

      // Risk chart
      const riskMap: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      cl.forEach((c) => { if (c.risk_level && c.risk_level in riskMap) riskMap[c.risk_level]++; });
      setRiskChart(Object.entries(riskMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      // Visit frequency
      const schedMap: Record<string, { scheduled: number; actual: number }> = {};
      cl.forEach((c) => { schedMap[c.id] = { scheduled: 0, actual: 0 }; });
      (visits ?? []).forEach((v) => {
        if (!schedMap[v.client_id]) return;
        schedMap[v.client_id].scheduled++;
        if (v.status === "completed") schedMap[v.client_id].actual++;
      });
      setVisitFreqData(cl.map((c) => {
        const d = schedMap[c.id] ?? { scheduled: 0, actual: 0 };
        return { name: `${c.first_name} ${c.last_name}`, scheduled: d.scheduled, actual: d.actual, pct: d.scheduled ? Math.round((d.actual / d.scheduled) * 100) : 0 };
      }).sort((a, b) => b.scheduled - a.scheduled).slice(0, 15));
    });
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-cr-charcoal">Client Reports</h1>
        <p className="text-sm text-cr-slate font-body mt-0.5">Care plan status, risk assessments, medication adherence, and service delivery.</p>
      </div>

      {/* Risk Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Client Risk Overview</h3>
            <p className="text-xs text-cr-slate mt-0.5">All active clients by current risk level</p>
          </div>
          <button onClick={() => exportCSV(riskData, `careroot-client-risk-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {riskChart.some((d) => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="value" name="Clients" radius={[4, 4, 0, 0]}>
                {riskChart.map((d) => (
                  <rect key={d.name} fill={d.name === "Critical" ? "#DC2626" : d.name === "High" ? "#F59E0B" : d.name === "Medium" ? "#4A7C5E" : "#E8F5EE"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center bg-cr-mint/30 rounded-lg mb-4">
            <div className="text-center"><Heart size={28} className="mx-auto text-cr-forest mb-2" /><p className="text-sm text-cr-slate font-body">No clients or risk levels not yet assigned.</p></div>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Client", "Risk Level", "Care Plan", "Review Due"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {riskData.map((r) => (
                <tr key={r.name}>
                  <td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td>
                  <td className="px-3 py-2.5"><span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${r.risk_level === "critical" ? "bg-red-100 text-red-700" : r.risk_level === "high" ? "bg-amber-100 text-amber-700" : r.risk_level === "medium" ? "bg-cr-mint text-cr-forest" : "bg-gray-100 text-gray-600"}`}>{r.risk_level}</span></td>
                  <td className="px-3 py-2.5 capitalize text-cr-slate">{r.plan_status}</td>
                  <td className="px-3 py-2.5 text-cr-slate text-xs">{r.plan_due}</td>
                </tr>
              ))}
              {!riskData.length && <tr><td colSpan={4} className="text-center py-6 text-cr-slate text-xs">No active clients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visit Frequency */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Visit Frequency</h3>
            <p className="text-xs text-cr-slate mt-0.5">Scheduled vs completed visits per client — last 30 days</p>
          </div>
          <button onClick={() => exportCSV(visitFreqData, `careroot-client-visit-frequency-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {visitFreqData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={visitFreqData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: "DM Sans" }} width={130} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="scheduled" fill="#4A7C5E" name="Scheduled" />
              <Bar dataKey="actual" fill="#1A3C2E" name="Completed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No visits in the last 30 days.</p>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Client", "Scheduled", "Completed", "Adherence %"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {visitFreqData.map((r) => <tr key={r.name}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td><td className="px-3 py-2.5 text-cr-slate">{r.scheduled}</td><td className="px-3 py-2.5 text-cr-sage">{r.actual}</td><td className="px-3 py-2.5"><span className={`text-xs font-semibold ${r.pct >= 90 ? "text-cr-forest" : r.pct >= 70 ? "text-amber-600" : "text-cr-red"}`}>{r.pct}%</span></td></tr>)}
              {!visitFreqData.length && <tr><td colSpan={4} className="text-center py-6 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remaining client reports */}
      {[
        { title: "Medication Adherence", desc: "Per client medication compliance — given, refused, and missed breakdown" },
        { title: "Appetite and Nutrition", desc: "Clients with appetite concerns flagged by carers" },
        { title: "Care Plan Review Status", desc: "Plans due or overdue for review with assigned coordinator" },
        { title: "Incident Summary", desc: "Incidents per client in the selected period, by severity" },
        { title: "Emergency Events", desc: "All emergency events by client with resolution time and outcome" },
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
