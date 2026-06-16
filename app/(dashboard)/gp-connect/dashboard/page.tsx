"use client";

import { useState } from "react";
import { Stethoscope, CheckCircle, Loader2 } from "lucide-react";

const MOCK_PREVIEW = {
  patient: "Margaret Johnson",
  gp: "Dr Sarah Williams at Elm Grove Surgery",
  medications: ["Amlodipine 5mg — once daily", "Metformin 500mg — twice daily", "Atorvastatin 20mg — at night"],
  allergies: ["Penicillin (severe)", "Aspirin (mild)"],
  lastConsultation: "12/03/2026",
  recentChange: "Metformin dose increased from 500mg to 1000mg twice daily on 10/03/2026",
};

export default function DashboardGPConnectPage() {
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/gp-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "dashboard" }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest";

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-body font-semibold text-2xl text-cr-charcoal">GP Connect</h1>
          <span className="text-xs font-body font-semibold bg-cr-gold/10 text-cr-gold border border-cr-gold/20 rounded-full px-2.5 py-0.5">Coming Soon</span>
        </div>
        <p className="text-sm text-cr-slate font-body">Direct integration with GP records is coming to Careroot in Q4 2026.</p>
      </div>

      <div className="bg-cr-mint rounded-xl border border-cr-forest/10 p-8 flex items-start gap-6 mb-6">
        <div className="w-14 h-14 bg-cr-forest rounded-xl flex items-center justify-center flex-shrink-0">
          <Stethoscope size={28} className="text-white" />
        </div>
        <div>
          <h2 className="font-body font-semibold text-xl text-cr-charcoal mb-2">GP Connect — Coming Q4 2026</h2>
          <p className="text-sm text-cr-slate font-body leading-relaxed max-w-xl">
            Direct integration with your clients' GP records is coming to Careroot. You will be able to pull current medications, allergies, medical history, and recent consultations directly into each client's profile — without phone calls or delays.
          </p>
          <div className="mt-4 flex gap-3 flex-wrap text-sm font-body">
            {["Live medication lists", "Allergy alerts", "Recent consultations", "Automatic updates"].map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-cr-forest"><CheckCircle size={14} />{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-body font-semibold text-cr-charcoal mb-1">Register your interest</h3>
          <p className="text-xs text-cr-slate font-body mb-4">We'll notify you as soon as GP Connect is available for your account.</p>
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="mx-auto text-cr-forest mb-2" />
              <p className="text-sm font-body font-medium text-cr-charcoal">You're on the list!</p>
              <p className="text-xs text-cr-slate mt-1">We'll be in touch when GP Connect goes live.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Your name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@carecompany.co.uk" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Anything you'd like us to know?</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="e.g. number of clients, specific use case…" className={inputCls + " resize-none"} />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-cr-forest text-white font-body font-medium py-2.5 rounded-lg hover:bg-cr-sage transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Register interest"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
          <h3 className="font-body font-semibold text-cr-charcoal mb-4">What it will look like</h3>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="rotate-[-25deg] text-cr-forest/10 font-display text-4xl font-bold whitespace-nowrap select-none">
              PREVIEW — NOT LIVE DATA
            </div>
          </div>
          <div className="space-y-3 relative">
            <div className="bg-cr-mint rounded-lg p-3">
              <p className="text-xs font-body font-semibold text-cr-forest uppercase tracking-wide mb-1">Patient</p>
              <p className="text-sm font-body text-cr-charcoal font-medium">{MOCK_PREVIEW.patient}</p>
              <p className="text-xs text-cr-slate">{MOCK_PREVIEW.gp}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Current Medications</p>
              <ul className="space-y-1">
                {MOCK_PREVIEW.medications.map((m) => <li key={m} className="text-xs font-body text-cr-charcoal flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cr-forest inline-block" />{m}</li>)}
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-body font-semibold text-red-600 uppercase tracking-wide mb-1">Allergies</p>
              {MOCK_PREVIEW.allergies.map((a) => <p key={a} className="text-xs font-body text-red-700">{a}</p>)}
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-body font-semibold text-amber-700 uppercase tracking-wide mb-1">Recent Change</p>
              <p className="text-xs font-body text-amber-800">{MOCK_PREVIEW.recentChange}</p>
            </div>
            <p className="text-[10px] text-cr-slate font-body text-center pt-1">Last consultation: {MOCK_PREVIEW.lastConsultation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
