/**
 * D1 queries for events. All reads/writes for the events domain go through
 * this module; the HTTP surface lives in events-fns.ts.
 */
import type { AcademyEvent, EventCategory, EventDate } from "@/lib/events-types";

import { getDb } from "./cf";

interface EventRow {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  image_url: string | null;
  published: number;
  created_at: string;
}

interface DateRow {
  id: string;
  event_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

function assemble(events: EventRow[], dates: DateRow[]): AcademyEvent[] {
  const byEvent = new Map<string, EventDate[]>();
  for (const d of dates) {
    const list = byEvent.get(d.event_id) ?? [];
    list.push(d);
    byEvent.set(d.event_id, list);
  }
  return events.map((e) => ({
    ...e,
    published: e.published === 1,
    dates: byEvent.get(e.id) ?? [],
  }));
}

export async function listEvents(publishedOnly: boolean): Promise<AcademyEvent[]> {
  const db = getDb();
  const where = publishedOnly ? "WHERE published = 1" : "";
  const events = await db
    .prepare(
      `SELECT id, title, description, category, image_url, published, created_at
       FROM events ${where} ORDER BY created_at DESC`,
    )
    .all<EventRow>();
  const dates = await db
    .prepare(
      `SELECT d.id, d.event_id, d.date, d.start_time, d.end_time
       FROM event_dates d ${publishedOnly ? "JOIN events e ON e.id = d.event_id AND e.published = 1" : ""}
       ORDER BY d.date`,
    )
    .all<DateRow>();
  return assemble(events.results, dates.results);
}

export async function getEventById(id: string): Promise<AcademyEvent | null> {
  const db = getDb();
  const event = await db
    .prepare(
      "SELECT id, title, description, category, image_url, published, created_at FROM events WHERE id = ?1",
    )
    .bind(id)
    .first<EventRow>();
  if (!event) return null;
  const dates = await db
    .prepare(
      "SELECT id, event_id, date, start_time, end_time FROM event_dates WHERE event_id = ?1 ORDER BY date",
    )
    .bind(id)
    .all<DateRow>();
  return assemble([event], dates.results)[0]!;
}

export interface EventWriteInput {
  title: string;
  description: string;
  category: EventCategory;
  image_url: string | null;
  published: boolean;
  dates: { date: string; start_time: string; end_time: string }[];
}

function dateInserts(eventId: string, input: EventWriteInput) {
  const db = getDb();
  return input.dates.map((d, i) =>
    db
      .prepare(
        "INSERT INTO event_dates (id, event_id, date, start_time, end_time) VALUES (?1, ?2, ?3, ?4, ?5)",
      )
      .bind(`${eventId}-d${String(i + 1).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8)}`, eventId, d.date, d.start_time, d.end_time),
  );
}

export async function createEventRecord(input: EventWriteInput): Promise<string> {
  const db = getDb();
  const id = `evt-${crypto.randomUUID()}`;
  await db.batch([
    db
      .prepare(
        "INSERT INTO events (id, title, description, category, image_url, published) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
      )
      .bind(id, input.title, input.description, input.category, input.image_url, input.published ? 1 : 0),
    ...dateInserts(id, input),
  ]);
  return id;
}

export async function updateEventRecord(id: string, input: EventWriteInput): Promise<void> {
  const db = getDb();
  await db.batch([
    db
      .prepare(
        "UPDATE events SET title = ?2, description = ?3, category = ?4, image_url = ?5, published = ?6 WHERE id = ?1",
      )
      .bind(id, input.title, input.description, input.category, input.image_url, input.published ? 1 : 0),
    db.prepare("DELETE FROM event_dates WHERE event_id = ?1").bind(id),
    ...dateInserts(id, input),
  ]);
}

export async function deleteEventRecord(id: string): Promise<void> {
  const db = getDb();
  await db.batch([
    db.prepare("DELETE FROM event_dates WHERE event_id = ?1").bind(id),
    db.prepare("DELETE FROM events WHERE id = ?1").bind(id),
  ]);
}

export async function setEventPublished(id: string, published: boolean): Promise<void> {
  await getDb()
    .prepare("UPDATE events SET published = ?2 WHERE id = ?1")
    .bind(id, published ? 1 : 0)
    .run();
}
