"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  orgName: z.string().min(2, "Organisation name required"),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  cqcProviderId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { orgType: "domiciliary" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();

      // Create the Supabase auth user — sends confirmation email automatically
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError("Sign up failed. Please try again.");
        return;
      }

      // Create org + users row via API (uses service role)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email: data.email,
          orgName: data.orgName,
          orgType: data.orgType,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          cqcProviderId: data.cqcProviderId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result?.error || "Account created but setup failed. Contact support.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cr-ivory flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
              <Leaf size={22} className="text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-cr-charcoal">Careroot</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <CheckCircle2 size={48} className="text-cr-forest mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-2">Check your email</h1>
            <p className="text-sm font-body text-cr-slate mb-6">
              We&apos;ve sent a confirmation link to your email address. Click it to activate your account and log in.
            </p>
            <Link href="/login" className="cr-btn-primary inline-block text-sm">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Create your account
          </h1>
          <p className="text-sm font-body text-cr-slate mb-6">
            Set up your care service. You&apos;ll get an email to confirm your address before logging in.
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

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Work email address</label>
              <input {...register("email")} type="email" required autoComplete="email" placeholder="jane@careagency.co.uk"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              {errors.email && <p className="mt-1 text-xs text-cr-red">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Password</label>
              <input {...register("password")} type="password" required autoComplete="new-password" placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              {errors.password && <p className="mt-1 text-xs text-cr-red">{errors.password.message}</p>}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
            <p className="text-xs text-center text-cr-slate">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-cr-forest hover:text-cr-sage underline">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-cr-forest hover:text-cr-sage underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-6 text-center text-sm font-body text-cr-slate">
            Already have an account?{" "}
            <Link href="/login" className="text-cr-forest font-medium hover:text-cr-sage transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
