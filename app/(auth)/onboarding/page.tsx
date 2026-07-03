"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  orgName: z.string().min(2, "Organisation name required"),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
  cqcProviderId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { orgType: "domiciliary" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result?.error || "Setup failed. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cr-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
            <Leaf size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-cr-charcoal">Careroot</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-1">
            Set up your organisation
          </h1>
          <p className="text-sm font-body text-cr-slate mb-6">
            Your account is ready. Just tell us about your care service to get started.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Organisation name</label>
              <input {...register("orgName")} type="text" required placeholder="Sunrise Care Services Ltd"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              {errors.orgName && <p className="mt-1 text-xs text-cr-red">{errors.orgName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Care service type</label>
              <select {...register("orgType")}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition bg-white">
                <option value="domiciliary">Domiciliary / Home Care</option>
                <option value="supported_living">Supported Living</option>
                <option value="residential">Residential Care Home</option>
                <option value="internal">Internal / Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">First name</label>
                <input {...register("firstName")} type="text" required placeholder="Jane"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
                {errors.firstName && <p className="mt-1 text-xs text-cr-red">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Last name</label>
                <input {...register("lastName")} type="text" required placeholder="Smith"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
                {errors.lastName && <p className="mt-1 text-xs text-cr-red">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Phone <span className="text-cr-slate font-normal">(optional)</span></label>
                <input {...register("phone")} type="tel" placeholder="020 1234 5678"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">CQC provider ID <span className="text-cr-slate font-normal">(optional)</span></label>
                <input {...register("cqcProviderId")} type="text" placeholder="1-XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-cr-red">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60">
              {loading ? "Setting up your account..." : "Complete setup →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
