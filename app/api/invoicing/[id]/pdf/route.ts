import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();

  if (!["org_admin", "manager", "coordinator", "superadmin"].includes(userRecord?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(first_name, last_name), organisations(name)")
    .eq("id", id)
    .eq("organisation_id", userRecord!.organisation_id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Build a minimal plain-text invoice until a PDF library is integrated
  const lines = [
    `INVOICE`,
    ``,
    `Invoice #: ${invoice.invoice_number ?? id}`,
    `Date: ${new Date(invoice.created_at).toLocaleDateString("en-GB")}`,
    `Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-GB") : "On receipt"}`,
    ``,
    `From: ${(invoice.organisations as Record<string, string>)?.name ?? ""}`,
    `To: ${(invoice.clients as Record<string, string>)?.first_name ?? ""} ${(invoice.clients as Record<string, string>)?.last_name ?? ""}`,
    ``,
    `Amount: £${Number(invoice.total_amount ?? 0).toFixed(2)}`,
    `Status: ${invoice.status}`,
    ``,
    `Careroot Care Management Platform`,
  ].join("\n");

  return new NextResponse(lines, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number ?? id}.txt"`,
    },
  });
}
