import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const supabase = await createServiceClient();
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const carerId = searchParams.get("carer_id");
  const clientId = searchParams.get("client_id");
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabase
    .from("visits")
    .select("id, scheduled_start, scheduled_end, actual_start, actual_end, status, client_id, carer_id, clients(first_name, last_name), users(first_name, last_name)", { count: "exact" })
    .eq("organisation_id", ctx.organisationId)
    .order("scheduled_start", { ascending: false })
    .range(offset, offset + limit - 1);

  if (dateFrom) query = query.gte("scheduled_start", dateFrom);
  if (dateTo) query = query.lte("scheduled_start", dateTo);
  if (carerId) query = query.eq("carer_id", carerId);
  if (clientId) query = query.eq("client_id", clientId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/visits", "GET", error ? 500 : 200, ms);

  if (error) return NextResponse.json(errorResponse("DB_ERROR", error.message), { status: 500 });
  return NextResponse.json(successResponse(data, { total: count, limit, offset, organisation_id: ctx.organisationId }));
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const supabase = await createServiceClient();
  const body = await req.json();
  const { client_id, carer_id, scheduled_start, scheduled_end } = body;

  if (!client_id || !scheduled_start) {
    return NextResponse.json(errorResponse("VALIDATION", "client_id and scheduled_start are required"), { status: 400 });
  }

  const { data, error } = await supabase.from("visits").insert({
    client_id,
    carer_id,
    scheduled_start,
    scheduled_end,
    organisation_id: ctx.organisationId,
    status: "scheduled",
  }).select().single();

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/visits", "POST", error ? 500 : 201, ms);

  if (error) return NextResponse.json(errorResponse("DB_ERROR", error.message), { status: 500 });
  return NextResponse.json(successResponse(data, { organisation_id: ctx.organisationId }), { status: 201 });
}
