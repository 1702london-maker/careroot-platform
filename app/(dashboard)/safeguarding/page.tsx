import { createClient } from "@/lib/supabase/server";
import { SafeguardingDashboard } from "@/components/safety/SafeguardingDashboard";

export default async function SafeguardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user!.id).single();

  const { data: concerns } = await supabase
    .from("safeguarding_concerns")
    .select(`id, concern_description, bypass_line_manager, status, server_timestamp, escalated_to_local_authority, escalated_at,
      notified_safeguarding_lead_at, notified_manager_at,
      client:clients(id, first_name, last_name),
      staff:users!staff_id(id, first_name, last_name)`)
    .in("client_id", supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id))
    .order("server_timestamp", { ascending: false });

  return <SafeguardingDashboard concerns={(concerns as unknown[]) || []} />;
}
