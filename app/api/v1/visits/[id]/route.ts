import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, successResponse, errorResponse, logAPICall } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const ctx = await validateAPIKey(req);
  if (!ctx) return NextResponse.json(errorResponse("UNAUTHORISED", "Invalid API key"), { status: 401 });

  const { id } = await params;
  const supabase = await createServiceClient();

  const [{ data: visit, error }, { data: notes }, { data: meds }] = await Promise.all([
    supabase.from("visits")
      .select("*, clients(first_name, last_name), users(first_name, last_name)")
      .eq("id", id).eq("organisation_id", ctx.organisationId).single(),
    supabase.from("visit_notes").select("content, sentiment, created_at").eq("visit_id", id).limit(10),
    supabase.from("medication_records").select("medication_id, status, medications(name)").eq("visit_id", id),
  ]);

  const ms = Date.now() - start;
  await logAPICall(ctx.organisationId, `/api/v1/visits/${id}`, "GET", error ? 404 : 200, ms);

  if (error || !visit) return NextResponse.json(errorResponse("NOT_FOUND", "Visit not found"), { status: 404 });
  return NextResponse.json(successResponse({ ...visit, notes, medications: meds }, { organisation_id: ctx.organisationId }));
}
