import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { SupervisionsDashboard } from "@/components/compliance/SupervisionsDashboard";

export default async function SupervisionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(userRecord?.role || "")) redirect("/dashboard");

  const { data: orgStaff } = await supabase.from("users").select("id").eq("organisation_id", userRecord!.organisation_id).neq("role", "family");
  const staffIds = (orgStaff || []).map(s => s.id);

  const [{ data: supervisions }, { data: staff }] = await Promise.all([
    supabase.from("supervision_records")
      .select("id, staff_id, supervision_date, supervision_type, next_supervision_due, topics_discussed, action_points, supervisor_id, staff_signature_obtained, created_at, staff:users!staff_id(id, first_name, last_name, role), supervisor:users!supervisor_id(id, first_name, last_name)")
      .in("staff_id", staffIds.length ? staffIds : [""])
      .order("supervision_date", { ascending: false }),
    supabase.from("users")
      .select("id, first_name, last_name, role")
      .eq("organisation_id", userRecord!.organisation_id)
      .neq("role", "family")
      .order("last_name"),
  ]);

  return (
    <div>
      <CRPageHeader
        title="Supervisions"
        subtitle="Staff supervision records and upcoming due dates"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Staff", href: "/staff" }, { label: "Supervisions" }]}
      />
      <SupervisionsDashboard supervisions={(supervisions as unknown[]) || []} staff={(staff as unknown[]) || []} />
    </div>
  );
}
