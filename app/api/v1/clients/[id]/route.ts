import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const { id } = await params;
  const supabase = await createServiceClient();

  const [{ data: client, error }, { data: carePlans }] = await Promise.all([
    supabase.from("clients")
      .select("id, first_name, last_name, nhs_number, date_of_birth, risk_level, status, allergies, dnr_status, address, gp_details, created_at")
      .eq("id", id)
      .eq("organisation_id", ctx.organisationId)
      .single(),
    supabase.from("care_plans")
      .select("id, title, status, version, created_at")
      .eq("client_id", id)
      .eq("organisation_id", ctx.organisationId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, `/api/v1/clients/${id}`, "GET", error ? 404 : 200, ms);

  if (error || !client) return NextResponse.json(errorResponse("NOT_FOUND", "Client not found"), { status: 404 });
  return NextResponse.json(successResponse({ ...client, latest_care_plan: carePlans?.[0] ?? null }, { organisation_id: ctx.organisationId }));
}
