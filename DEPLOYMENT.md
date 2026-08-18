# Production Deployment

This app runs on Vercel. Turso provides the production database. UploadThing
provides file storage. The Cloudflare Worker in `cloud-workspace-realtime`
provides meeting, call, and chat signaling.

## Vercel Project

1. Import the repository into Vercel.
2. Select the **Next.js** framework preset.
3. Set the project root to this repository.
4. Use `bun run build` as the build command.
5. Do not run `bun run dev` on Vercel.
6. Deploy only after applying database migrations.

Vercel detects `bun.lock` and uses Bun for the build. `NEXT_PUBLIC_*` values
are embedded during the build. Create a new deployment after changing them.

## Environment Variables

Set these variables in Vercel Project Settings. Set them separately for
Production, Preview, and Development when the values differ.

```text
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://app.example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

UPLOADTHING_TOKEN=...
UPLOADTHING_CALLBACK_URL=https://app.example.com/api/uploadthing

WS_AUTH_SECRET=...
NEXT_PUBLIC_REALTIME_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev
NEXT_PUBLIC_WS_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev
ALLOW_PUBLIC_PREVIEW=false
```

Keep secrets server-side. Do not prefix secrets with `NEXT_PUBLIC_`.

`NEXT_PUBLIC_WS_URL` and `NEXT_PUBLIC_REALTIME_URL` both point to the
Cloudflare Worker. Chat, meetings, and calls all run on that Worker. The
Worker persists chat messages into the same Turso database (see the Worker
secrets below).

## Database Release

Apply migrations to Turso before the Vercel deployment:

```bash
TURSO_DATABASE_URL=libsql://... \
TURSO_AUTH_TOKEN=... \
bun run db:migrate
```

Do not run migrations inside a request or from multiple Vercel instances.
Do not use `db:push` for a production release. Do not use a `file:` database
URL in Vercel.

## UploadThing

Keep `/api/uploadthing` publicly reachable. UploadThing uses this route for
validation and callbacks. The file route middleware performs application
authentication and workspace checks.

If Vercel Deployment Protection blocks UploadThing callbacks, make the
callback route public through the deployment protection exception or configure
the UploadThing callback bypass header.

The app does not proxy file bodies through Vercel. UploadThing receives the
file directly, which avoids the Vercel Function request body limit.

## Cloudflare Realtime

Deploy the Worker from the separate repository:

```bash
cd ../cloud-workspace-realtime
bun run typecheck
bun run lint
bun run deploy
```

Set `WS_AUTH_SECRET` to the same value in Vercel and Cloudflare. Set
`ALLOWED_ORIGINS` to the exact Vercel application origins:

```bash
printf 'https://app.example.com' | bunx wrangler secret put ALLOWED_ORIGINS
```

Set the Worker database secrets to the same Turso database the app uses:

```bash
printf 'libsql://...' | bunx wrangler secret put TURSO_DATABASE_URL
printf '...' | bunx wrangler secret put TURSO_AUTH_TOKEN
```

Use `wss://` in production. The Worker rejects unlisted browser origins.

## Verification

Run the checks before each release:

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

Verify the deployed health endpoint:

```bash
curl -i https://app.example.com/api/health
```

The endpoint must return `200` and `{"status":"ok","database":"ok"}`.
It sends `Cache-Control: no-store` and does not return secrets.

Verify the deployed realtime Worker:

```bash
cd ../cloud-workspace-realtime
REALTIME_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev \
bun scripts/ws-test.ts
```

## Local Development

Copy `.env.example` to `.env` and set local URLs there. Local SQLite and local
service URLs are development settings only. They are not production defaults.
