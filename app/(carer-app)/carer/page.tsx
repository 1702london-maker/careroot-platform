import { createClient } from "@/lib/supabase/server";
import { CarerDashboard } from "@/components/carer/CarerDashboard";

export default async function CarerHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const [{ data: todayVisits }, { data: userRecord }] = await Promise.all([
    supabase.from("visits")
      .select("*, clients(first_name, last_name, dnr_status, risk_level, address, photo_url)")
      .eq("carer_id", user!.id)
      .gte("scheduled_start", todayStart)
      .lte("scheduled_start", todayEnd)
      .order("scheduled_start"),
    supabase.from("users").select("*").eq("id", user!.id).single(),
  ]);

  return <CarerDashboard visits={todayVisits || []} user={userRecord} />;
}
