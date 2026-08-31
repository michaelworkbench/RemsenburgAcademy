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
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  listCommittee,
  listGallery,
  replaceCommittee,
  updateGalleryMeta,
} from "@/server/site-content";

/* --------------------------------- schemas ---------------------------------- */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d!));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m! - 1 && dt.getUTCDate() === d;
  }, "Not a real calendar date");
const hhmm = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Expected HH:MM")
  .refine((t) => {
    const [h, m] = t.split(":").map(Number);
    return h! <= 23 && m! <= 59;
  }, "Not a real time of day");

const eventInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  category: z.enum(EVENT_CATEGORIES as [string, ...string[]]),
  image_url: z
    .string()
    .max(500)
    .refine(
      (v) => /^\/(images|r2img)\/[A-Za-z0-9/._-]+$/.test(v),
      "Image must be one of this site's own images.",
    )
    .nullable(),
  published: z.boolean(),
  dates: z
    .array(
      z
        .object({ date: isoDate, start_time: hhmm, end_time: hhmm })
        .refine((d) => d.end_time > d.start_time, "End time must be later than start time."),
    )
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
  .inputValidator((d: unknown) =>
    z.object({ id: idSchema.shape.id, input: eventInputSchema }).parse(d),
  )
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
  .inputValidator((d: unknown) =>
    z.object({ id: idSchema.shape.id, published: z.boolean() }).parse(d),
  )
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
    z
      .object({ email: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await signInWithPassword(data.email, data.password);
    if (admin === "locked") {
      return {
        ok: false as const,
        error: "Too many failed attempts. Please wait 15 minutes and try again.",
      };
    }
    if (!admin) {
      return {
        ok: false as const,
        error: "That email and password don't match an Academy admin account.",
      };
    }
    return { ok: true as const, email: admin.email };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  await signOutSession();
  return { ok: true };
});

/* ------------------------------ image uploads ------------------------------- */

const uploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /** Base64 (no data: prefix). 4 MB raw ≈ 5.4 MB encoded. */
  dataBase64: z.string().min(1).max(6_000_000),
});

type UploadPayload = z.infer<typeof uploadSchema>;

/** Validates and stores one image in R2 under `prefix/`; returns its URL. */
async function storeImage(
  prefix: "posters" | "gallery",
  data: UploadPayload,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const bucket = getImagesBucket();
  if (!bucket) {
    return {
      ok: false,
      error:
        "Image uploads aren't switched on yet — they arrive with the Academy's own hosting account.",
    };
  }
  const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
  if (bytes.length > 4 * 1024 * 1024) {
    return { ok: false, error: "That image is larger than 4 MB. Please choose a smaller one." };
  }
  const looksLike = {
    "image/jpeg": bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "image/png": bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
    "image/webp":
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  }[data.contentType];
  if (!looksLike) {
    return { ok: false, error: "That file doesn't look like a valid image. Please try another." };
  }
  const ext =
    data.contentType === "image/png" ? "png" : data.contentType === "image/webp" ? "webp" : "jpg";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;
  await bucket.put(key, bytes.buffer as ArrayBuffer, {
    httpMetadata: { contentType: data.contentType },
  });
  return { ok: true, url: `/r2img/${key}` };
}

export const uploadPosterFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    return storeImage("posters", data);
  });

/* ------------------------- committee & photo gallery ------------------------- */

export const fetchCommittee = createServerFn({ method: "GET" }).handler(() => listCommittee());

const committeeSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(120),
      title: z.string().trim().max(120),
    }),
  )
  .min(1)
  .max(50);

export const saveCommitteeFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => committeeSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await replaceCommittee(data);
    return { ok: true };
  });

export const fetchGallery = createServerFn({ method: "GET" }).handler(() => listGallery());

export const addGalleryPhotoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ upload: uploadSchema, caption: z.string().trim().max(300) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const stored = await storeImage("gallery", data.upload);
    if (!stored.ok) return stored;
    await addGalleryPhoto(stored.url, data.caption);
    return { ok: true as const, url: stored.url };
  });

export const saveGalleryMetaFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .array(z.object({ id: z.string().min(1).max(100), caption: z.string().trim().max(300) }))
      .max(200)
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    await updateGalleryMeta(data);
    return { ok: true };
  });

export const deleteGalleryPhotoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await deleteGalleryPhoto(data.id);
    return { ok: true };
  });
