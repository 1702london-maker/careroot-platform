"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserCheck, Heart, HeartPulse } from "lucide-react";
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

    const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase.from("users").select("role").eq("id", user.id).single()
      : { data: null };

    if (profile?.role === "family") router.push("/family/portal");
    else if (profile?.role === "carer") router.push("/carer");
    else if (profile?.role === "client") router.push("/client/portal");
    else router.push(safeRedirect);

    router.refresh();
  };

  return (
    <div className="py-16 px-4">
      <div className="max-w-md mx-auto">

        {/* Island card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h1 className="font-display text-2xl font-semibold text-[#1C1C1E] mb-1">
            Welcome back
          </h1>
          <p className="text-sm font-body text-[#6B7280] mb-7">
            Sign in to your Careroot dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-[#1C1C1E] mb-1.5">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@careagency.co.uk"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]/30 focus:border-[#1A3C2E] transition"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 font-body">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-body font-medium text-[#1C1C1E]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-body text-[#1A3C2E] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]/30 focus:border-[#1A3C2E] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 font-body">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A3C2E] text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-[#4A7C5E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-[#6B7280]">
            New to Careroot?{" "}
            <Link href="/signup" className="text-[#1A3C2E] font-medium hover:underline">
              Create your account
            </Link>
          </p>
        </div>

        {/* Portal links */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Link
            href="/carer-login"
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-[#1A3C2E]/30 hover:shadow-md transition-all text-center"
          >
            <div className="w-9 h-9 bg-[#E8F5EE] rounded-lg flex items-center justify-center">
              <UserCheck size={18} className="text-[#1A3C2E]" />
            </div>
            <div>
              <p className="text-xs font-body font-semibold text-[#1C1C1E]">Staff</p>
              <p className="text-[10px] font-body text-[#6B7280]">Carer portal</p>
            </div>
          </Link>

          <Link
            href="/family/login"
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-[#1A3C2E]/30 hover:shadow-md transition-all text-center"
          >
            <div className="w-9 h-9 bg-[#E8F5EE] rounded-lg flex items-center justify-center">
              <Heart size={18} className="text-[#1A3C2E]" />
            </div>
            <div>
              <p className="text-xs font-body font-semibold text-[#1C1C1E]">Family</p>
              <p className="text-[10px] font-body text-[#6B7280]">Family portal</p>
            </div>
          </Link>

          <Link
            href="/client/login"
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-[#1A3C2E]/30 hover:shadow-md transition-all text-center"
          >
            <div className="w-9 h-9 bg-[#E8F5EE] rounded-lg flex items-center justify-center">
              <HeartPulse size={18} className="text-[#1A3C2E]" />
            </div>
            <div>
              <p className="text-xs font-body font-semibold text-[#1C1C1E]">Client</p>
              <p className="text-[10px] font-body text-[#6B7280]">Client portal</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
