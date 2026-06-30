import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { ApplicationsReview } from "@/components/settings/ApplicationsReview";

export default async function SuperadminApplications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (caller?.role !== "superadmin") redirect("/dashboard");

  const { data: applications } = await supabase
    .from("signup_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <CRPageHeader
        title="Access Applications"
        subtitle="Review and approve new provider sign-ups"
        breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }]}
      />
      <ApplicationsReview applications={applications ?? []} />
    </div>
  );
}
