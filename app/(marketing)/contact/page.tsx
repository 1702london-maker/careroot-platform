"use client";

import { useState } from "react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Mail, Phone, Calendar, Loader2, CheckCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";

type FormData = { firstName: string; lastName: string; organisation: string; email: string; phone: string; subject: string; message: string; };
type Errors = Partial<Record<keyof FormData, string>>;

function validate(d: FormData): Errors {
  const e: Errors = {};
  if (!d.firstName.trim()) e.firstName = "Required";
  if (!d.lastName.trim()) e.lastName = "Required";
  if (!d.email.trim()) e.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Enter a valid email";
  if (!d.subject) e.subject = "Please choose a subject";
  if (!d.message.trim() || d.message.trim().length < 10) e.message = "Please write at least 10 characters";
  return e;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", organisation: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); }
  };

  const inputCls = (err?: string) => `w-full border ${err ? "border-[#DC2626]" : "border-gray-200"} rounded-[8px] px-4 py-3 text-sm text-[#1C1C1E] focus:border-[#1A3C2E] focus:outline-none transition-colors placeholder:text-[#9CA3AF]`;

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Form — 3 cols */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-3">Contact us</p>
            <h1 className="font-display font-bold text-[44px] leading-[52px] text-[#1C1C1E] mb-3">Get in touch.</h1>
            <p className="text-[#6B7280] mb-8">Fill in the form and we will get back to you within 2 business hours.</p>

            {status === "success" ? (
              <div className="bg-white border border-gray-100 rounded-[16px] p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-[#1A3C2E]" />
                </div>
                <h3 className="font-display font-bold text-2xl text-[#1C1C1E] mb-2">Message sent.</h3>
                <p className="text-[#6B7280] text-sm">We will be in touch within 2 business hours. You can also reach us at onboarding@careroot.co.uk</p>
              </div>
            ) : (
              <form onSubmit={submit} className="bg-white border border-gray-100 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">First name <span className="text-[#DC2626]">*</span></label>
                    <input className={inputCls(errors.firstName)} placeholder="Sarah" value={form.firstName} onChange={set("firstName")} />
                    {errors.firstName && <p className="text-xs text-[#DC2626] mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Last name <span className="text-[#DC2626]">*</span></label>
                    <input className={inputCls(errors.lastName)} placeholder="Johnson" value={form.lastName} onChange={set("lastName")} />
                    {errors.lastName && <p className="text-xs text-[#DC2626] mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Organisation</label>
                  <input className={inputCls()} placeholder="Sunrise Care Agency" value={form.organisation} onChange={set("organisation")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Email <span className="text-[#DC2626]">*</span></label>
                  <input type="email" className={inputCls(errors.email)} placeholder="sarah@sunrisecare.co.uk" value={form.email} onChange={set("email")} />
                  {errors.email && <p className="text-xs text-[#DC2626] mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Phone number</label>
                  <input type="tel" className={inputCls()} placeholder="+44 7xxx xxxxxx" value={form.phone} onChange={set("phone")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Subject <span className="text-[#DC2626]">*</span></label>
                  <select className={inputCls(errors.subject)} value={form.subject} onChange={set("subject")}>
                    <option value="">Select...</option>
                    {["General enquiry", "Book a demo", "Pricing question", "Custom App enquiry", "Technical support", "Partnership", "Press or media", "Careers", "Other"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="text-xs text-[#DC2626] mt-1">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Message <span className="text-[#DC2626]">*</span></label>
                  <textarea rows={5} className={inputCls(errors.message)} placeholder="Tell us about your care service and how we can help..." value={form.message} onChange={set("message")} />
                  {errors.message && <p className="text-xs text-[#DC2626] mt-1">{errors.message}</p>}
                </div>
                {status === "error" && (
                  <div className="bg-red-50 border border-red-100 rounded-[8px] p-3 text-xs text-[#DC2626]">
                    Something went wrong. Please email us directly at onboarding@careroot.co.uk
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#1A3C2E] text-white font-semibold py-3.5 rounded-[8px] hover:bg-[#4A7C5E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Send message"}
                </button>
                <p className="text-xs text-[#9CA3AF] text-center">
                  By submitting, you agree to be contacted about your enquiry. We will never share your details. See our{" "}
                  <a href="/privacy" className="underline hover:text-[#1A3C2E] transition-colors">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>

          {/* Info — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: Mail, label: "EMAIL US", value: "onboarding@careroot.co.uk", href: "mailto:onboarding@careroot.co.uk", note: "We reply within 2 business hours" },
              { icon: Phone, label: "CALL OR WHATSAPP", value: "+44 7493 099125", href: "tel:+447493099125", note: "Mon–Fri 8am–7pm · Sat 9am–5pm", whatsapp: true },
              { icon: Calendar, label: "BOOK A DEMO", value: "30-minute video call", href: "/demo", note: "See the full platform tailored to your care service type" },
            ].map(({ icon: Icon, label, value, href, note, whatsapp }) => (
              <div key={label} className="bg-[#E8F5EE] rounded-[16px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className="text-[#1A3C2E]" />
                  <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#6B7280]">{label}</p>
                </div>
                <a href={href} className="block font-semibold text-[#1A3C2E] text-base hover:text-[#4A7C5E] transition-colors mb-1">{value}</a>
                <p className="text-xs text-[#6B7280] mb-3">{note}</p>
                {whatsapp && (
                  <a href="https://wa.me/447493099125" target="_blank" rel="noopener noreferrer"
                    className="inline-block bg-[#25D366] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#22c55e] transition-colors">
                    WhatsApp us
                  </a>
                )}
                {label === "BOOK A DEMO" && (
                  <a href="/demo" className="inline-block bg-[#1A3C2E] text-white text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#4A7C5E] transition-colors">
                    Book your demo
                  </a>
                )}
              </div>
            ))}

            <div className="bg-white border border-gray-100 rounded-[16px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#6B7280] mb-3">Office hours</p>
              {[["Monday – Friday", "8:00am – 7:00pm"], ["Saturday", "9:00am – 5:00pm"], ["Sunday", "Closed"]].map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-[#6B7280]">{day}</p>
                  <p className="text-sm font-medium text-[#1C1C1E]">{hours}</p>
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
