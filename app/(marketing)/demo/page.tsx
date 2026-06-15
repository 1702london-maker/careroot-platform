"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  organisation_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Required"),
  staff_count: z.string().min(1, "Select staff count"),
  care_type: z.string().min(1, "Select care type"),
});

type FormData = z.infer<typeof schema>;

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // Still show success — save fails silently
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-16">
        {submitted ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <CheckCircle size={48} className="text-cr-sage mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-cr-charcoal mb-3">
              We&rsquo;ll be in touch soon.
            </h2>
            <p className="text-sm font-body text-cr-slate mb-6">
              You&rsquo;ve booked a Careroot demo. We&rsquo;ll email you within one business day to confirm a time.
            </p>
            <Link href="/" className="cr-btn-primary text-sm px-6 py-2">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            <h1 className="font-display text-3xl font-semibold text-cr-charcoal mb-2">
              Book a demo
            </h1>
            <p className="text-sm font-body text-cr-slate mb-6">
              We&rsquo;ll show you exactly how Careroot works for your care service. Takes 30 minutes.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "first_name", label: "First name", placeholder: "Jane" },
                  { name: "last_name", label: "Last name", placeholder: "Smith" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">{f.label}</label>
                    <input
                      {...register(f.name as keyof FormData)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
                    />
                    {errors[f.name as keyof FormData] && (
                      <p className="mt-1 text-xs text-cr-red">{errors[f.name as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))}
              </div>

              {[
                { name: "organisation_name", label: "Organisation name", placeholder: "Sunrise Care Services Ltd", type: "text" },
                { name: "email", label: "Work email", placeholder: "jane@careagency.co.uk", type: "email" },
                { name: "phone", label: "Phone number", placeholder: "+44 7700 900000", type: "tel" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">{f.label}</label>
                  <input
                    {...register(f.name as keyof FormData)}
                    type={f.type}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
                  />
                  {errors[f.name as keyof FormData] && (
                    <p className="mt-1 text-xs text-cr-red">{errors[f.name as keyof FormData]?.message}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Number of staff</label>
                <select
                  {...register("staff_count")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest bg-white"
                >
                  <option value="">Select...</option>
                  <option value="1-10">1–10</option>
                  <option value="11-50">11–50</option>
                  <option value="51-200">51–200</option>
                  <option value="200+">200+</option>
                </select>
                {errors.staff_count && <p className="mt-1 text-xs text-cr-red">{errors.staff_count.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Type of care</label>
                <select
                  {...register("care_type")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest bg-white"
                >
                  <option value="">Select...</option>
                  <option value="domiciliary">Domiciliary / Home Care</option>
                  <option value="supported_living">Supported Living</option>
                  <option value="residential">Residential Care Home</option>
                  <option value="multiple">Multiple service types</option>
                </select>
                {errors.care_type && <p className="mt-1 text-xs text-cr-red">{errors.care_type.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cr-forest text-white rounded-lg py-3 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60"
              >
                {loading ? "Booking..." : "Book my demo"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
