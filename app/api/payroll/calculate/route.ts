import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { organisation_id, period_start, period_end, carer_ids } = await req.json();

  const summaries = await Promise.all(
    carer_ids.map(async (carer_id: string) => {
      const [{ data: visits }, { data: carer }, { data: payRate }] = await Promise.all([
        supabase.from("visits").select("*, clients(first_name, last_name)").eq("organisation_id", organisation_id).eq("carer_id", carer_id).eq("status", "completed").gte("scheduled_start", period_start).lte("scheduled_start", period_end + "T23:59:59"),
        supabase.from("users").select("first_name, last_name").eq("id", carer_id).single(),
        supabase.from("carer_pay_rates").select("*").eq("user_id", carer_id).eq("organisation_id", organisation_id).is("effective_to", null).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      const hourlyRate = payRate?.hourly_rate ?? 11.44; // NLW fallback
      const overtimeRate = payRate?.overtime_rate ?? hourlyRate * 1.5;
      const travelRate = payRate?.travel_rate_per_mile ?? 0;
      const overtimeThreshold = 40;

      let totalHours = 0;
      const visitBreakdown: { date: string; client: string; hours: number; pay: number }[] = [];

      for (const v of visits ?? []) {
        const start = v.actual_start ? new Date(v.actual_start) : new Date(v.scheduled_start);
        const end = v.actual_end ? new Date(v.actual_end) : new Date(v.scheduled_end ?? v.scheduled_start);
        const hours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 4) / 4;
        const clientName = v.clients ? `${v.clients.first_name} ${v.clients.last_name}` : "Client";
        const pay = hours * hourlyRate;
        totalHours += hours;
        visitBreakdown.push({ date: start.toISOString().split("T")[0], client: clientName, hours, pay });
      }

      const regularHours = Math.min(totalHours, overtimeThreshold);
      const overtimeHours = Math.max(0, totalHours - overtimeThreshold);
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const travelPay = 0; // Would need GPS data
      const grossPay = regularPay + overtimePay + travelPay;

      return {
        carer_id, first_name: carer?.first_name ?? "", last_name: carer?.last_name ?? "",
        total_visits: (visits ?? []).length, total_hours: totalHours, total_miles: 0,
        regular_pay: regularPay, overtime_pay: overtimePay, travel_pay: travelPay, gross_pay: grossPay,
        visit_breakdown: visitBreakdown,
      };
    })
  );

  return Response.json({ summaries });
}
