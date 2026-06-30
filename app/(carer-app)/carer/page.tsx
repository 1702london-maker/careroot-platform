import { createClient } from "@/lib/supabase/server";
import { CarerHome } from "@/components/carer/CarerHome";

export default async function CarerHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const [{ data: shifts }, { data: userRecord }] = await Promise.all([
    supabase
      .from("shifts")
      .select(`id, scheduled_start, scheduled_end, actual_start, actual_end, status, client_ids, service_lines(name)`)
      .eq("staff_id", user!.id)
      .gte("scheduled_start", today.toISOString())
      .lte("scheduled_start", tomorrow.toISOString())
      .order("scheduled_start"),
    supabase.from("users").select("id, first_name, last_name, phone, role").eq("id", user!.id).single(),
  ]);

  return <CarerHome shifts={(shifts as unknown[]) || []} user={userRecord} />;
}
