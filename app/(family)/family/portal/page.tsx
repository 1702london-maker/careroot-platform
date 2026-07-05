import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

export default async function FamilyPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/family/login");

  const { data: userRecord } = await supabase
    .from("users").select("role, first_name").eq("id", user.id).single();

  if (userRecord?.role !== "family") redirect("/login");

  // Try to find a linked client
  const { data: access } = await supabase
    .from("family_access")
    .select("client_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (access?.client_id) redirect(`/family/${access.client_id}`);

  return (
    <div className="min-h-screen bg-cr-mint flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-cr-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart size={28} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-cr-charcoal mb-3">
          Welcome, {userRecord?.first_name}
        </h1>
        <p className="text-sm font-body text-cr-slate mb-6">
          Your account is set up but is not yet linked to a care recipient. Your care provider will send you an access link once this is arranged.
        </p>
        <div className="bg-white rounded-xl p-5 border border-gray-200 text-left">
          <p className="text-xs font-body font-semibold text-cr-charcoal mb-1">What happens next?</p>
          <ul className="text-xs font-body text-cr-slate space-y-1 list-disc list-inside">
            <li>Your care manager will link your account to your loved one</li>
            <li>You will receive an email when access is granted</li>
            <li>You can then log in to view care updates, visit notes, and more</li>
          </ul>
        </div>
        <a
          href="/family/login"
          className="mt-6 inline-block text-sm font-body text-cr-forest hover:text-cr-sage underline"
        >
          Sign out and return to login
        </a>
      </div>
    </div>
  );
}
