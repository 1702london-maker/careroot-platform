"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartPulse, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ClientLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    const { data: auth, error: authError } = await supabase.auth.signInWithPassword(data);
    if (authError || !auth.user) {
      setError(authError?.message ?? "Invalid credentials");
      setLoading(false);
      return;
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    if (userRecord?.role !== "client") {
      await supabase.auth.signOut();
      setError("This login is for clients only. Family members should use the family portal.");
      setLoading(false);
      return;
    }

    const { data: access } = await supabase
      .from("client_access")
      .select("client_id")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .single();

    router.push(access?.client_id ? `/client/${access.client_id}` : "/client/portal");
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cr-forest rounded-xl flex items-center justify-center flex-shrink-0">
              <HeartPulse size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-cr-charcoal leading-tight">Client Portal</h1>
              <p className="text-xs font-body text-cr-slate">Your care, visits and rights in one place</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Email address</label>
              <input {...register("email")} type="email" autoComplete="email" placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              {errors.email && <p className="mt-1 text-xs text-red-600 font-body">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Password</label>
              <input {...register("password")} type="password" autoComplete="current-password" placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition" />
              {errors.password && <p className="mt-1 text-xs text-red-600 font-body">{errors.password.message}</p>}
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-body text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cr-forest text-white rounded-lg font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-2 text-center">
            <p className="text-xs font-body text-cr-slate">
              Family member?{" "}
              <Link href="/family/login" className="text-cr-forest font-medium hover:underline">Use family portal</Link>
            </p>
            <p className="text-xs font-body text-cr-slate">
              Care staff?{" "}
              <Link href="/carer-login" className="text-cr-forest font-medium hover:underline">Staff login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
