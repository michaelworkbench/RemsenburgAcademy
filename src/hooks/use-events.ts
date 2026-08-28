import { useEffect, useState } from "react";

import { loadAllEvents, loadPublishedEvents, subscribeToEvents } from "@/lib/events-store";
import type { AcademyEvent } from "@/lib/events-types";
import { isUpcoming, firstDate, lastDate, parseDay } from "@/lib/event-format";

function useEventList(includeDrafts: boolean) {
  const read = includeDrafts ? loadAllEvents : loadPublishedEvents;
  const [events, setEvents] = useState<AcademyEvent[]>(() => read());

  useEffect(() => {
    setEvents(read());
    return subscribeToEvents(() => setEvents(read()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDrafts]);

  return events;
}

/** Published events, for the public site. */
export function usePublishedEvents(): AcademyEvent[] {
  return useEventList(false);
}

/** Every event including drafts, for the admin panel. */
export function useAllEvents(): AcademyEvent[] {
  return useEventList(true);
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
