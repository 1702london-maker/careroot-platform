import { createClient } from "@/lib/supabase/server";
import { CarerRotaClient } from "@/components/carer/CarerRotaClient";

export default async function CarerRotaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch shifts for the next 4 weeks
  const now = new Date();
  const fourWeeks = new Date(now);
  fourWeeks.setDate(fourWeeks.getDate() + 28);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const [{ data: shifts }, { data: userRecord }] = await Promise.all([
    supabase.from("shifts")
      .select("id, scheduled_start, scheduled_end, actual_start, actual_end, status, client_ids")
      .eq("staff_id", user!.id)
      .gte("scheduled_start", weekStart.toISOString())
      .lte("scheduled_start", fourWeeks.toISOString())
      .order("scheduled_start"),
    supabase.from("users")
      .select("id, first_name, last_name, contract_hours")
      .eq("id", user!.id).single(),
  ]);

  return <CarerRotaClient shifts={shifts ?? []} user={userRecord} />;
}
