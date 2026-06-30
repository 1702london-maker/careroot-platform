/** Great-circle distance in metres between two lat/lng points (Haversine). */
export function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Server-side approved-radius check. Returns null when coordinates are missing
 * (cannot determine), otherwise true/false. Never trust a client-supplied flag.
 */
export function withinApprovedRadius(
  deviceLat: number | null | undefined,
  deviceLng: number | null | undefined,
  clientLat: number | null | undefined,
  clientLng: number | null | undefined,
  radiusMetres = 300
): boolean | null {
  if (deviceLat == null || deviceLng == null || clientLat == null || clientLng == null) return null;
  return haversineMetres(Number(deviceLat), Number(deviceLng), Number(clientLat), Number(clientLng)) <= radiusMetres;
}
