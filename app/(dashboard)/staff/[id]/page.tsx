import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StaffProfileClient } from "@/components/staff/StaffProfileClient";
import { CRPageHeader } from "@/components/ui/CRPageHeader";

interface Props { params: Promise<{ id: string }> }

export default async function StaffProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users")
    .select("organisation_id, role").eq("id", user!.id).single();

  if (!["org_admin", "manager", "coordinator", "superadmin"].includes(me?.role || "")) {
    return <div className="text-cr-red p-4">Access denied</div>;
  }

  const [
    { data: staffMember },
    { data: documents },
    { data: training },
    { data: supervisions },
    { data: incidents },
    { data: policies },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", id)
      .eq("organisation_id", me!.organisation_id).single(),
    supabase.from("staff_documents").select("*").eq("staff_id", id)
      .order("document_category").order("document_label"),
    supabase.from("staff_training").select("*").eq("staff_id", id)
      .order("training_category").order("training_name"),
    supabase.from("staff_supervision").select("*, supervisor:supervisor_id(first_name,last_name)")
      .eq("staff_id", id).order("scheduled_date", { ascending: false }),
    supabase.from("incidents").select("id,title,severity,status,created_at,client_id")
      .eq("reported_by", id)
      .eq("organisation_id", me!.organisation_id)
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("policy_acknowledgements").select("*").eq("staff_id", id)
      .order("created_at"),
  ]);

  if (!staffMember) notFound();

  return (
    <div>
      <CRPageHeader
        title={`${staffMember.first_name} ${staffMember.last_name}`}
        subtitle={staffMember.role?.replace(/_/g, " ")}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Staff", href: "/staff" },
        ]}
      />
      <StaffProfileClient
        staffMember={staffMember}
        documents={documents ?? []}
        training={training ?? []}
        supervisions={supervisions ?? []}
        incidents={incidents ?? []}
        policies={policies ?? []}
        viewerRole={me?.role ?? ""}
      />
    </div>
  );
}
