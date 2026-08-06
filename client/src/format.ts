const TIME_ZONE = "Europe/London";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayHeadingFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** The Admiralty API returns DateTime as GMT with no timezone designator
 * (e.g. "2026-08-06T03:26:00") and never applies BST. Treat it as UTC so
 * that formatting with the Europe/London zone below correctly shifts it
 * to UK local clock time (BST in summer, GMT in winter). */
export function toUtcDate(iso: string): Date {
  return new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

const offsetPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** UK local (BST/GMT) offset from UTC, in minutes, at the given instant. */
export function londonOffsetMinutes(utcMs: number): number {
  const parts = Object.fromEntries(
    offsetPartsFormatter.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - utcMs) / 60_000);
}

/** Epoch ms of local midnight (UK clock time) for a "YYYY-MM-DD" day key. */
export function londonMidnightMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const guessUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0);
  return guessUtcMs - londonOffsetMinutes(guessUtcMs) * 60_000;
}

/** en-CA locale formats as YYYY-MM-DD, giving a sortable, comparable key
 * for the station's local (UK) calendar day. */
export function londonDateKey(iso: string): string {
  return dateKeyFormatter.format(toUtcDate(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(toUtcDate(iso));
}

export function formatTimeMs(epochMs: number): string {
  return timeFormatter.format(new Date(epochMs));
}

export function formatDayHeading(dateKey: string): string {
  return dayHeadingFormatter.format(new Date(`${dateKey}T12:00:00Z`));
}

export function dayLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return "Today";

  const [y, m, d] = todayKey.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const tomorrowKey = dateKeyFormatter.format(tomorrow);
  if (dateKey === tomorrowKey) return "Tomorrow";

  return dayHeadingFormatter.format(new Date(`${dateKey}T12:00:00Z`));
}
