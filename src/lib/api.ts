/**
 * The HTTP surface of the site: TanStack server functions for events and
 * admin sessions. Public reads need no session; every mutation calls
 * requireAdmin() first. CSRF exposure is limited by the SameSite=Lax session
 * cookie (mutations are POSTs, which cross-site requests cannot attach the
 * cookie to).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { EVENT_CATEGORIES } from "@/lib/events-types";

import { getImagesBucket } from "@/server/cf";
import { getSessionAdmin, requireAdmin, signInWithPassword, signOutSession } from "@/server/auth";
import {
  createEventRecord,
  deleteEventRecord,
  getEventById,
  listEvents,
  setEventPublished,
  updateEventRecord,
} from "@/server/events-data";

/* --------------------------------- schemas ---------------------------------- */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM");

const eventInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  category: z.enum(EVENT_CATEGORIES as [string, ...string[]]),
  image_url: z
    .string()
    .max(500)
    .refine(
      (v) => v.startsWith("/images/") || v.startsWith("/r2img/") || v.startsWith("https://"),
      "Image must be a site image or an https URL.",
    )
    .nullable(),
  published: z.boolean(),
  dates: z
    .array(z.object({ date: isoDate, start_time: hhmm, end_time: hhmm }))
    .min(1)
    .max(60),
});

export type EventInputPayload = z.infer<typeof eventInputSchema>;

const idSchema = z.object({ id: z.string().min(1).max(100) });

/* ---------------------------------- events ---------------------------------- */

export const fetchPublishedEvents = createServerFn({ method: "GET" }).handler(() =>
  listEvents(true),
);

export const fetchAllEvents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return listEvents(false);
});

export const fetchEventById = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    return getEventById(data.id);
  });

export const createEventFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => eventInputSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const id = await createEventRecord({ ...data, category: data.category as never });
    return { id };
  });

export const updateEventFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: idSchema.shape.id, input: eventInputSchema }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await updateEventRecord(data.id, { ...data.input, category: data.input.category as never });
    return { ok: true };
  });

export const deleteEventFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await deleteEventRecord(data.id);
    return { ok: true };
  });

export const setPublishedFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: idSchema.shape.id, published: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await setEventPublished(data.id, data.published);
    return { ok: true };
  });

/* --------------------------------- sessions --------------------------------- */

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await getSessionAdmin();
  return admin ? { email: admin.email } : null;
});

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await signInWithPassword(data.email, data.password);
    if (!admin) {
      return { ok: false as const, error: "That email and password don't match an Academy admin account." };
    }
    return { ok: true as const, email: admin.email };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  await signOutSession();
  return { ok: true };
});

/* ------------------------------ poster uploads ------------------------------- */

const uploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /** Base64 (no data: prefix). 4 MB raw ≈ 5.4 MB encoded. */
  dataBase64: z.string().min(1).max(6_000_000),
});

export const uploadPosterFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const bucket = getImagesBucket();
    if (!bucket) {
      return {
        ok: false as const,
        error:
          "Image uploads aren't switched on yet — they arrive with the Academy's own hosting account. You can save the event without a poster for now.",
      };
    }
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const ext = data.contentType === "image/png" ? "png" : data.contentType === "image/webp" ? "webp" : "jpg";
    const key = `posters/${crypto.randomUUID()}.${ext}`;
    await bucket.put(key, bytes.buffer as ArrayBuffer, {
      httpMetadata: { contentType: data.contentType },
    });
    return { ok: true as const, url: `/r2img/${key}` };
  });
