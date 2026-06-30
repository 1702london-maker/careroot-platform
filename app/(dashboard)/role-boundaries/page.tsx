import { createClient } from "@/lib/supabase/server";
import { RoleBoundaryDashboard } from "@/components/safety/RoleBoundaryDashboard";

export default async function RoleBoundariesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user!.id).single();

  const [{ data: violations }, { data: verbalAbuse }] = await Promise.all([
    supabase.from("role_boundary_violations")
      .select(`id, requested_task, requested_by, worker_response, server_timestamp, notification_sent_at,
        client:clients(id, first_name, last_name),
        staff:users!staff_id(id, first_name, last_name)`)
      .in("client_id", supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id))
      .order("server_timestamp", { ascending: false }),
    supabase.from("verbal_abuse_reports")
      .select(`id, perpetrator, description, resolved, server_timestamp,
        client:clients(id, first_name, last_name),
        staff:users!staff_id(id, first_name, last_name)`)
      .in("client_id", supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id))
      .order("server_timestamp", { ascending: false }),
  ]);

  return <RoleBoundaryDashboard violations={(violations as unknown[]) || []} verbalAbuse={(verbalAbuse as unknown[]) || []} />;
}
