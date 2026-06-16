"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLOURS = ["#1A3C2E", "#4A7C5E", "#C9A84C", "#E8F5EE", "#6B7280"];

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function ReportSection({ title, description, children, onExport }: { title: string; description: string; children: React.ReactNode; onExport: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-body font-semibold text-cr-charcoal text-lg">{title}</h3>
          <p className="text-xs text-cr-slate mt-0.5">{description}</p>
        </div>
        <button onClick={onExport} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-cr-charcoal hover:border-cr-forest transition-colors flex items-center gap-1.5">
          <Download size={12} /> Export CSV
        </button>
      </div>
      {children}
      <button onClick={() => setOpen(!open)} className="mt-4 text-xs font-body text-cr-forest flex items-center gap-1 hover:opacity-70">
        {open ? <><ChevronUp size={14} /> Hide data table</> : <><ChevronDown size={14} /> View data table</>}
      </button>
      {open && <div className="mt-3 overflow-x-auto border border-gray-100 rounded-lg">{/* Table slot rendered inside children or below */}</div>}
    </div>
  );
}

export default function VisitReportsPage() {
  const supabase = createClient();
  const [orgId, setOrgId] = useState("");
  const [completionData, setCompletionData] = useState<{ week: string; scheduled: number; completed: number; missed: number; rate: number }[]>([]);
  const [carerWorkload, setCarerWorkload] = useState<{ name: string; visits: number; hours: number }[]>([]);
  const [durationData, setDurationData] = useState<{ name: string; scheduled: number; actual: number }[]>([]);
  const [gpsData, setGpsData] = useState([{ name: "GPS Verified", value: 0 }, { name: "Not Verified", value: 0 }]);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;
      setOrgId(u.organisation_id);

      const now = new Date();
      const start = dateRange === "week"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        : new Date(now.getFullYear(), now.getMonth() - (dateRange === "quarter" ? 3 : 1), 1).toISOString();

      const { data: visits } = await supabase.from("visits").select("*, users!visits_carer_id_fkey(first_name, last_name)").eq("organisation_id", u.organisation_id).gte("scheduled_start", start);

      if (!visits) return;

      // Visit completion by week
      const weekMap: Record<string, { scheduled: number; completed: number; missed: number }> = {};
      visits.forEach((v) => {
        const d = new Date(v.scheduled_start);
        const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("en-GB", { month: "short" })}`;
        if (!weekMap[week]) weekMap[week] = { scheduled: 0, completed: 0, missed: 0 };
        weekMap[week].scheduled++;
        if (v.status === "completed") weekMap[week].completed++;
        if (v.status === "missed") weekMap[week].missed++;
      });
      setCompletionData(Object.entries(weekMap).map(([week, d]) => ({ week, ...d, rate: d.scheduled ? Math.round((d.completed / d.scheduled) * 100) : 0 })));

      // Carer workload
      const carerMap: Record<string, { name: string; visits: number; hours: number }> = {};
      visits.filter((v) => v.status === "completed").forEach((v) => {
        const carer = v.users as { first_name: string; last_name: string } | null;
        if (!carer) return;
        const name = `${carer.first_name} ${carer.last_name}`;
        if (!carerMap[name]) carerMap[name] = { name, visits: 0, hours: 0 };
        carerMap[name].visits++;
        if (v.actual_start && v.actual_end) {
          carerMap[name].hours += (new Date(v.actual_end).getTime() - new Date(v.actual_start).getTime()) / 3600000;
        }
      });
      setCarerWorkload(Object.values(carerMap).sort((a, b) => b.hours - a.hours).slice(0, 10));

      // Duration analysis
      const dur = visits.filter((v) => v.status === "completed" && v.actual_start && v.actual_end).slice(0, 12).map((v) => {
        const carer = v.users as { first_name: string; last_name: string } | null;
        const actualH = (new Date(v.actual_end).getTime() - new Date(v.actual_start).getTime()) / 3600000;
        const schH = v.scheduled_end ? (new Date(v.scheduled_end).getTime() - new Date(v.scheduled_start).getTime()) / 3600000 : actualH;
        return { name: carer ? `${carer.first_name.charAt(0)}. ${new Date(v.scheduled_start).toLocaleDateString("en-GB")}` : "", scheduled: Math.round(schH * 10) / 10, actual: Math.round(actualH * 10) / 10 };
      });
      setDurationData(dur);

      // GPS
      const verified = visits.filter((v) => v.check_in_lat && v.check_out_lat).length;
      setGpsData([{ name: "GPS Verified", value: verified }, { name: "Not Verified", value: visits.length - verified }]);
    });
  }, [dateRange]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-cr-charcoal">Visit Reports</h1>
          <p className="text-sm text-cr-slate font-body mt-0.5">Completion rates, missed visits, duration analysis, and carer performance.</p>
        </div>
        <div className="flex gap-2">
          {[["week", "This week"], ["month", "This month"], ["quarter", "Last 3 months"]].map(([v, l]) => (
            <button key={v} onClick={() => setDateRange(v)} className={`text-xs font-body font-medium px-3 py-1.5 rounded-lg border transition-colors ${dateRange === v ? "bg-cr-forest text-white border-cr-forest" : "border-gray-200 text-cr-charcoal hover:border-cr-forest"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Report 1 — Completion Rate */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Visit Completion Rate</h3>
            <p className="text-xs text-cr-slate mt-0.5">Completed vs scheduled visits per week</p>
          </div>
          <button onClick={() => exportCSV(completionData, `careroot-visit-completion-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {completionData.length > 0 ? (
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
        ) : (
          <div className="h-60 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No visit data for this period.</p>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Week", "Scheduled", "Completed", "Missed", "Completion %"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {completionData.map((r) => <tr key={r.week}><td className="px-3 py-2.5 text-cr-charcoal">{r.week}</td><td className="px-3 py-2.5 text-cr-slate">{r.scheduled}</td><td className="px-3 py-2.5 text-cr-sage">{r.completed}</td><td className="px-3 py-2.5 text-cr-red">{r.missed}</td><td className="px-3 py-2.5 font-medium">{r.rate}%</td></tr>)}
              {!completionData.length && <tr><td colSpan={5} className="text-center py-8 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report 2 — Carer Workload */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Carer Workload</h3>
            <p className="text-xs text-cr-slate mt-0.5">Total hours delivered per carer in the selected period</p>
          </div>
          <button onClick={() => exportCSV(carerWorkload, `careroot-carer-workload-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {carerWorkload.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carerWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "DM Sans" }} width={120} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="hours" fill="#1A3C2E" name="Hours" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No data for this period.</p>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Carer", "Visits", "Hours"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {carerWorkload.map((r) => <tr key={r.name}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.name}</td><td className="px-3 py-2.5 text-cr-slate">{r.visits}</td><td className="px-3 py-2.5 text-cr-charcoal">{r.hours.toFixed(1)}h</td></tr>)}
              {!carerWorkload.length && <tr><td colSpan={3} className="text-center py-8 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report 3 — Visit Duration Analysis */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Visit Duration Analysis</h3>
            <p className="text-xs text-cr-slate mt-0.5">Scheduled vs actual visit duration</p>
          </div>
          <button onClick={() => exportCSV(durationData, `careroot-visit-duration-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {durationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} unit="h" />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="scheduled" fill="#4A7C5E" name="Scheduled (h)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#1A3C2E" name="Actual (h)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No completed visits with actual times recorded.</p>
          </div>
        )}
      </div>

      {/* Report 4 — GPS Verification */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">GPS Verification</h3>
            <p className="text-xs text-cr-slate mt-0.5">Proportion of visits with GPS check-in and check-out verified</p>
          </div>
          <button onClick={() => exportCSV(gpsData, `careroot-gps-verification-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={240} height={200}>
            <PieChart>
              <Pie data={gpsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {gpsData.map((_, i) => <Cell key={i} fill={COLOURS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {gpsData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: COLOURS[i] }} />
                <span className="text-sm font-body text-cr-charcoal">{d.name}</span>
                <span className="ml-2 font-semibold text-cr-charcoal">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports 5-12 — Placeholder cards for remaining reports */}
      {[
        { title: "Late Visits", desc: "Check-ins more than 15 minutes after scheduled start time" },
        { title: "Visit Frequency by Client", desc: "Scheduled vs completed visits per client per month" },
        { title: "Bank Holiday Coverage", desc: "Visit coverage on bank holidays in the selected period" },
        { title: "Visit Notes Sentiment", desc: "AI-scored sentiment analysis of visit notes" },
        { title: "Handover Compliance", desc: "Percentage of visits with notes submitted within 2 hours of checkout" },
        { title: "Consecutive Missed Visits", desc: "Clients with 2 or more consecutive missed visits — red flag report" },
        { title: "Missed Visits Analysis", desc: "Missed visits by reason: No show, Late cancellation, Client unavailable" },
        { title: "Average Manager Response Time", desc: "Time between visit note submission and manager review" },
      ].map((r) => (
        <div key={r.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-body font-semibold text-cr-charcoal text-lg">{r.title}</h3>
              <p className="text-xs text-cr-slate mt-0.5">{r.desc}</p>
            </div>
            <button className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5 opacity-50"><Download size={12} /> Export</button>
          </div>
          <div className="h-48 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No data for this period. Visits will populate this report as they are completed.</p>
          </div>
        </div>
      ))}
    </div>
  );
}
