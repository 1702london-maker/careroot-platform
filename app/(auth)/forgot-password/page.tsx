"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ email: z.string().email("Invalid email address") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
    });
    setSent(true);
    setLoading(false);
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
          {sent ? (
            <div className="text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">
                Reset link sent
              </h2>
              <p className="text-sm font-body text-cr-slate mb-6">
                Check your email for a password reset link. It may take a few minutes to arrive.
              </p>
              <Link href="/login" className="text-cr-forest font-body font-medium hover:text-cr-sage transition-colors text-sm">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-1">
                Reset your password
              </h1>
              <p className="text-sm font-body text-cr-slate mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
                    Email address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@careagency.co.uk"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest transition"
                  />
                  {errors.email && <p className="mt-1 text-xs text-cr-red">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cr-forest text-white rounded-lg py-2.5 font-body font-semibold text-sm hover:bg-cr-sage transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm font-body text-cr-slate">
                <Link href="/login" className="text-cr-forest hover:text-cr-sage transition-colors">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
