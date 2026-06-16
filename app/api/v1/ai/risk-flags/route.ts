import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("ai_risk_flags")
    .select("id, flag_type, severity, description, status, created_at, clients(first_name, last_name)")
    .eq("organisation_id", ctx.organisationId)
    .eq("status", "open")
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/ai/risk-flags", "GET", error ? 500 : 200, ms);

  if (error) return NextResponse.json(errorResponse("DB_ERROR", error.message), { status: 500 });
  return NextResponse.json(successResponse(data, { organisation_id: ctx.organisationId }));
}
