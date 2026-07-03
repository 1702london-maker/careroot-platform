import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StaffReportClient } from "@/components/carer/StaffReportClient";

export default async function CarerReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("id, first_name, last_name, organisation_id, role")
    .eq("id", user.id).single();

  // Fetch managers and org_admins for escalation targets
  const { data: managers } = await supabase
    .from("users")
    .select("id, first_name, last_name, role")
    .eq("organisation_id", userRecord?.organisation_id)
    .in("role", ["manager", "org_admin", "coordinator"])
    .eq("is_active", true)
    .order("role");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-display text-xl font-semibold text-cr-charcoal">Report a Concern</h1>
        <p className="text-xs text-cr-slate mt-0.5">Confidential — sent securely to management</p>
      </div>
      <div className="px-4 py-4">
        <StaffReportClient
          userId={user.id}
          userName={`${userRecord?.first_name} ${userRecord?.last_name}`}
          orgId={userRecord?.organisation_id ?? ""}
          managers={managers ?? []}
        />
      </div>
    </div>
  );
}
