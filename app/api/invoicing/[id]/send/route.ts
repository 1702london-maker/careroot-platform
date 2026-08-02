import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidIdResponse, isUuid } from "@/lib/route-params";
import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!isUuid(id)) return invalidIdResponse();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase
    .from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, subject, message } = await req.json();
  if (!email || typeof email !== "string") {
    return Response.json({ error: "Recipient email required" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "Email service not configured" }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Org-scoped — caller can only send invoices for their own org
  const { data: inv } = await supabase
    .from("invoices")
    .select("*, clients(first_name, last_name), invoice_line_items(*)")
    .eq("id", id)
    .eq("organisation_id", caller.organisation_id)
    .single();

  if (!inv) return Response.json({ error: "Invoice not found" }, { status: 404 });

  const lineItemsHtml = (inv.invoice_line_items ?? []).map((l: { date: string; description: string; quantity: number; unit: string; unit_price: number; total: number }) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${l.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${l.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${l.quantity} ${l.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">£${Number(l.unit_price).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">£${Number(l.total).toFixed(2)}</td>
    </tr>`).join("");

  await resend.emails.send({
    from: "Careroot <noreply@careroot.care>",
    to: email,
    subject: subject ?? `Invoice ${inv.invoice_number} from Careroot`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1A3C2E">${escapeHtml(subject ?? `Invoice ${inv.invoice_number}`)}</h2>
        <p>${escapeHtml(message ?? `Please find your invoice ${inv.invoice_number} attached.`)}</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead><tr style="background:#E8F5EE">
            <th style="padding:8px 12px;text-align:left;font-size:12px">Date</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px">Description</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px">Rate</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px">Total</th>
          </tr></thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>
        <p style="text-align:right"><strong>Total: £${Number(inv.total).toFixed(2)}</strong></p>
        <p style="color:#6B7280;font-size:12px">Due: ${new Date(inv.due_date).toLocaleDateString("en-GB")}</p>
        <hr/><p style="color:#6B7280;font-size:12px">Careroot Ltd · onboarding@careroot.co.uk</p>
      </div>`,
  });

  await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);

  return Response.json({ success: true });
}
