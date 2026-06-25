"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Heart } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function FamilyLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    const { data: auth, error: err } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (err || !auth.user) {
      setError(err?.message || "Invalid credentials");
      setLoading(false);
      return;
    }

    const { data: userRecord } = await supabase.from("users")
      .select("role").eq("id", auth.user.id).single();

    if (userRecord?.role !== "family") {
      setError("This login is for family members only. Staff should use the main login.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Get family access record to find client
    const { data: familyAccess } = await supabase.from("family_access")
      .select("client_id").eq("user_id", auth.user.id).eq("is_active", true).single();

    if (familyAccess?.client_id) {
      router.push(`/family/${familyAccess.client_id}`);
    } else {
      router.push("/family/portal");
    }
  };

  return (
    <div className="min-h-screen bg-cr-mint flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-cr-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-cr-charcoal">Family Portal</h1>
          <p className="text-sm font-body text-cr-slate mt-1">Stay connected with your loved one&apos;s care</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Email address</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              />
              {errors.email && <p className="mt-1 text-xs text-cr-red">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Password</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              />
              {errors.password && <p className="mt-1 text-xs text-cr-red">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-cr-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cr-forest text-white rounded-xl font-body font-semibold"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-cr-slate">
              Staff login → <a href="/login" className="text-cr-forest hover:underline">careroot.co.uk/login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
