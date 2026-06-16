import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) {
    return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });
  }

  const supabase = await createServiceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const riskLevel = searchParams.get("risk_level");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabase
    .from("clients")
    .select("id, first_name, last_name, nhs_number, date_of_birth, risk_level, status, address, created_at", { count: "exact" })
    .eq("organisation_id", ctx.organisationId)
    .order("last_name")
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (riskLevel) query = query.eq("risk_level", riskLevel);

  const { data, error, count } = await query;
  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/clients", "GET", error ? 500 : 200, ms);

  if (error) return NextResponse.json(errorResponse("DB_ERROR", error.message), { status: 500 });
  return NextResponse.json(successResponse(data, { total: count, limit, offset, organisation_id: ctx.organisationId }));
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) {
    return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });
  }

  const supabase = await createServiceClient();
  const body = await req.json();

  const { first_name, last_name, date_of_birth, nhs_number } = body;
  if (!first_name || !last_name) {
    return NextResponse.json(errorResponse("VALIDATION", "first_name and last_name are required"), { status: 400 });
  }

  const { data, error } = await supabase.from("clients").insert({
    first_name,
    last_name,
    date_of_birth,
    nhs_number,
    organisation_id: ctx.organisationId,
    status: "active",
    onboarding_complete: false,
  }).select().single();

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/clients", "POST", error ? 500 : 201, ms);

  if (error) return NextResponse.json(errorResponse("DB_ERROR", error.message), { status: 500 });
  return NextResponse.json(successResponse(data, { organisation_id: ctx.organisationId }), { status: 201 });
}
