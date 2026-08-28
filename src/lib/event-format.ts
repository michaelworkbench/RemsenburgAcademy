import type { AcademyEvent, EventDate } from "./events-types";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Parses "2024-08-02" as a local calendar day (no timezone shifting). */
export function parseDay(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sortedDates(dates: EventDate[]): EventDate[] {
  return [...dates].sort((a, b) => a.date.localeCompare(b.date));
}

export function firstDate(event: AcademyEvent): EventDate | undefined {
  return sortedDates(event.dates)[0];
}

export function lastDate(event: AcademyEvent): EventDate | undefined {
  const all = sortedDates(event.dates);
  return all[all.length - 1];
}

/**
 * Today's calendar date at the Academy (America/New_York), as "YYYY-MM-DD".
 * Anchoring to the venue's timezone keeps "upcoming vs past" correct on the
 * server too, where SSR runs in UTC — otherwise an evening event would drop
 * off the upcoming list at 8 pm New York time.
 */
export function todayAtTheAcademy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isUpcoming(event: AcademyEvent, todayIso = todayAtTheAcademy()): boolean {
  const last = lastDate(event);
  return !!last && last.date >= todayIso;
}

export function eventYear(event: AcademyEvent): number {
  const first = firstDate(event);
  return first ? parseDay(first.date).getFullYear() : new Date(event.created_at).getFullYear();
}

/** Formats "14:30" as "2:30 pm", and "10:00" as "10 am". */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Distinct "10:00–17:00" strings across an event's dates. */
export function timeSummary(event: AcademyEvent): string[] {
  const seen = new Set<string>();
  for (const d of sortedDates(event.dates)) {
    seen.add(formatTimeRange(d.start_time, d.end_time));
  }
  return [...seen];
}

function groupConsecutive(dates: EventDate[]): EventDate[][] {
  const groups: EventDate[][] = [];
  for (const d of dates) {
    const current = groups[groups.length - 1];
    if (!current) {
      groups.push([d]);
      continue;
    }
    const prev = parseDay(current[current.length - 1]!.date);
    const next = parseDay(d.date);
    const oneDay = 24 * 60 * 60 * 1000;
    if (next.getTime() - prev.getTime() <= oneDay) current.push(d);
    else groups.push([d]);
  }
  return groups;
}

function rangeLabel(group: EventDate[], withYear: boolean): string {
  const start = parseDay(group[0]!.date);
  const end = parseDay(group[group.length - 1]!.date);
  const year = withYear ? `, ${end.getFullYear()}` : "";
  if (group.length === 1) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}${year}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}–${end.getDate()}${year}`;
  }
  return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}${year}`;
}

/** Weekday summary such as "Fridays–Sundays" or "Saturdays & Sundays". */
function weekdayLabel(dates: EventDate[]): string | null {
  if (dates.length < 2) return null;
  const days = [...new Set(dates.map((d) => parseDay(d.date).getDay()))].sort((a, b) => a - b);
  if (days.length === 1 || days.length > 4) return null;
  const consecutive = days.every((d, i) => i === 0 || d === days[i - 1]! + 1);
  const plural = (i: number) => `${WEEKDAYS[i] ?? ""}s`;
  if (consecutive) return `${plural(days[0]!)}–${plural(days[days.length - 1]!)}`;
  return days.map(plural).join(" & ");
}

/**
 * Friendly date display for one event, however many dates it has.
 * Single day -> "Saturday, August 2, 2024"
 * Multi-day  -> { weekdays: "Fridays–Sundays", range: "Aug 2–11, 2024" }
 */
export function formatEventDates(event: AcademyEvent): {
  primary: string;
  detail: string | null;
} {
  const dates = sortedDates(event.dates);
  if (dates.length === 0) return { primary: "Dates to be announced", detail: null };

  if (dates.length === 1) {
    const d = parseDay(dates[0]!.date);
    return {
      primary: `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
      detail: null,
    };
  }

  const groups = groupConsecutive(dates);
  const year = parseDay(dates[dates.length - 1]!.date).getFullYear();
  const spanFirst = parseDay(dates[0]!.date);
  const spanLast = parseDay(dates[dates.length - 1]!.date);
  const span =
    spanFirst.getMonth() === spanLast.getMonth()
      ? `${MONTHS_SHORT[spanFirst.getMonth()]} ${spanFirst.getDate()}–${spanLast.getDate()}, ${year}`
      : `${MONTHS_SHORT[spanFirst.getMonth()]} ${spanFirst.getDate()} – ${MONTHS_SHORT[spanLast.getMonth()]} ${spanLast.getDate()}, ${year}`;

  const weekdays = weekdayLabel(dates);
  if (weekdays && groups.length > 1) {
    return { primary: `${weekdays}, ${span}`, detail: groups.map((g) => rangeLabel(g, false)).join(" & ") + `, ${year}` };
  }
  return {
    primary: groups.map((g) => rangeLabel(g, false)).join(" & ") + `, ${year}`,
    detail: null,
  };

}

export function formatDayLong(iso: string): string {
  const d = parseDay(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
