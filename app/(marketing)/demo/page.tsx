"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Lock, Calendar, Shield, Star, ArrowRight, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  organisation_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Required"),
  staff_count: z.string().min(1, "Select staff count"),
  care_type: z.string().min(1, "Select care type"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function InputField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-cr-red">{error}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full px-3.5 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest bg-white";

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
      else setSubmitted(true); // show success anyway
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <MarketingNav />

      {submitted ? (
        /* ── THANK YOU SCREEN ── */
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-cr-mint flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-cr-forest" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-4">
            You&rsquo;re booked in.
          </h1>
          <p className="text-base font-body text-cr-slate mb-3 leading-relaxed">
            We&rsquo;ve received your request and will confirm your demo time within 2 hours.
          </p>
          <p className="text-sm font-body text-cr-slate mb-12">
            Check your email — a confirmation is on its way.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-left mb-8">
            <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-6">While you wait</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cr-mint flex items-center justify-center flex-shrink-0">
                  <Smartphone size={18} className="text-cr-forest" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal mb-1">Install Careroot on your phone</p>
                  <p className="text-sm font-body text-cr-slate">
                    Open <span className="text-cr-forest font-medium">careroot.care</span> in your mobile browser, tap the share icon, and select &ldquo;Add to Home Screen&rdquo;. No app store needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cr-mint flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={18} className="text-cr-forest" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal mb-1">Start your free trial now</p>
                  <p className="text-sm font-body text-cr-slate">
                    You don&rsquo;t have to wait for the demo.{" "}
                    <Link href="/signup" className="text-cr-forest font-medium hover:text-cr-sage underline">
                      Start your 30-day free trial
                    </Link>{" "}
                    and explore at your own pace.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cr-mint flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-cr-forest" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal mb-1">Read our CQC preparation guide</p>
                  <p className="text-sm font-body text-cr-slate">
                    Everything you need to know about the 2026 Single Assessment Framework and how Careroot maps to it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link href="/" className="inline-block text-sm font-body text-cr-forest hover:text-cr-sage transition-colors">
            ← Back to homepage
          </Link>
        </div>
      ) : (
        /* ── DEMO BOOKING PAGE ── */
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left — context */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cr-mint text-cr-forest text-xs font-body font-semibold border border-cr-sage/20 mb-6">
                <Calendar size={12} />
                30-minute demo · Free · No commitment
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal leading-tight mb-5">
                See Careroot in 30 minutes.
              </h1>
              <p className="text-base font-body text-cr-slate mb-10 leading-relaxed">
                We&rsquo;ll walk you through the platform for your specific type of care service and answer every question you have. No sales pressure. Just the product.
              </p>

              {/* What you'll see */}
              <div className="mb-10">
                <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-widest mb-4">What you&rsquo;ll see</p>
                <ul className="space-y-3">
                  {[
                    "How to set up a client and generate an AI care plan",
                    "How the CQC compliance dashboard scores your service",
                    "How the carer app works in the field — with offline mode",
                    "How the emergency system protects your clients and staff",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-cr-sage mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-body text-cr-charcoal">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Who this is for */}
              <div className="mb-10">
                <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-widest mb-4">Who this is for</p>
                <ul className="space-y-3">
                  {[
                    "Registered managers preparing for CQC registration",
                    "Operations directors evaluating care management software",
                    "Care agency owners looking to replace paper systems",
                    "NHS community care team leads",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cr-forest flex-shrink-0" />
                      <span className="text-sm font-body text-cr-slate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What happens next */}
              <div className="mb-10">
                <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-widest mb-4">What happens next</p>
                <div className="space-y-4">
                  {[
                    { n: "1", title: "Submit the form", body: "We confirm your demo time within 2 hours." },
                    { n: "2", title: "30-minute video call", body: "We show you the exact features relevant to your service type." },
                    { n: "3", title: "Start your free trial", body: "Set up your agency the same day. 30 days free, no card required." },
                  ].map(({ n, title, body }) => (
                    <div key={n} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-cr-forest text-white text-sm font-body font-bold flex items-center justify-center flex-shrink-0">
                        {n}
                      </div>
                      <div>
                        <p className="text-sm font-body font-semibold text-cr-charcoal">{title}</p>
                        <p className="text-sm font-body text-cr-slate">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              <div className="space-y-4 mb-10">
                {[
                  {
                    quote: "We went from CQC improvement notice to Good rating in four months.",
                    name: "Registered Manager, London",
                  },
                  {
                    quote: "The paramedic QR feature alone is worth the subscription.",
                    name: "Care Manager, Birmingham",
                  },
                ].map((t) => (
                  <div key={t.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className="text-cr-gold fill-cr-gold" />
                      ))}
                    </div>
                    <p className="text-sm font-body text-cr-charcoal italic mb-2">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-xs font-body text-cr-slate">{t.name}</p>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="space-y-2">
                {[
                  { icon: Lock, text: "Your details are never shared or sold" },
                  { icon: Calendar, text: "We respond within 2 hours" },
                  { icon: Shield, text: "30-day free trial after demo — no pressure" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon size={14} className="text-cr-sage flex-shrink-0" />
                    <span className="text-xs font-body text-cr-slate">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="font-display text-2xl font-semibold text-cr-charcoal mb-1">Book your demo</h2>
                <p className="text-sm font-body text-cr-slate mb-7">We&rsquo;ll confirm within 2 hours.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First name" error={errors.first_name?.message}>
                      <input {...register("first_name")} placeholder="Jane" className={INPUT_CLS} />
                    </InputField>
                    <InputField label="Last name" error={errors.last_name?.message}>
                      <input {...register("last_name")} placeholder="Smith" className={INPUT_CLS} />
                    </InputField>
                  </div>

                  <InputField label="Organisation name" error={errors.organisation_name?.message}>
                    <input {...register("organisation_name")} placeholder="Sunrise Care Services Ltd" className={INPUT_CLS} />
                  </InputField>

                  <InputField label="Work email" error={errors.email?.message}>
                    <input {...register("email")} type="email" placeholder="jane@careagency.co.uk" className={INPUT_CLS} />
                  </InputField>

                  <InputField label="Phone number" error={errors.phone?.message}>
                    <input {...register("phone")} type="tel" placeholder="+44 7700 900000" className={INPUT_CLS} />
                  </InputField>

                  <InputField label="Number of staff" error={errors.staff_count?.message}>
                    <select {...register("staff_count")} className={INPUT_CLS}>
                      <option value="">Select...</option>
                      <option value="1-10">1–10</option>
                      <option value="11-50">11–50</option>
                      <option value="51-200">51–200</option>
                      <option value="200+">200+</option>
                    </select>
                  </InputField>

                  <InputField label="Type of care" error={errors.care_type?.message}>
                    <select {...register("care_type")} className={INPUT_CLS}>
                      <option value="">Select...</option>
                      <option value="domiciliary">Domiciliary / Home Care</option>
                      <option value="supported_living">Supported Living</option>
                      <option value="residential">Residential Care Home</option>
                      <option value="multiple">Multiple service types</option>
                    </select>
                  </InputField>

                  <InputField label="Anything specific you want to see? (optional)" error={errors.message?.message}>
                    <textarea
                      {...register("message")}
                      placeholder="e.g. We're preparing for our first CQC registration and want to see the compliance dashboard..."
                      rows={3}
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </InputField>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cr-forest text-white rounded-xl py-3.5 font-body font-semibold text-base hover:bg-cr-sage transition-colors disabled:opacity-60"
                  >
                    {loading ? "Booking..." : "Book my demo — we'll confirm within 2 hours"}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
                  <p className="text-sm font-body text-cr-slate">
                    Prefer email?{" "}
                    <a href="mailto:hello@careroot.care" className="text-cr-forest hover:text-cr-sage font-medium">
                      hello@careroot.care
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
