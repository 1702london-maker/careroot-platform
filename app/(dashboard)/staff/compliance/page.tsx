import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { StaffComplianceDashboard } from "@/components/compliance/StaffComplianceDashboard";

export default async function StaffCompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(userRecord?.role || "")) redirect("/dashboard");

  const { data: orgStaff } = await supabase.from("users").select("id").eq("organisation_id", userRecord!.organisation_id).neq("role", "family");
  const staffIds = (orgStaff || []).map(s => s.id);

  const [{ data: compliance }, { data: staff }] = await Promise.all([
    supabase.from("staff_compliance")
      .select("id, staff_id, compliance_item, status, valid_until, document_url, notes, verified_by, verified_at, created_at, staff:users!staff_id(id, first_name, last_name, role)")
      .in("staff_id", staffIds.length ? staffIds : [""])
      .order("valid_until", { ascending: true }),
    supabase.from("users")
      .select("id, first_name, last_name, role")
      .eq("organisation_id", userRecord!.organisation_id)
      .neq("role", "family")
      .order("last_name"),
  ]);

  return (
    <div>
      <CRPageHeader
        title="Staff Compliance"
        subtitle="DBS checks, training, right to work, and mandatory certifications"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Staff", href: "/staff" }, { label: "Compliance" }]}
      />
      <StaffComplianceDashboard compliance={(compliance as unknown[]) || []} staff={(staff as unknown[]) || []} />
    </div>
  );
}
