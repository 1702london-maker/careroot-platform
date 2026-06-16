import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export interface APIContext {
  organisationId: string;
}

const successResponse = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    version: "1.0",
    ...meta,
  },
});

const errorResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message },
});

export { successResponse, errorResponse };

export async function validateAPIKey(req: NextRequest): Promise<APIContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  if (!apiKey) return null;

  const supabase = await createServiceClient();

  // Find org with matching API key in settings jsonb
  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, settings")
    .not("settings->api_key", "is", null);

  if (!orgs) return null;

  for (const org of orgs) {
    const settings = org.settings as Record<string, unknown> | null;
    if (settings?.api_key === apiKey && settings?.api_access_enabled) {
      return { organisationId: org.id };
    }
  }

  return null;
}

export async function logAPICall(
  organisationId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number
) {
  const supabase = await createServiceClient();
  await supabase.from("api_logs").insert({
    organisation_id: organisationId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  });
}
