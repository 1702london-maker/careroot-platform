"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const redirectTo = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("redirectTo") ?? "/dashboard"
    : "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cr-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center">
            <Leaf size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-cr-charcoal">Careroot</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-1">
            Welcome back
          </h1>
          <p className="text-sm font-body text-cr-slate mb-6">
            Sign in to your care management dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                required
                autoComplete="email"
                placeholder="you@careagency.co.uk"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-cr-red font-body">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cr-slate hover:text-cr-charcoal"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-cr-red font-body">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-body text-cr-forest hover:text-cr-sage transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-cr-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-cr-slate">
            New to Careroot?{" "}
            <Link href="/signup" className="text-cr-forest font-medium hover:text-cr-sage transition-colors">
              Create your account
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs font-body text-cr-slate">
          Family member?{" "}
          <Link href="/family/login" className="text-cr-forest hover:text-cr-sage transition-colors">
            Access family portal
          </Link>
        </p>
      </div>
    </div>
  );
}
