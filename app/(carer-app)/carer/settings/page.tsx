import { createClient } from "@/lib/supabase/server";
import { CarerSettingsClient } from "@/components/carer/CarerSettingsClient";

export default async function CarerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, phone, role")
    .eq("id", user!.id)
    .single();

  return <CarerSettingsClient user={userRecord} />;
}
