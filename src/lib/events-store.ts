/**
 * Events data layer.
 *
 * This is the single module the whole site reads and writes events through.
 * Today it is backed by the seeded dataset plus a browser-local overlay so the
 * public pages and the admin panel are fully functional. When the cloud backend
 * is enabled, only the functions in this file change: they become queries
 * against the `events` / `event_dates` tables (public read of published rows,
 * authenticated writes) with no changes needed in any page or component.
 */
import { SEED_EVENTS } from "./events-seed";
import type { AcademyEvent, EventCategory, EventDate } from "./events-types";

const STORAGE_KEY = "remsenburg-academy:events:v1";
const CHANGE_EVENT = "remsenburg-academy:events-changed";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function clone(events: AcademyEvent[]): AcademyEvent[] {
  return events.map((e) => ({ ...e, dates: e.dates.map((d) => ({ ...d })) }));
}

/** All events, drafts included. Admin-only view. */
export function loadAllEvents(): AcademyEvent[] {
  if (!canUseStorage()) return clone(SEED_EVENTS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(SEED_EVENTS);
    const parsed = JSON.parse(raw) as AcademyEvent[];
    if (!Array.isArray(parsed)) return clone(SEED_EVENTS);
    return parsed;
  } catch {
    return clone(SEED_EVENTS);
  }
}

/** Published events only. This is what anonymous visitors may read. */
export function loadPublishedEvents(): AcademyEvent[] {
  return loadAllEvents().filter((e) => e.published);
}

function persist(events: AcademyEvent[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToEvents(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export interface EventDateInput {
  date: string;
  start_time: string;
  end_time: string;
}

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  image_url: string | null;
  published: boolean;
  dates: EventDateInput[];
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toDateRows(eventId: string, dates: EventDateInput[]): EventDate[] {
  return dates.map((d, i) => ({
    id: `${eventId}-d${i + 1}`,
    event_id: eventId,
    date: d.date,
    start_time: d.start_time,
    end_time: d.end_time,
  }));
}

export function getEvent(id: string): AcademyEvent | undefined {
  return loadAllEvents().find((e) => e.id === id);
}

export function createEvent(input: EventInput): AcademyEvent {
  const id = newId("event");
  const record: AcademyEvent = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    image_url: input.image_url,
    published: input.published,
    created_at: new Date().toISOString(),
    dates: toDateRows(id, input.dates),
  };
  persist([...loadAllEvents(), record]);
  return record;
}

export function updateEvent(id: string, input: EventInput): void {
  const all = loadAllEvents();
  persist(
    all.map((e) =>
      e.id === id
        ? {
            ...e,
            title: input.title.trim(),
            description: input.description.trim(),
            category: input.category,
            image_url: input.image_url,
            published: input.published,
            dates: toDateRows(id, input.dates),
          }
        : e,
    ),
  );
}

export function deleteEvent(id: string): void {
  persist(loadAllEvents().filter((e) => e.id !== id));
}

export function setPublished(id: string, published: boolean): void {
  persist(loadAllEvents().map((e) => (e.id === id ? { ...e, published } : e)));
}
