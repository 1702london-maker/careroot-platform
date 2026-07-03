import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { SupervisionNewForm } from "@/components/staff/SupervisionNewForm";

export default async function SupervisionNewPage({
  searchParams,
}: {
  searchParams: Promise<{ staff_id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organisation_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!["manager", "coordinator", "org_admin", "superadmin"].includes(userRecord?.role ?? "")) {
    redirect("/staff/supervisions");
  }

  const params = await searchParams;
  const staffId = params.staff_id;

  // Fetch staff members for selection
  const { data: staffMembers } = await supabase
    .from("users")
    .select("id, first_name, last_name, role, job_title")
    .eq("organisation_id", userRecord?.organisation_id)
    .in("role", ["carer", "coordinator", "manager", "nurse", "support_worker"])
    .eq("is_active", true)
    .order("first_name");

  // If a specific staff member was requested, fetch their details
  let staffMember = null;
  if (staffId) {
    staffMember = staffMembers?.find(s => s.id === staffId) ?? null;
  }

  return (
    <div>
      <CRPageHeader
        title="Log Supervision"
        subtitle="Record a supervision session for a staff member"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Staff", href: "/staff" },
          { label: "Supervisions", href: "/staff/supervisions" },
        ]}
      />
      <SupervisionNewForm
        staffMembers={staffMembers ?? []}
        defaultStaffId={staffId ?? ""}
        defaultStaffMember={staffMember}
        supervisorId={user.id}
        supervisorName={`${userRecord?.first_name} ${userRecord?.last_name}`}
        orgId={userRecord?.organisation_id ?? ""}
      />
    </div>
  );
}
