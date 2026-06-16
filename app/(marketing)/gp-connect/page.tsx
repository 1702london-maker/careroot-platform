"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, RefreshCw, Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const FEATURES = [
  {
    icon: FileText,
    title: "Pull GP records instantly",
    body: "Access your client's full GP record — current medications, allergies, medical history, and recent consultations — directly in their Careroot profile.",
  },
  {
    icon: RefreshCw,
    title: "Always up to date",
    body: "When a GP updates a prescription or adds a new diagnosis, it appears in Careroot automatically. No phone calls. No delays.",
  },
  {
    icon: Shield,
    title: "NHS-approved connection",
    body: "GP Connect is the official NHS API. Careroot is applying for NHS Assured Supplier status to enable this integration.",
  },
  {
    icon: AlertTriangle,
    title: "Safer medication management",
    body: "When medication changes happen at GP level, your carers are notified immediately. No more acting on outdated medication lists.",
    red: true,
  },
];

const TIMELINE = [
  { label: "NHS Assured Supplier Application", detail: "Application submitted to NHS England", status: "done" },
  { label: "Technical Integration Review", detail: "NHS review of our security and data handling standards", status: "progress" },
  { label: "GP Connect Live", detail: "Estimated Q4 2026", status: "upcoming" },
];

export default function GPConnectMarketingPage() {
  const [form, setForm] = useState({ name: "", email: "", organisation: "", clients: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.organisation) { setError("Please fill in all required fields."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/gp-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSubmitted(true); }
      else { setError("Something went wrong. Please email us at onboarding@careroot.co.uk"); }
    } catch {
      setError("Something went wrong. Please email us at onboarding@careroot.co.uk");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest";

  return (
    <>
      <MarketingNav />
      <main>
      {/* Hero */}
      <section className="bg-cr-ivory pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-body font-semibold bg-cr-mint text-cr-forest rounded-full px-3 py-1 mb-6">Coming Soon</span>
          <h1 className="font-display text-5xl md:text-6xl text-cr-charcoal leading-[1.1] mb-5">
            GP Connect.<br />Coming to Careroot.
          </h1>
          <p className="text-lg text-cr-slate font-body max-w-2xl mx-auto">
            Direct access to your clients' GP records — medications, allergies, conditions, and recent consultations — without hours of back-and-forth phone calls.
          </p>
        </div>
      </section>

      {/* What GP Connect will do */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl text-cr-charcoal text-center mb-10">What GP Connect will do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-cr-ivory rounded-xl border border-gray-100 p-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.red ? "bg-red-50" : "bg-cr-mint"}`}>
                    <Icon size={20} className={f.red ? "text-cr-red" : "text-cr-forest"} />
                  </div>
                  <h3 className="font-body font-semibold text-cr-charcoal mb-2">{f.title}</h3>
                  <p className="text-sm text-cr-slate font-body leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-cr-ivory py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-cr-charcoal text-center mb-10">When is it coming?</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-8">
              {TIMELINE.map((step, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${step.status === "done" ? "bg-cr-forest" : step.status === "progress" ? "bg-cr-gold" : "bg-gray-200"}`}>
                    {step.status === "done" ? <CheckCircle size={20} className="text-white" /> : <span className="text-xs font-body font-bold text-white">{i + 1}</span>}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-body font-semibold text-cr-charcoal">{step.label}</h3>
                    <p className="text-sm text-cr-slate font-body mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interest Form */}
      <section className="bg-cr-forest py-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-white mb-2">Be first to know</h2>
            <p className="text-sm text-cr-mint font-body">Register your interest and we will notify you the moment GP Connect goes live.</p>
          </div>
          {submitted ? (
            <div className="bg-white/10 rounded-xl p-8 text-center">
              <CheckCircle size={40} className="mx-auto text-cr-gold mb-3" />
              <h3 className="font-body font-semibold text-white text-lg mb-1">You're on the list!</h3>
              <p className="text-cr-mint text-sm font-body">We'll notify you as soon as GP Connect is available for your organisation.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white/10 rounded-xl p-6 space-y-4">
              {error && <div className="bg-red-500/20 border border-red-400/30 text-white text-sm font-body p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-body font-medium text-cr-mint mb-1">Full name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-mint mb-1">Email address *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@carecompany.co.uk" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-mint mb-1">Organisation *</label>
                <input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} placeholder="Your care company name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-mint mb-1">Number of clients</label>
                <select value={form.clients} onChange={(e) => setForm({ ...form, clients: e.target.value })} className={inputCls}>
                  <option value="">Select range</option>
                  <option value="1-25">1–25 clients</option>
                  <option value="26-75">26–75 clients</option>
                  <option value="76-150">76–150 clients</option>
                  <option value="150+">150+ clients</option>
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-cr-gold text-cr-charcoal font-body font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : "Notify me when live"}
              </button>
            </form>
          )}
        </div>
      </section>
      </main>
      <MarketingFooter />
    </>
  );
}
