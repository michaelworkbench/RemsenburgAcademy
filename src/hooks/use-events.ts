import { useQuery } from "@tanstack/react-query";

import { firstDate, isUpcoming, lastDate, parseDay } from "@/lib/event-format";
import type { AcademyEvent } from "@/lib/events-types";
import { fetchAllEvents, fetchPublishedEvents } from "@/lib/api";

export const EVENTS_QUERY_KEY = ["events"] as const;

/** Published events, for the public site. */
export function usePublishedEvents(): AcademyEvent[] {
  const { data } = useQuery({
    queryKey: [...EVENTS_QUERY_KEY, "published"],
    queryFn: () => fetchPublishedEvents(),
    staleTime: 60_000,
  });
  return data ?? [];
}

/** Every event including drafts, for the admin panel. */
export function useAllEvents(): { events: AcademyEvent[]; isLoading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: [...EVENTS_QUERY_KEY, "all"],
    queryFn: () => fetchAllEvents(),
  });
  return { events: data ?? [], isLoading: isPending };
}

function byStartAsc(a: AcademyEvent, b: AcademyEvent) {
  return (firstDate(a)?.date ?? "").localeCompare(firstDate(b)?.date ?? "");
}

function byEndDesc(a: AcademyEvent, b: AcademyEvent) {
  return (lastDate(b)?.date ?? "").localeCompare(lastDate(a)?.date ?? "");
}

export function splitByTime(events: AcademyEvent[]) {
  const upcoming = events.filter((e) => isUpcoming(e)).sort(byStartAsc);
  const past = events.filter((e) => !isUpcoming(e)).sort(byEndDesc);
  return { upcoming, past };
}

export function groupByYear(events: AcademyEvent[]): [number, AcademyEvent[]][] {
  const map = new Map<number, AcademyEvent[]>();
  for (const event of events) {
    const first = firstDate(event);
    const year = first ? parseDay(first.date).getFullYear() : 0;
    map.set(year, [...(map.get(year) ?? []), event]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}
