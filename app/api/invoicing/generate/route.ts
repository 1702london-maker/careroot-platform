import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase
    .from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { client_id, period_start, period_end } = await req.json();
  const organisation_id = caller.organisation_id; // always from session, never from body

  if (!client_id || !period_start || !period_end) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: billing } = await supabase
    .from("client_billing")
    .select("*, rate_cards(*)")
    .eq("client_id", client_id)
    .single();

  const hourlyRate = billing?.rate_cards?.hourly_rate ?? billing?.private_rate_override ?? 18.0;
  const paymentTerms = billing?.payment_terms_days ?? 30;

  const { data: financialRecords } = await supabase
    .from("shift_financial_records")
    .select("id, shift_id, actual_hours, commissioned_hours, billable_amount, mileage_claimed_miles, created_at, staff:users!staff_id(first_name, last_name, organisation_id), shift:shifts(actual_start, scheduled_start)")
    .eq("client_id", client_id)
    .eq("staff.organisation_id", organisation_id)
    .gte("created_at", period_start)
    .lte("created_at", period_end + "T23:59:59");

  const phase2LineItems = (financialRecords ?? []).map((r) => {
    const hours = Number(r.actual_hours ?? r.commissioned_hours ?? 0);
    const total = r.billable_amount != null ? Number(r.billable_amount) : Math.round(hours * hourlyRate * 100) / 100;
    const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff;
    const shift = Array.isArray(r.shift) ? r.shift[0] : r.shift;
    const carerName = staff ? `${staff.first_name} ${staff.last_name}` : "";
    const dateSource = shift?.actual_start ?? shift?.scheduled_start ?? r.created_at;
    return {
      shift_id: r.shift_id,
      description: `Commissioned care shift${carerName ? ` (${carerName})` : ""}`,
      date: new Date(dateSource).toISOString().split("T")[0],
      quantity: hours,
      unit: "hours",
      unit_price: hours ? Math.round((total / hours) * 100) / 100 : hourlyRate,
      total,
    };
  });

  if (phase2LineItems.length) {
    const subtotal = phase2LineItems.reduce((s, l) => s + l.total, 0);
    const due = new Date();
    due.setDate(due.getDate() + paymentTerms);
    return Response.json({
      source: "shift_financial_records",
      line_items: phase2LineItems,
      subtotal,
      suggested_due_date: due.toISOString().split("T")[0],
      visit_count: phase2LineItems.length,
    });
  }

  // Fallback to legacy completed visits until all shifts have financial records.
  const { data: visits } = await supabase
    .from("visits")
    .select("*, users!visits_carer_id_fkey(first_name, last_name), clients(first_name, last_name)")
    .eq("organisation_id", organisation_id)
    .eq("client_id", client_id)
    .eq("status", "completed")
    .gte("scheduled_start", period_start)
    .lte("scheduled_start", period_end + "T23:59:59");

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
