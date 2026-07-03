import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { StaffTrainingMatrix } from "@/components/staff/StaffTrainingMatrix";

export default async function StaffTrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();

  if (!["superadmin", "org_admin", "manager", "coordinator"].includes(userRecord?.role ?? "")) {
    redirect("/dashboard");
  }

  const [{ data: staff }, { data: training }] = await Promise.all([
    supabase.from("users")
      .select("id, first_name, last_name, role, job_title, is_active")
      .eq("organisation_id", userRecord!.organisation_id)
      .in("role", ["carer", "coordinator", "manager", "nurse", "support_worker"])
      .eq("is_active", true)
      .order("last_name"),
    supabase.from("staff_training")
      .select("staff_id, training_key, training_name, status, completed_date, expiry_date, is_mandatory")
      .in("staff_id",
        // subquery not supported — we'll filter in component
        (await supabase.from("users")
          .select("id")
          .eq("organisation_id", userRecord!.organisation_id)
          .in("role", ["carer", "coordinator", "manager", "nurse", "support_worker"])
        ).data?.map(u => u.id) ?? [""]
      ),
  ]);

  return (
    <div>
      <CRPageHeader
        title="Training Matrix"
        subtitle="Mandatory and role-specific training completion across all staff"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Staff", href: "/staff" },
        ]}
      />
      <StaffTrainingMatrix staff={staff ?? []} training={training ?? []} />
    </div>
  );
}
