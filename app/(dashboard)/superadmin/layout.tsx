import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("role").eq("id", user.id).single();

  if (userRecord?.role !== "superadmin") redirect("/dashboard");

  return <>{children}</>;
}
