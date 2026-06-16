import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { client_id, period_start, period_end, funder_type, organisation_id } = await req.json();

  if (!client_id || !period_start || !period_end) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get completed visits for this client in period
  const { data: visits } = await supabase
    .from("visits")
    .select("*, users!visits_carer_id_fkey(first_name, last_name), clients(first_name, last_name)")
    .eq("organisation_id", organisation_id)
    .eq("client_id", client_id)
    .eq("status", "completed")
    .gte("scheduled_start", period_start)
    .lte("scheduled_start", period_end + "T23:59:59");

  // Get client billing / rate card
  const { data: billing } = await supabase
    .from("client_billing")
    .select("*, rate_cards(*)")
    .eq("client_id", client_id)
    .single();

  const hourlyRate = billing?.rate_cards?.hourly_rate ?? billing?.private_rate_override ?? 18.0;
  const paymentTerms = billing?.payment_terms_days ?? 30;

  const lineItems = (visits ?? []).map((v) => {
    const start = v.actual_start ? new Date(v.actual_start) : new Date(v.scheduled_start);
    const end = v.actual_end ? new Date(v.actual_end) : new Date(v.scheduled_end);
    const hours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 4) / 4; // round to 15 min
    const clientName = v.clients ? `${v.clients.first_name} ${v.clients.last_name}` : "client";
    const carerName = v.users ? `${v.users.first_name} ${v.users.last_name}` : "";
    return {
      visit_id: v.id,
      description: `Home care visit — ${clientName}${carerName ? ` (${carerName})` : ""}`,
      date: start.toISOString().split("T")[0],
      quantity: hours,
      unit: "hours",
      unit_price: hourlyRate,
      total: Math.round(hours * hourlyRate * 100) / 100,
    };
  });

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  const due = new Date();
  due.setDate(due.getDate() + paymentTerms);

  return Response.json({
    line_items: lineItems,
    subtotal,
    suggested_due_date: due.toISOString().split("T")[0],
    visit_count: lineItems.length,
  });
}
