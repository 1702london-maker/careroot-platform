import { createClient } from "@/lib/supabase/server";
import { IncidentsDashboard } from "@/components/safety/IncidentsDashboard";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user!.id).single();

  const { data: incidents } = await supabase
    .from("incidents")
    .select(`id, incident_type, behaviour_description, antecedent, antecedent_trigger,
      consequence_description, physical_intervention_occurred, pi_technique, pi_duration_minutes,
      pi_debrief_scheduled, pi_debrief_date, deescalation_strategies_used,
      staff_wellbeing_checked, staff_wellbeing_check_due, notified_manager_at, server_timestamp,
      client:clients(id, first_name, last_name),
      staff:users!staff_id(id, first_name, last_name)`)
    .in("client_id", supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id))
    .order("server_timestamp", { ascending: false });

  return <IncidentsDashboard incidents={(incidents as unknown[]) || []} />;
}
