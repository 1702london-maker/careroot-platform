import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShiftHub } from "@/components/carer/ShiftHub";

export default async function ShiftPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: shift } = await supabase
    .from("shifts")
    .select(`id, scheduled_start, scheduled_end, actual_start, actual_end, status, client_ids, organisation_id, service_lines(id, name, code)`)
    .eq("id", params.id)
    .eq("staff_id", user!.id)
    .single();

  if (!shift) notFound();

  // Load clients on this shift
  let clients: Record<string, unknown>[] = [];
  if (shift.client_ids?.length) {
    const { data } = await supabase
      .from("clients")
      .select("id, first_name, last_name, gps_lat, gps_lng, approved_radius_metres, dnr_status, risk_level")
      .in("id", shift.client_ids);
    clients = data || [];
  }

  // Load active credential
  const { data: credential } = await supabase
    .from("shift_credentials")
    .select("id, token, valid_from, valid_until, used_at, invalidated_at")
    .eq("shift_id", shift.id)
    .eq("staff_id", user!.id)
    .is("invalidated_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load care plans for all clients
  let carePlans: Record<string, unknown>[] = [];
  if (shift.client_ids?.length) {
    const { data } = await supabase
      .from("care_plans")
      .select("id, client_id, authorised_tasks, excluded_tasks, mood_vocabulary, trigger_vocabulary")
      .in("client_id", shift.client_ids)
      .eq("is_current", true);
    carePlans = data || [];
  }

  return (
    <ShiftHub
      shift={shift as Record<string, unknown>}
      clients={clients}
      credential={credential as Record<string, unknown> | null}
      carePlans={carePlans}
      staffId={user!.id}
    />
  );
}
