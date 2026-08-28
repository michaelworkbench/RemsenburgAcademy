#!/usr/bin/env node
/**
 * Generates the SQL to provision (or reset) an admin account.
 *
 *   node scripts/hash-password.mjs someone@example.org            # random password
 *   node scripts/hash-password.mjs someone@example.org "a passphrase"
 *
 * Prints the password and an INSERT you can run with:
 *   npx wrangler d1 execute remsenburg-academy --remote --command "<sql>"
 *
 * Uses the same PBKDF2 parameters as src/server/auth.ts.
 */
import { randomBytes, randomUUID, webcrypto } from "node:crypto";

const ITERATIONS = 100_000;

const email = process.argv[2];
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/hash-password.mjs <email> [password]");
  process.exit(1);
}
const password =
  process.argv[3] ?? randomBytes(12).toString("base64url");

const salt = webcrypto.getRandomValues(new Uint8Array(16));
const key = await webcrypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);
const bits = await webcrypto.subtle.deriveBits(
  { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
  key,
  256,
);
const b64 = (u8) => Buffer.from(u8).toString("base64");
const hash = `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
const id = `adm-${randomUUID()}`;

console.log(`Email:    ${email}`);
console.log(`Password: ${password}`);
console.log("");
console.log(
  `INSERT INTO admins (id, email, password_hash) VALUES ('${id}', '${email}', '${hash}') ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;`,
);
