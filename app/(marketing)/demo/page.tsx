"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CheckCircle, Loader2 } from "lucide-react";

export default function DemoPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [form, setForm] = useState({ firstName: "", lastName: "", org: "", email: "", phone: "", staff: "", type: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
  };

  const inputCls = "w-full border border-gray-200 rounded-[8px] px-4 py-3 text-sm text-[#1C1C1E] focus:border-[#1A3C2E] focus:outline-none transition-colors placeholder:text-[#9CA3AF]";

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <MarketingNav />

      <section className="py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

          {/* Left — info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1A3C2E] mb-4">Book a demo</p>
            <h1 className="font-display font-bold text-[44px] leading-[52px] text-[#1C1C1E] mb-4">
              See Careroot in 30 minutes.
            </h1>
            <p className="text-[#6B7280] leading-relaxed mb-10">
              We will show you the full platform tailored to your service type. No sales pressure. Just a clear picture of whether Careroot is right for you.
            </p>

            <div className="space-y-5 mb-10">
              {[
                { title: "Personalised walkthrough", body: "We configure the demo around your care type — domiciliary, supported living, or residential." },
                { title: "See your biggest pain point solved", body: "Tell us what's breaking in your current system. We will show you exactly how Careroot fixes it." },
                { title: "No obligation", body: "If Careroot isn't right for you, we will tell you. We would rather you find the right tool than use the wrong one." },
              ].map(({ title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F5EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={13} className="text-[#1A3C2E]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1C1C1E] text-sm mb-0.5">{title}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-[16px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#6B7280] mb-3">What you will see</p>
              {["AI care plan drafting live", "CQC compliance dashboard with your evidence gaps", "Carer mobile app — offline visit demo", "Paramedic QR emergency access", "Family portal", "Invoicing and payroll overview"].map((item) => (
                <div key={item} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A3C2E] flex-shrink-0" />
                  <p className="text-sm text-[#6B7280]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
            {status === "success" ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-[#1A3C2E]" />
                </div>
                <h3 className="font-display font-bold text-2xl text-[#1C1C1E] mb-2">Request received.</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  We will be in touch within 2 business hours to confirm your demo time. Check your inbox — including spam just in case.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display font-bold text-2xl text-[#1C1C1E] mb-6">Book your demo</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">First name</label>
                    <input required className={inputCls} placeholder="Sarah" value={form.firstName} onChange={set("firstName")} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Last name</label>
                    <input required className={inputCls} placeholder="Johnson" value={form.lastName} onChange={set("lastName")} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Organisation name</label>
                  <input className={inputCls} placeholder="Sunrise Care Agency" value={form.org} onChange={set("org")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Work email <span className="text-[#DC2626]">*</span></label>
                  <input required type="email" className={inputCls} placeholder="sarah@sunrisecare.co.uk" value={form.email} onChange={set("email")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Phone number</label>
                  <input type="tel" className={inputCls} placeholder="+44 7xxx xxxxxx" value={form.phone} onChange={set("phone")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Number of staff</label>
                    <select className={inputCls} value={form.staff} onChange={set("staff")}>
                      <option value="">Select...</option>
                      <option>1–10</option>
                      <option>11–50</option>
                      <option>51–200</option>
                      <option>200+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">Type of care</label>
                    <select className={inputCls} value={form.type} onChange={set("type")}>
                      <option value="">Select...</option>
                      <option>Domiciliary / Home Care</option>
                      <option>Supported Living</option>
                      <option>Residential Care Home</option>
                      <option>Multiple service types</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#1A3C2E] text-white font-semibold py-3.5 rounded-[8px] hover:bg-[#4A7C5E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Book my demo"}
                </button>
                <p className="text-xs text-[#9CA3AF] text-center">
                  We will reply within 2 business hours · onboarding@careroot.co.uk
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
