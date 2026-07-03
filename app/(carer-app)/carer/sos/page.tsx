import { createClient } from "@/lib/supabase/server";
import { SOSClient } from "@/components/carer/SOSClient";

export default async function CarerSOSPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: userRecord }, { data: activeCheckin }, { data: orgUsers }] = await Promise.all([
    supabase.from("users").select("id, first_name, last_name, organisation_id, role").eq("id", user!.id).single(),
    supabase.from("lone_working_check_ins")
      .select("*")
      .eq("staff_id", user!.id)
      .eq("status", "active")
      .order("check_in_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("users")
      .select("first_name, last_name, phone, role")
      .in("role", ["manager", "coordinator", "org_admin"])
      .neq("id", user!.id)
      .limit(5),
  ]);

  return (
    <SOSClient
      user={userRecord}
      activeCheckin={activeCheckin}
      contacts={orgUsers ?? []}
    />
  );
}
