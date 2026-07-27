import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";

export default async function ClientPortalLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/client/login");

  const { data: userRecord } = await supabase.from("users").select("role, first_name").eq("id", user.id).single();
  if (userRecord?.role !== "client") redirect("/login");

  const { data: access } = await supabase
    .from("client_access")
    .select("client_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (access?.client_id) redirect(`/client/${access.client_id}`);

  return (
    <div className="min-h-screen bg-cr-mint flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-cr-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HeartPulse size={28} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-3">Welcome, {userRecord?.first_name}</h1>
        <p className="text-sm font-body text-cr-slate">Your account is active but not linked to your care record yet. Your care manager needs to grant access.</p>
      </div>
    </div>
  );
}
