/**
 * Admin authentication for the events panel.
 *
 * Email/password accounts live in the D1 `admins` table (provisioned
 * manually — there is no sign-up of any kind). Passwords are stored as
 * PBKDF2-SHA-256 hashes; sessions are random 256-bit tokens whose SHA-256
 * hash is stored in the `sessions` table and whose raw value travels only
 * in an HttpOnly, Secure, SameSite=Lax cookie.
 */
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { getDb } from "./cf";

const SESSION_COOKIE = "ra_session";
const SESSION_DAYS = 30;
export const PBKDF2_ITERATIONS = 100_000;

/* ---------------------------------- hashing --------------------------------- */

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Produces "pbkdf2$sha256$<iterations>$<salt b64>$<hash b64>". */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 1_000 || iterations > 10_000_000) return false;
  const salt = fromBase64(parts[3]!);
  const expected = fromBase64(parts[4]!);
  const actual = await pbkdf2(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

/* ---------------------------------- sessions -------------------------------- */

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export interface AdminIdentity {
  id: string;
  email: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** null = wrong credentials, "locked" = throttled; otherwise the admin. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AdminIdentity | "locked" | null> {
  const db = getDb();
  const key = email.trim().toLowerCase();

  const throttle = await db
    .prepare("SELECT fail_count, locked_until FROM login_attempts WHERE email = ?1")
    .bind(key)
    .first<{ fail_count: number; locked_until: string | null }>();
  if (throttle?.locked_until && new Date(throttle.locked_until).getTime() > Date.now()) {
    return "locked";
  }

  const admin = await db
    .prepare("SELECT id, email, password_hash FROM admins WHERE email = ?1 COLLATE NOCASE")
    .bind(email.trim())
    .first<{ id: string; email: string; password_hash: string }>();

  // Always burn a hash verification so a missing account costs the same time
  // as a wrong password (no account-enumeration timing signal).
  const stored =
    admin?.password_hash ??
    `pbkdf2$sha256$${PBKDF2_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;
  const ok = await verifyPassword(password, stored);
  if (!admin || !ok) {
    const failures = (throttle?.fail_count ?? 0) + 1;
    const lockedUntil =
      failures >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
        : null;
    await db
      .prepare(
        `INSERT INTO login_attempts (email, fail_count, locked_until, last_fail)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(email) DO UPDATE SET
           fail_count = excluded.fail_count,
           locked_until = excluded.locked_until,
           last_fail = excluded.last_fail`,
      )
      .bind(key, lockedUntil ? 0 : failures, lockedUntil, new Date().toISOString())
      .run();
    return null;
  }

  // Successful sign-in: clear throttle state and purge expired sessions.
  await db.batch([
    db.prepare("DELETE FROM login_attempts WHERE email = ?1").bind(key),
    db.prepare("DELETE FROM sessions WHERE expires_at < ?1").bind(new Date().toISOString()),
  ]);

  const token = newSessionToken();
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db
    .prepare("INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?1, ?2, ?3)")
    .bind(tokenHash, admin.id, expires.toISOString())
    .run();

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return { id: admin.id, email: admin.email };
}

export async function getSessionAdmin(): Promise<AdminIdentity | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await getDb()
    .prepare(
      `SELECT a.id AS id, a.email AS email, s.expires_at AS expires_at
       FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?1`,
    )
    .bind(tokenHash)
    .first<{ id: string; email: string; expires_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await getDb().prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
    return null;
  }
  return { id: row.id, email: row.email };
}

export async function signOutSession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await getDb().prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

/** Guard for mutating server functions. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getSessionAdmin();
  if (!admin) throw new Error("Not signed in.");
  return admin;
}
