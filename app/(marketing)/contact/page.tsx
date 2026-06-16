"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Mail, Phone, Calendar, CheckCircle, Loader2 } from "lucide-react";

const SUBJECTS = [
  "General enquiry",
  "Book a demo",
  "Pricing question",
  "Custom App enquiry",
  "Technical support",
  "Partnership",
  "Press or media",
  "Careers",
  "Other",
];

type FormData = {
  firstName: string;
  lastName: string;
  organisation: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "Required";
  if (!data.lastName.trim()) errors.lastName = "Required";
  if (!data.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address";
  if (!data.subject) errors.subject = "Please choose a subject";
  if (!data.message.trim()) errors.message = "Required";
  else if (data.message.trim().length < 10) errors.message = "Please write at least 10 characters";
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", organisation: "",
    email: "", phone: "", subject: "", message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full border rounded-lg px-4 py-3 font-body text-sm text-cr-charcoal focus:outline-none transition-colors ${
      errors[field] ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#1A3C2E]"
    }`;

  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-14">

          {/* ── LEFT — FORM ── */}
          <div>
            <h1 className="font-display text-4xl md:text-[44px] font-semibold text-cr-charcoal leading-tight">
              Get in touch.
            </h1>
            <p className="font-body text-cr-slate mt-3 mb-8 leading-relaxed">
              Fill in the form and we will get back to you within 2 business hours.
            </p>

            {status === "success" ? (
              <div className="bg-cr-mint border border-cr-sage/30 rounded-xl p-8 text-center">
                <CheckCircle size={40} className="text-cr-forest mx-auto mb-4" />
                <h2 className="font-display text-2xl font-semibold text-cr-charcoal mb-2">Message sent.</h2>
                <p className="font-body text-cr-slate mb-1">We will be in touch within 2 business hours.</p>
                <p className="font-body text-sm text-cr-slate">
                  In the meantime you can{" "}
                  <Link href="/demo" className="text-cr-forest underline underline-offset-2">book a demo</Link>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">First name <span className="text-cr-red">*</span></label>
                    <input type="text" value={form.firstName} onChange={set("firstName")} placeholder="Sarah" className={inputClass("firstName")} />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Last name <span className="text-cr-red">*</span></label>
                    <input type="text" value={form.lastName} onChange={set("lastName")} placeholder="Johnson" className={inputClass("lastName")} />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Organisation name</label>
                  <input type="text" value={form.organisation} onChange={set("organisation")} placeholder="Sunrise Care Agency" className={inputClass("organisation")} />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Email address <span className="text-cr-red">*</span></label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="sarah@sunrisecare.co.uk" className={inputClass("email")} />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Phone number</label>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+44 7xxx xxxxxx" className={inputClass("phone")} />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">What is this about? <span className="text-cr-red">*</span></label>
                  <select value={form.subject} onChange={set("subject")} className={inputClass("subject")}>
                    <option value="">Choose a subject…</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Your message <span className="text-cr-red">*</span></label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Tell us about your care service and how we can help…"
                    className={inputClass("message")}
                  />
                  {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500">
                    Something went wrong. Please email us directly at{" "}
                    <a href="mailto:onboarding@careroot.co.uk" className="underline">onboarding@careroot.co.uk</a>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#1A3C2E] text-white font-body font-medium py-3 rounded-lg hover:bg-[#4A7C5E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  ) : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* ── RIGHT — CONTACT INFO ── */}
          <div className="space-y-4">

            {/* Email */}
            <div className="bg-cr-mint rounded-xl p-6">
              <Mail size={24} className="text-cr-forest mb-3" />
              <p className="text-xs font-body font-semibold uppercase tracking-wide text-cr-slate mb-1">Email Us</p>
              <a href="mailto:onboarding@careroot.co.uk" className="font-body font-medium text-cr-forest hover:underline">
                onboarding@careroot.co.uk
              </a>
              <p className="text-xs font-body text-cr-slate mt-1">We reply within 2 business hours</p>
            </div>

            {/* Phone */}
            <div className="bg-cr-mint rounded-xl p-6">
              <Phone size={24} className="text-cr-forest mb-3" />
              <p className="text-xs font-body font-semibold uppercase tracking-wide text-cr-slate mb-1">Call or WhatsApp</p>
              <p className="font-body font-medium text-cr-charcoal mb-3">+44 7493 099125</p>
              <div className="flex gap-2">
                <a
                  href="tel:+447493099125"
                  className="border border-[#1A3C2E] text-[#1A3C2E] font-body text-sm rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
                >
                  Call us
                </a>
                <a
                  href="https://wa.me/447493099125"
                  className="bg-[#25D366] text-white font-body text-sm rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  WhatsApp
                </a>
              </div>
              <p className="text-xs font-body text-cr-slate mt-3">Monday – Friday 8am–7pm · Saturday 9am–5pm</p>
            </div>

            {/* Demo */}
            <div className="bg-cr-mint rounded-xl p-6">
              <Calendar size={24} className="text-cr-forest mb-3" />
              <p className="text-xs font-body font-semibold uppercase tracking-wide text-cr-slate mb-1">Book a Demo</p>
              <p className="font-body font-medium text-cr-charcoal mb-1">30-minute video call</p>
              <p className="font-body text-sm text-cr-slate mb-4">See the full platform tailored to your care service type.</p>
              <Link
                href="/demo"
                className="block w-full text-center bg-[#1A3C2E] text-white font-body text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#4A7C5E] transition-colors"
              >
                Book your demo
              </Link>
            </div>

            {/* Office hours */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-body font-semibold text-sm text-cr-charcoal mb-3">Office hours</p>
              {[
                ["Monday – Friday", "8:00am – 7:00pm"],
                ["Saturday", "9:00am – 5:00pm"],
                ["Sunday", "Closed"],
              ].map(([day, hours]) => (
                <div key={day} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-body text-sm text-cr-slate">{day}</span>
                  <span className="font-body text-sm text-cr-charcoal font-medium">{hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
