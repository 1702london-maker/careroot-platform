import { withinApprovedRadius } from "@/lib/geo";

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => unknown;
  };
};

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error?: { message: string } | null }>;
  single: () => Promise<{ data: Record<string, unknown> | null; error?: { message: string } | null }>;
};

export type ActiveShiftGuardResult =
  | {
      ok: true;
      shift: Record<string, unknown>;
      client: Record<string, unknown> | null;
      organisationId: string | null;
      clientName: string;
      cleanImei: string;
      withinApprovedRadius: boolean | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function verifyActiveShiftAccess(
  supabase: SupabaseClientLike,
  params: {
    userId: string;
    shiftId: string;
    clientId?: string | null;
    imei?: string | null;
    gpsLat?: number | null;
    gpsLng?: number | null;
  }
): Promise<ActiveShiftGuardResult> {
  const now = new Date().toISOString();
  const cleanImei = String(params.imei || "").replace(/\s/g, "");

  if (!cleanImei) {
    return { ok: false, status: 401, error: "Device identifier required" };
  }

  const [{ data: credential }, { data: shift }, { data: device }] = await Promise.all([
    ((supabase.from("shift_credentials").select("valid_until, invalidated_at") as QueryBuilder)
      .eq("shift_id", params.shiftId)
      .eq("staff_id", params.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()),
    ((supabase.from("shifts").select("id, staff_id, status, client_ids") as QueryBuilder)
      .eq("id", params.shiftId)
      .eq("staff_id", params.userId)
      .single()),
    ((supabase.from("registered_devices").select("id, is_active") as QueryBuilder)
      .eq("imei", cleanImei)
      .eq("staff_id", params.userId)
      .single()),
  ]);

  if (!credential || credential.invalidated_at || now > String(credential.valid_until)) {
    return { ok: false, status: 401, error: "Your shift access has expired. Ask a manager to re-authorise." };
  }

  if (!shift || shift.status !== "active") {
    return { ok: false, status: 403, error: "Shift is not active for this staff member" };
  }

  if (!device || !device.is_active) {
    return { ok: false, status: 401, error: "Device not registered or inactive" };
  }

  const shiftClientIds = (shift.client_ids as string[] | null) ?? [];
  if (params.clientId && !shiftClientIds.includes(params.clientId)) {
    return { ok: false, status: 403, error: "Client is not assigned to this shift" };
  }

  let client: Record<string, unknown> | null = null;
  let organisationId: string | null = null;
  let clientName = "the client";
  let radiusResult: boolean | null = null;

  if (params.clientId) {
    const { data } = await ((supabase
      .from("clients")
      .select("organisation_id, first_name, last_name, gps_lat, gps_lng, approved_radius_metres") as QueryBuilder)
      .eq("id", params.clientId)
      .single());
    client = data;
    organisationId = (client?.organisation_id as string | null) ?? null;
    if (client) clientName = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "the client";

    radiusResult = withinApprovedRadius(
      params.gpsLat,
      params.gpsLng,
      client?.gps_lat as number | null | undefined,
      client?.gps_lng as number | null | undefined,
      (client?.approved_radius_metres as number | null | undefined) ?? 300
    );

    if (client?.gps_lat && client?.gps_lng && radiusResult !== true) {
      return {
        ok: false,
        status: 401,
        error: radiusResult === false
          ? "You are outside the approved radius for this client"
          : "GPS location is required to submit this record for this client",
      };
    }
  }

  return {
    ok: true,
    shift,
    client,
    organisationId,
    clientName,
    cleanImei,
    withinApprovedRadius: radiusResult,
  };
}
