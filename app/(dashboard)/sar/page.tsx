import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { SARDashboard } from "@/components/compliance/SARDashboard";

export default async function SARPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager"].includes(userRecord?.role || "")) redirect("/dashboard");

  const { data: orgClients } = await supabase.from("clients").select("id").eq("organisation_id", userRecord!.organisation_id);
  const clientIds = (orgClients || []).map(c => c.id);

  const [{ data: sars }, { data: clients }] = await Promise.all([
    supabase.from("sar_requests")
      .select("id, requester_name, requester_relationship, requester_email, request_date, deadline_date, status, data_provided_at, notes, client_id, created_at, client:clients(id, first_name, last_name)")
      .in("client_id", clientIds.length ? clientIds : [""])
      .order("deadline_date", { ascending: true }),
    supabase.from("clients")
      .select("id, first_name, last_name")
      .eq("organisation_id", userRecord!.organisation_id)
      .eq("is_active", true)
      .order("first_name"),
  ]);

  return (
    <div>
      <CRPageHeader
        title="Subject Access Requests"
        subtitle="GDPR SAR management — 30-day response deadline"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "SAR" }]}
      />
      <SARDashboard sars={(sars as unknown[]) || []} clients={(clients as unknown[]) || []} />
    </div>
  );
}
