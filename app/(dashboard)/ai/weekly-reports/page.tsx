import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { WeeklyReportsDashboard } from "@/components/intelligence/WeeklyReportsDashboard";

export default async function WeeklyReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .eq("organisation_id", userRecord!.organisation_id)
    .eq("is_active", true)
    .order("first_name");

  const clientIds = (clients || []).map(c => c.id);

  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("id, client_id, week_start, week_end, status, generated_at, content, clients(id, first_name, last_name)")
    .in("client_id", clientIds.length ? clientIds : [""])
    .order("week_start", { ascending: false })
    .limit(50);

  return (
    <div>
      <CRPageHeader
        title="Weekly Reports"
        subtitle="AI-generated weekly care reports for each client"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Intelligence" }]}
        action={<CRAIBadge />}
      />
      <WeeklyReportsDashboard
        reports={(reports as unknown[]) || []}
        clients={(clients as unknown[]) || []}
      />
    </div>
  );
}
