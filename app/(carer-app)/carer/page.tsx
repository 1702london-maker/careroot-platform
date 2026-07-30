import { createClient } from "@/lib/supabase/server";
import { CarerHome } from "@/components/carer/CarerHome";
import { londonDayEndIso, londonDayStartIso } from "@/lib/dates";

export default async function CarerHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const todayStart = londonDayStartIso();
  const todayEnd = londonDayEndIso();

  const { data: shifts } = await supabase
    .from("shifts")
    .select(`id, scheduled_start, scheduled_end, actual_start, actual_end, status, client_ids, service_lines(name)`)
    .eq("staff_id", user!.id)
    .gte("scheduled_start", todayStart)
    .lte("scheduled_start", todayEnd)
    .order("scheduled_start");

  return <CarerHome shifts={(shifts as unknown[]) || []} />;
}
