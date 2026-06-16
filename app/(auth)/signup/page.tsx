"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  orgName: z.string().min(2, "Organisation name required"),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
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
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { first_name: data.firstName, last_name: data.lastName },
        },
      });

      if (authError || !authData.user) {
        setError(authError?.message || "Failed to create account");
        setLoading(false);
        return;
      }

      // 2. Create organisation
      const { data: org, error: orgError } = await supabase
        .from("organisations")
        .insert({
          name: data.orgName,
          type: data.orgType,
          plan: "seed",
          plan_status: "trial",
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          max_staff: 10,
        })
        .select()
        .single();

      if (orgError || !org) {
        setError("Failed to create organisation");
        setLoading(false);
        return;
      }

      // 3. Create user profile
      await supabase.from("users").insert({
        id: authData.user.id,
        organisation_id: org.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: "org_admin",
        is_active: true,
      });

      // Send welcome email (fire and forget — don't block navigation)
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: data.firstName, org_name: data.orgName }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
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
            Start your free trial
          </h1>
          <p className="text-sm font-body text-cr-slate mb-6">
            30 days free. No credit card required.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Organisation name
              </label>
              <input
                {...register("orgName")}
                type="text"
                placeholder="Sunrise Care Services Ltd"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
              />
              {errors.orgName && <p className="mt-1 text-xs text-cr-red">{errors.orgName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Care service type
              </label>
              <select
                {...register("orgType")}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition bg-white"
              >
                <option value="domiciliary">Domiciliary / Home Care</option>
                <option value="supported_living">Supported Living</option>
                <option value="residential">Residential Care Home</option>
                <option value="internal">Internal / Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                  First name
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  placeholder="Jane"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                />
                {errors.firstName && <p className="mt-1 text-xs text-cr-red">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                  Last name
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="jane@careagency.co.uk"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
              />
              {errors.email && <p className="mt-1 text-xs text-cr-red">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
              />
              {errors.password && <p className="mt-1 text-xs text-cr-red">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-cr-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account — free for 30 days"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-cr-slate">
            Already have an account?{" "}
            <Link href="/login" className="text-cr-forest font-medium hover:text-cr-sage transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
