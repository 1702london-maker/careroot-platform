import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { ConsentDashboard } from "@/components/compliance/ConsentDashboard";

export default async function ConsentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager", "coordinator"].includes(userRecord?.role || "")) redirect("/dashboard");

  const { data: orgClients } = await supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id);
  const clientIds = (orgClients || []).map(c => c.id);

  const [{ data: consents }, { data: clients }] = await Promise.all([
    supabase.from("consent_records")
      .select("id, client_id, consent_type, granted, granted_by, granted_at, withdrawn_at, notes, review_due, created_at, client:clients(id, first_name, last_name)")
      .in("client_id", clientIds.length ? clientIds : [""])
      .order("created_at", { ascending: false }),
    supabase.from("clients")
      .select("id, first_name, last_name")
      .eq("organisation_id", userRecord!.organisation_id)
      .eq("is_active", true)
      .order("first_name"),
  ]);

  return (
    <div>
      <CRPageHeader
        title="Consent Records"
        subtitle="Client consent tracking for care, data sharing, and communications"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Consent" }]}
      />
      <ConsentDashboard consents={(consents as unknown[]) || []} clients={(clients as unknown[]) || []} />
    </div>
  );
}
