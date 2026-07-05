import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CarerHandoverClient } from "@/components/carer/CarerHandoverClient";

export default async function CarerHandoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Get active/recent shifts to find accessible clients
  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, client_ids, status, scheduled_end, actual_end")
    .eq("staff_id", user.id)
    .in("status", ["active", "completed"])
    .gte("scheduled_end", thirtyMinsAgo.toISOString());

  const accessibleClientIds: string[] = [];
  shifts?.forEach(shift => {
    const ended = shift.actual_end || shift.scheduled_end;
    const endTime = new Date(ended).getTime();
    if (shift.status === "active" || endTime >= thirtyMinsAgo.getTime()) {
      (shift.client_ids ?? []).forEach((id: string) => {
        if (!accessibleClientIds.includes(id)) accessibleClientIds.push(id);
      });
    }
  });

  const { data: handovers } = await supabase
    .from("handover_notes")
    .select(`
      id, current_status, key_events, nutrition_summary, medication_summary,
      actions_for_incoming_worker, triggers_activated_this_shift,
      outgoing_approved_at, incoming_read_confirmed_at, server_timestamp,
      client:clients(id, first_name, last_name),
      outgoing_staff:users!outgoing_staff_id(first_name, last_name),
      incoming_staff:users!incoming_staff_id(first_name, last_name)
    `)
    .in("client_id", accessibleClientIds.length ? accessibleClientIds : [""])
    .order("server_timestamp", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-display text-xl font-semibold text-cr-charcoal">Handover Notes</h1>
        <p className="text-xs text-cr-slate">Shift handover information for your clients</p>
      </div>
      <div className="px-4 py-4">
        <CarerHandoverClient
          handovers={(handovers ?? []) as unknown as Parameters<typeof CarerHandoverClient>[0]["handovers"]}
          hasActiveShift={accessibleClientIds.length > 0}
        />
      </div>
    </div>
  );
}
