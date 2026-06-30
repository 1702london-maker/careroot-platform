import { createClient } from "@/lib/supabase/server";
import { HandoverApprovals } from "@/components/safety/HandoverApprovals";

export default async function HandoverApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user!.id).single();

  const { data: orgStaff } = await supabase.from("users").select("id").eq("organisation_id", userRecord!.organisation_id);
  const staffIds = (orgStaff || []).map(s => s.id);

  const { data: handovers } = await supabase
    .from("handover_notes")
    .select(`id, current_status, key_events, nutrition_summary, medication_summary,
      actions_for_incoming_worker, triggers_activated_this_shift,
      outgoing_approved_at, incoming_read_confirmed_at, server_timestamp,
      client:clients(id, first_name, last_name),
      outgoing_staff:users!outgoing_staff_id(id, first_name, last_name),
      incoming_staff:users!incoming_staff_id(id, first_name, last_name)`)
    .in("outgoing_staff_id", staffIds.length ? staffIds : [""])
    .order("server_timestamp", { ascending: false });

  return <HandoverApprovals handovers={(handovers as unknown[]) || []} />;
}
