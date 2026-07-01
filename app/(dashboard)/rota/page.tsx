import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { RotaClient } from "@/components/rota/RotaClient";

export default async function RotaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  // Current week bounds
  const today = new Date();
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [
    { data: shiftsRaw },
    { data: staff },
    { data: clients },
    { data: serviceLines },
  ] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, staff_id, scheduled_start, scheduled_end, status, client_ids, service_lines(name)")
      .eq("organisation_id", orgId)
      .gte("scheduled_start", weekStart.toISOString())
      .lte("scheduled_start", weekEnd.toISOString())
      .order("scheduled_start"),
    supabase
      .from("users")
      .select("id, first_name, last_name, role")
      .eq("organisation_id", orgId)
      .in("role", ["carer", "senior_carer", "manager"])
      .eq("is_active", true)
      .order("last_name"),
    supabase
      .from("clients")
      .select("id, first_name, last_name")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("last_name"),
    supabase
      .from("service_lines")
      .select("id, name")
      .eq("organisation_id", orgId),
  ]);

  // Enrich initial shifts with client names
  const allClientIds = [...new Set((shiftsRaw ?? []).flatMap((s) => (s.client_ids as string[] | null) ?? []))];
  let clientMap: Record<string, { first_name: string; last_name: string }> = {};
  if (allClientIds.length) {
    const { data: clientRows } = await supabase
      .from("clients").select("id, first_name, last_name").in("id", allClientIds);
    for (const c of clientRows ?? []) clientMap[c.id] = { first_name: c.first_name, last_name: c.last_name };
  }
  const shifts = (shiftsRaw ?? []).map((s) => {
    const firstId = (s.client_ids as string[] | null)?.[0];
    return { ...s, client: firstId ? clientMap[firstId] ?? null : null };
  });

  return (
    <div>
      <CRPageHeader
        title="Weekly Rota"
        subtitle="Staff scheduling — click any cell to add a shift"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />
      <RotaClient
        initialShifts={shifts as Parameters<typeof RotaClient>[0]["initialShifts"]}
        staff={staff ?? []}
        clients={clients ?? []}
        serviceLines={serviceLines ?? []}
        weekStart={weekStart.toISOString()}
      />
    </div>
  );
}
