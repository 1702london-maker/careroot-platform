import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: run } = await supabase.from("payroll_runs").select("*, organisations(name)").eq("id", params.id).eq("organisation_id", orgId).single();
  if (!run) return new Response("Not found", { status: 404 });

  const { data: summaries } = await supabase.from("payroll_carer_summary").select("*, users!payroll_carer_summary_carer_id_fkey(first_name, last_name)").eq("payroll_run_id", params.id);

  const orgName = ((run as { organisations?: { name?: string } }).organisations?.name ?? "careroot").toLowerCase().replace(/\s+/g, "-");
  const filename = `${orgName}-payroll-${run.period_start}-${run.period_end}.csv`;

  const headers = ["Carer Name", "Period Start", "Period End", "Total Visits", "Total Hours", "Regular Hours", "Overtime Hours", "Total Miles", "Regular Pay (£)", "Overtime Pay (£)", "Travel Pay (£)", "Gross Pay (£)"];

  const rows = (summaries ?? []).map((s) => {
    const carer = (s.users as { first_name: string; last_name: string } | null);
    const regularHours = Math.min(Number(s.total_hours), 40);
    const overtimeHours = Math.max(0, Number(s.total_hours) - 40);
    return [
      carer ? `${carer.first_name} ${carer.last_name}` : "",
      run.period_start, run.period_end,
      s.total_visits, s.total_hours, regularHours.toFixed(2), overtimeHours.toFixed(2),
      Number(s.total_miles).toFixed(2),
      Number(s.regular_pay).toFixed(2), Number(s.overtime_pay).toFixed(2),
      Number(s.travel_pay).toFixed(2), Number(s.gross_pay).toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
