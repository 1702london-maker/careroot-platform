import { createClient } from "@/lib/supabase/server";
import { WellbeingDashboard } from "@/components/safety/WellbeingDashboard";

export default async function WellbeingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user!.id).single();

  const { data: orgStaff } = await supabase.from("users").select("id").eq("organisation_id", userRecord!.organisation_id);
  const staffIds = (orgStaff || []).map(s => s.id);

  const [{ data: checks }, { data: staff }] = await Promise.all([
    supabase.from("staff_wellbeing_checks")
      .select(`id, check_type, wellbeing_status, notes, flagged_for_manager, server_timestamp, manager_acknowledged_at,
        staff:users!staff_id(id, first_name, last_name)`)
      .in("staff_id", staffIds.length ? staffIds : [""])
      .order("server_timestamp", { ascending: false })
      .limit(100),
    supabase.from("users")
      .select("id, first_name, last_name, role")
      .eq("organisation_id", userRecord!.organisation_id)
      .eq("role", "carer"),
  ]);

  return <WellbeingDashboard checks={(checks as unknown[]) || []} staff={staff || []} />;
}
