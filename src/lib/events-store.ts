/**
 * Events data layer (client side).
 *
 * Thin async wrappers over the server functions in src/server/events-fns.ts,
 * which read and write the D1 database. Reads of published events are public;
 * everything else requires an admin session (enforced server-side).
 */
import {
  createEventFn,
  deleteEventFn,
  fetchEventById,
  setPublishedFn,
  updateEventFn,
  uploadPosterFn,
} from "@/lib/api";

import type { AcademyEvent, EventCategory } from "./events-types";

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

export async function getEvent(id: string): Promise<AcademyEvent | null> {
  return (await fetchEventById({ data: { id } })) ?? null;
}

export async function createEvent(input: EventInput): Promise<void> {
  await createEventFn({ data: input });
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  await updateEventFn({ data: { id, input } });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteEventFn({ data: { id } });
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  await setPublishedFn({ data: { id, published } });
}

/**
 * Uploads a poster image; resolves to its serving URL. Returns a friendly
 * error while image storage is not yet enabled on the hosting account.
 */
export async function uploadPoster(
  file: File,
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  const contentType = file.type;
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    return { url: null, error: "Please choose a JPG, PNG, or WebP image." };
  }
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const result = await uploadPosterFn({
    data: {
      fileName: file.name,
      contentType: contentType as "image/jpeg" | "image/png" | "image/webp",
      dataBase64: btoa(binary),
    },
  });
  return result.ok ? { url: result.url, error: null } : { url: null, error: result.error };
}
