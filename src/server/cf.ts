/**
 * Access to Cloudflare Workers bindings from server code.
 *
 * The worker entry (src/server.ts) stores the `env` it receives on every
 * fetch; server functions read it here. Structural types are declared locally
 * so client-side type checking never pulls in workers-types globals.
 */

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  /** Statements in one batch run as a single transaction. */
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(
    key: string,
  ): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
}

export interface CloudflareEnv {
  DB: D1Database;
  /** Poster image storage. Absent until R2 is enabled on the Academy's account. */
  IMAGES?: R2Bucket;
}

let currentEnv: CloudflareEnv | undefined;

export function setCloudflareEnv(env: unknown): void {
  if (env && typeof env === "object" && "DB" in env) {
    currentEnv = env as CloudflareEnv;
  }
}

/**
 * The nitro-built worker wrapper invokes the app as `fetch(request)` and
 * publishes bindings on `globalThis.__env__` instead of passing them through.
 * Prefer that; fall back to an env captured by setCloudflareEnv (direct
 * module-worker invocation, e.g. tests).
 */
function resolveEnv(): CloudflareEnv | undefined {
  const g = globalThis as { __env__?: unknown };
  if (g.__env__ && typeof g.__env__ === "object" && "DB" in g.__env__) {
    return g.__env__ as CloudflareEnv;
  }
  return currentEnv;
}

export function getDb(): D1Database {
  const env = resolveEnv();
  if (!env?.DB) {
    throw new Error(
      "D1 binding `DB` is not available. Run the site as a Cloudflare Worker (npm run preview:worker) — `vite dev` has no Cloudflare bindings.",
    );
  }
  return env.DB;
}

export function getImagesBucket(): R2Bucket | null {
  return resolveEnv()?.IMAGES ?? null;
}
