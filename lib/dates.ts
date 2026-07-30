const LONDON_TIME_ZONE = "Europe/London";

function getLondonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function londonOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const value = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function londonLocalTimeToUtc(parts: { year: number; month: number; day: number }, hour: number, minute: number, second: number, millisecond: number) {
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second, millisecond));
  const offset = londonOffsetMinutes(utcGuess);
  return new Date(utcGuess.getTime() - offset * 60 * 1000);
}

export function londonDayWindow(date = new Date()) {
  const parts = getLondonDateParts(date);
  const start = londonLocalTimeToUtc(parts, 0, 0, 0, 0);
  const end = londonLocalTimeToUtc(parts, 23, 59, 59, 999);
  return { start, end };
}

export function londonDayStartIso(date = new Date()) {
  return londonDayWindow(date).start.toISOString();
}

export function londonDayEndIso(date = new Date()) {
  return londonDayWindow(date).end.toISOString();
}
