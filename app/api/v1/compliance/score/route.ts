import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("compliance_scores")
    .select("*")
    .eq("organisation_id", ctx.organisationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, "/api/v1/compliance/score", "GET", error ? 404 : 200, ms);

  if (error) return NextResponse.json(errorResponse("NOT_FOUND", "No compliance score found"), { status: 404 });
  return NextResponse.json(successResponse(data, { organisation_id: ctx.organisationId }));
}
