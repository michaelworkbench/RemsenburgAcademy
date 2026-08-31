/**
 * D1 queries for the committee roster and the photo gallery — site content
 * that admins edit but which isn't event data.
 */
import { getDb, getImagesBucket } from "./cf";

export interface CommitteeMember {
  id: string;
  name: string;
  /** Officer title such as "President"; empty string for plain members. */
  title: string;
  sort_order: number;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

export async function listCommittee(): Promise<CommitteeMember[]> {
  const rows = await getDb()
    .prepare("SELECT id, name, title, sort_order FROM committee_members ORDER BY sort_order, name")
    .all<CommitteeMember>();
  return rows.results;
}

/**
 * Full-replace save: the admin screen submits the entire roster in order.
 * Rows that already exist keep their id (stable across edits); new rows get
 * one. Concurrent edits are last-write-wins — acceptable for a 3-admin org.
 */
export async function replaceCommittee(
  members: { id?: string | undefined; name: string; title: string }[],
): Promise<void> {
  const db = getDb();
  await db.batch([
    db.prepare("DELETE FROM committee_members"),
    ...members.map((m, i) =>
      db
        .prepare(
          "INSERT INTO committee_members (id, name, title, sort_order) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind(m.id ?? `cm-${crypto.randomUUID().slice(0, 8)}`, m.name, m.title, i + 1),
    ),
  ]);
}

export async function listGallery(): Promise<GalleryPhoto[]> {
  const rows = await getDb()
    .prepare(
      "SELECT id, image_url, caption, sort_order FROM gallery_photos ORDER BY sort_order, id",
    )
    .all<GalleryPhoto>();
  return rows.results;
}

export async function addGalleryPhoto(imageUrl: string, caption: string): Promise<string> {
  const db = getDb();
  const id = `gp-${crypto.randomUUID().slice(0, 8)}`;
  const max = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM gallery_photos")
    .first<{ m: number }>();
  await db
    .prepare(
      "INSERT INTO gallery_photos (id, image_url, caption, sort_order) VALUES (?1, ?2, ?3, ?4)",
    )
    .bind(id, imageUrl, caption, (max?.m ?? 0) + 1)
    .run();
  return id;
}

/** Full-replace of captions and ordering for existing photos (by id, in order). */
export async function updateGalleryMeta(items: { id: string; caption: string }[]): Promise<void> {
  if (items.length === 0) return;
  const db = getDb();
  await db.batch(
    items.map((item, i) =>
      db
        .prepare("UPDATE gallery_photos SET caption = ?2, sort_order = ?3 WHERE id = ?1")
        .bind(item.id, item.caption, i + 1),
    ),
  );
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const db = getDb();
  const row = await db
    .prepare("SELECT image_url FROM gallery_photos WHERE id = ?1")
    .bind(id)
    .first<{ image_url: string }>();
  await db.prepare("DELETE FROM gallery_photos WHERE id = ?1").bind(id).run();
  // Best-effort cleanup of the stored object so deleted photos don't stay
  // publicly fetchable at their /r2img/ URL.
  if (row?.image_url.startsWith("/r2img/")) {
    const bucket = getImagesBucket();
    if (bucket) {
      try {
        await bucket.delete(row.image_url.replace(/^\/r2img\//, ""));
      } catch (error) {
        console.error("R2 cleanup failed for", row.image_url, error);
      }
    }
  }
}
