# The Remsenburg Academy — remsenburgacademy.org

Public website and events admin for The Remsenburg Academy Association, Inc.,
a 501(c)(3) nonprofit operating the historic 1863 schoolhouse in
Remsenburg, NY. Built pro bono by [Workbench Websites](https://workbenchwebsites.com/).

## Architecture

- **Frontend/SSR**: TanStack Start (React 19), Tailwind CSS v4, shadcn/ui.
  Public pages are server-rendered; event data is loaded in route loaders.
- **Runtime**: Cloudflare Workers. The build (`vite build`, via nitro) emits a
  worker to `.output/server/` and static assets to `.output/public/`.
- **Database**: Cloudflare D1 (SQLite). Schema and seed data live in
  `migrations/`.
- **Auth**: email/password admin accounts (no sign-up). PBKDF2-SHA256 password
  hashes and hashed session tokens in D1; HttpOnly/Secure/SameSite=Lax cookie;
  sign-in throttling after repeated failures. See `src/server/auth.ts`.
- **Images**: site photography is committed under `public/images/`. Admin
  poster uploads go to R2 via the `IMAGES` binding (dormant until R2 is
  enabled on the production account — uploads explain themselves until then).

The build config extends `@lovable.dev/vite-tanstack-config` (the site was
prototyped in Lovable); it pins the TanStack/nitro/Cloudflare wiring and is
the supported way to build this project.

## Development

```sh
npm install
npm run preview:worker   # build + wrangler dev (local D1, real bindings)
```

`vite dev` runs the UI without Cloudflare bindings, so anything touching the
database fails there — use `preview:worker` for full-stack work.

First-time local database:

```sh
npx wrangler d1 migrations apply remsenburg-academy --local
node scripts/hash-password.mjs you@example.org   # prints password + INSERT
npx wrangler d1 execute remsenburg-academy --local --command "<the INSERT>"
```

Checks: `npm run typecheck`, `npm test`, `npm run lint`.

## Deployment

```sh
npm run deploy   # vite build + wrangler deploy
```

`wrangler.jsonc` targets the **development** Cloudflare account today. To move
production to the Academy's own account:

1. In the new account: create a D1 database named `remsenburg-academy`, then
   `npx wrangler d1 migrations apply remsenburg-academy --remote`.
2. Replace `database_id` in `wrangler.jsonc` with the new database's id.
3. Enable R2, create bucket `remsenburg-academy-images`, and uncomment the
   `r2_buckets` block in `wrangler.jsonc`.
4. Provision admin accounts with `scripts/hash-password.mjs` (use `--remote`
   for the execute step) and deliver each password to its owner privately.
5. `npm run deploy`, then attach the custom domain to the worker in the
   Cloudflare dashboard and update DNS. **Recreate the Microsoft 365 MX/SPF
   records before switching nameservers** — email must not depend on the web
   cutover.

## Content model

One event has many dates (`events` ← `event_dates`): a six-day exhibit is a
single admin entry with six date rows. "Upcoming vs past" is computed against
the calendar date in America/New_York (`src/lib/event-format.ts`). The event
category controls placement: Art Exhibit / Art Reception events also appear
on the ArtRemsenburg page.

Admins also manage the committee roster shown on the Contact page
(`committee_members` — elected officers and members change over time) and the
public photo gallery (`gallery_photos` — captions, ordering, and uploads once
R2 is enabled). Both live under the admin's Photos and Committee tabs.
