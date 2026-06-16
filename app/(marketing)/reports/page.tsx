"use client";

import Link from "next/link";
import { Activity, BarChart2, ShieldCheck, Users, Heart, Settings, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const SAMPLE_DATA = [
  { week: "Wk 1", completed: 42, scheduled: 45 },
  { week: "Wk 2", completed: 38, scheduled: 40 },
  { week: "Wk 3", completed: 47, scheduled: 50 },
  { week: "Wk 4", completed: 51, scheduled: 52 },
  { week: "Wk 5", completed: 44, scheduled: 46 },
  { week: "Wk 6", completed: 55, scheduled: 56 },
  { week: "Wk 7", completed: 49, scheduled: 52 },
  { week: "Wk 8", completed: 53, scheduled: 54 },
  { week: "Wk 9", completed: 58, scheduled: 60 },
  { week: "Wk 10", completed: 56, scheduled: 58 },
  { week: "Wk 11", completed: 61, scheduled: 62 },
  { week: "Wk 12", completed: 64, scheduled: 65 },
];

const CATEGORIES = [
  { title: "Visit Reports", icon: Activity, count: "12 reports", desc: "Completion rates, missed visits, GPS verification, visit duration analysis" },
  { title: "Financial Reports", icon: BarChart2, count: "8 reports", desc: "Revenue, outstanding invoices, payment trends, client profitability" },
  { title: "Compliance Reports", icon: ShieldCheck, count: "10 reports", desc: "CQC evidence, complaint analysis, incident trends, DBS status" },
  { title: "Staff Reports", icon: Users, count: "8 reports", desc: "Hours worked, attendance, burnout risk, training completion" },
  { title: "Client Reports", icon: Heart, count: "7 reports", desc: "Care plan status, medication adherence, risk levels, appetite trends" },
  { title: "Custom Reports", icon: Settings, count: "Coming soon", desc: "Combine any data points into a custom report with your own filters" },
];

const FEATURES = [
  "50+ pre-built reports",
  "Real-time data — always current",
  "Export to CSV and Excel",
  "Date range and carer filters",
  "CQC evidence-ready reports",
  "Financial reports with invoice data",
  "AI-powered insights alongside data",
];

export default function ReportsMarketingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-cr-ivory pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest text-cr-forest bg-cr-mint px-3 py-1.5 rounded-full mb-5">
            Reports & Analytics
          </span>
          <h1 className="font-display text-5xl md:text-6xl text-cr-charcoal leading-[1.1] mb-5">
            Every insight your care service needs.
          </h1>
          <p className="text-lg text-cr-slate font-body max-w-2xl mx-auto mb-8">
            50+ pre-built reports across visits, finance, compliance, staff, and clients. Export to CSV or Excel in one click.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/demo" className="bg-cr-forest text-white font-body font-medium px-6 py-3 rounded-lg hover:bg-cr-sage transition-colors text-sm">
              Start free trial
            </Link>
            <Link href="/contact" className="border border-cr-forest text-cr-forest font-body font-medium px-6 py-3 rounded-lg hover:bg-cr-mint transition-colors text-sm">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl text-cr-charcoal text-center mb-10">Reports across every area of your service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="bg-cr-ivory rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-cr-mint rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-cr-forest" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-body font-semibold text-cr-charcoal">{cat.title}</h3>
                    <span className="text-xs text-cr-slate font-body">{cat.count}</span>
                  </div>
                  <p className="text-xs text-cr-slate font-body leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section className="bg-cr-ivory py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-cr-charcoal mb-2">See what your reports look like</h2>
            <p className="text-sm text-cr-slate font-body">Live data, always current. Export to CSV in one click.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-body font-semibold text-cr-charcoal text-lg">Visit Completion Rate — Last 12 Weeks</h3>
                <p className="text-xs text-cr-slate mt-0.5">Completed visits vs scheduled visits per week</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-body font-semibold bg-cr-gold/10 text-cr-gold border border-cr-gold/20 rounded-full px-2 py-0.5">Sample data</span>
                <button className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-cr-slate">Export CSV</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={SAMPLE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
                <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                <Line type="monotone" dataKey="scheduled" stroke="#6B7280" name="Scheduled" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="completed" stroke="#1A3C2E" name="Completed" strokeWidth={2.5} dot={{ fill: "#1A3C2E", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead className="bg-cr-mint">
                  <tr>{["Week", "Scheduled", "Completed", "Completion %"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {SAMPLE_DATA.slice(-4).map((r) => <tr key={r.week}><td className="px-3 py-2 text-cr-charcoal">{r.week}</td><td className="px-3 py-2 text-cr-slate">{r.scheduled}</td><td className="px-3 py-2 text-cr-forest">{r.completed}</td><td className="px-3 py-2 font-medium">{Math.round((r.completed / r.scheduled) * 100)}%</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="bg-cr-forest py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl text-white mb-4">Everything included. Nothing extra to pay.</h2>
              <p className="text-cr-mint font-body text-sm mb-6">All 50+ reports are included in every Careroot plan. No add-ons. No analytics upgrades.</p>
              <div className="space-y-3">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-cr-gold flex-shrink-0" />
                    <span className="text-sm font-body text-white">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[["50+", "Pre-built reports"], ["1-click", "CSV and Excel export"], ["Real-time", "Always current data"], ["CQC-ready", "Evidence in minutes"]].map(([val, label]) => (
                <div key={label} className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <span className="font-display text-2xl text-cr-gold">{val}</span>
                  <span className="text-sm font-body text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cr-ivory py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl text-cr-charcoal mb-3">Ready to see your data?</h2>
          <p className="text-sm text-cr-slate font-body mb-6">Start your free trial and get access to all 50+ reports from day one.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/demo" className="bg-cr-forest text-white font-body font-medium px-6 py-3 rounded-lg hover:bg-cr-sage transition-colors text-sm">Start free trial</Link>
            <Link href="/contact" className="border border-cr-forest text-cr-forest font-body font-medium px-6 py-3 rounded-lg hover:bg-cr-mint transition-colors text-sm">Book a demo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
