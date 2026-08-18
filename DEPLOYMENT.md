# Production Deployment

This app runs on Vercel. Turso provides the production database. UploadThing
provides file storage. The Cloudflare Worker in `cloud-workspace-realtime`
provides meeting, call, and chat signaling.

## Live services

| Service | URL | Where it lives |
| --- | --- | --- |
| App (production) | `https://cloud-workspace-nine.vercel.app` | Vercel, git-linked to branch `dev` |
| Realtime worker | `https://cloud-workspace-realtime.samarth07nagar.workers.dev` | Cloudflare, repo `cloud-workspace-realtime` |
| Database | `libsql://cloud-workspace-samarth-na.aws-ap-south-1.turso.io` | Turso |
| Uploads | UploadThing (`UPLOADTHING_TOKEN`) | UploadThing |

There is no separate realtime service. Both `NEXT_PUBLIC_WS_URL` and
`NEXT_PUBLIC_REALTIME_URL` point at the Cloudflare Worker. Chat, meetings, and
calls all run on that Worker; the Worker persists chat messages into the same
Turso database the app uses.

## Vercel Project

1. The repository is linked to the project and deploys from branch `dev`.
2. Framework preset: Next.js. Root: repository root. Build command: `bun run build` (Vercel detects `bun.lock` and uses Bun). Output directory: default.
3. Do not run `bun run dev` on Vercel.
4. Apply database migrations to Turso before deploying app code that needs them.
5. `NEXT_PUBLIC_*` values are embedded at build time. Create a new deployment after changing them.

To deploy from the CLI instead of a push:

```bash
cd /home/samarth/dev/prod/cloud-workspace
vercel deploy --prod
```

The output lists a unique deployment URL and then `▲ Aliased` to the canonical
domain. Free tier: batch deploys — do not deploy per-commit. Pushing `dev`
after a CLI deploy triggers one extra automatic build of the same tree; that
is expected, not drift.

## Environment Variables

Set these on the Vercel dashboard (Production, and Preview/Development when
values differ). Use type **Sensitive** for every secret. Sensitive values
cannot be read back — `vercel env pull` returns the literal string
`[SENSITIVE]` for them, so verify them indirectly (browser login, worker
handshake) rather than by pulling.

```text
TURSO_DATABASE_URL=libsql://cloud-workspace-samarth-na.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=<from turso db tokens create>

BETTER_AUTH_SECRET=<long random string>
BETTER_AUTH_URL=https://cloud-workspace-nine.vercel.app
BETTER_AUTH_TRUSTED_ORIGINS=https://cloud-workspace-nine.vercel.app

GITHUB_CLIENT_ID=<optional>
GITHUB_CLIENT_SECRET=<optional>
GOOGLE_CLIENT_ID=<from Google Cloud console>
GOOGLE_CLIENT_SECRET=<from Google Cloud console>

UPLOADTHING_TOKEN=<from uploadthing app settings>
UPLOADTHING_CALLBACK_URL=https://cloud-workspace-nine.vercel.app/api/uploadthing

WS_AUTH_SECRET=<must match the worker's WS_AUTH_SECRET>
NEXT_PUBLIC_REALTIME_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev
NEXT_PUBLIC_WS_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev

ALLOW_PUBLIC_PREVIEW=false
```

Keep secrets server-side. Do not prefix secrets with `NEXT_PUBLIC_`.

Only `NEXT_PUBLIC_*` values are safe to read back. The current `NEXT_PUBLIC_*`
values on Production match the worker URL above.

A production build hard-fails when Vercel variables are missing or wrong:
`next.config.ts` requires `BETTER_AUTH_URL` (HTTPS), `NEXT_PUBLIC_REALTIME_URL`,
and `NEXT_PUBLIC_WS_URL` when `VERCEL=1` and `NODE_ENV=production`. Fix the
deployed values; never relax this guard.

## Database Release

The production schema comes from the committed `drizzle/` migrations. Apply
them to Turso before deploying app code that needs them:

```bash
cd /home/samarth/dev/prod/cloud-workspace
TURSO_DATABASE_URL=libsql://<db>.turso.io \
TURSO_AUTH_TOKEN=<token> \
bun run db:migrate
```

Rules:
- Commit new migrations with the code that needs them.
- Run migrations once, outside of requests. Do not run them from multiple Vercel instances.
- Do not use `db:push` for production. Do not use a `file:` database URL in Vercel.
- Use local `sqlite.db` for development; point `DATABASE_URL` there.

## UploadThing

Keep `/api/uploadthing` publicly reachable. UploadThing uses this route for
validation and callbacks. The route middleware performs application
authentication and workspace checks.

If Vercel Deployment Protection blocks UploadThing callbacks, make the
callback route public through the deployment protection exception or configure
the UploadThing callback bypass header.

The app does not proxy file bodies through Vercel. UploadThing receives the
file directly, which avoids the Vercel Function request body limit.

## Cloudflare Realtime

Deploy the Worker from the separate repository:

```bash
cd /home/samarth/dev/prod/cloud-workspace-realtime
bun run typecheck
bun run lint
bun run deploy
```

The Worker needs secrets. `WS_AUTH_SECRET` must equal the Vercel value.
`ALLOWED_ORIGINS` must include every browser origin that may connect
(localhost for local dev, plus the production domain):

```bash
printf 'https://cloud-workspace-nine.vercel.app' | bunx wrangler secret put ALLOWED_ORIGINS
# local dev additionally: http://localhost:3000
printf 'libsql://cloud-workspace-samarth-na.aws-ap-south-1.turso.io' | bunx wrangler secret put TURSO_DATABASE_URL
printf '<turso token>' | bunx wrangler secret put TURSO_AUTH_TOKEN
```

`TURSO_DATABASE_URL` is also set as a plain `[vars]` entry in `wrangler.toml`
(it is not secret). The chat handlers persist into the same Turso DB the app
uses; if the Worker's Turso credentials are wrong, chat connects but messages
silently do not persist and never broadcast the response frames.

Gotcha: Cloudflare keeps each Durable Object instance on the code that created
it for up to 30 days. After a breaking handler change, clients that reuse an
old room name hit the stale instance. The chat client currently joins
`?room=chat2`; if a change invalidates chat handlers again, bump that name or
run `delete_classes` + `new_sqlite_classes` migrations (as two separate
migrations — a single combined migration is rejected by Cloudflare, error
10074).

## Verification

Run these checks before each release:

```bash
cd /home/samarth/dev/prod/cloud-workspace
bun run lint
bunx tsc --noEmit
bun run build
```

Verify the deployed app is healthy. The health endpoint must return `200`
with `{"status":"ok","database":"ok"}`:

```bash
curl -s -i https://cloud-workspace-nine.vercel.app/api/health
```

Verify the Worker's WebSocket gate. HTTP/2 strips the `Upgrade` header, so
probes must use `--http1.1`:

```bash
TOKEN=<short-lived token from GET https://cloud-workspace-nine.vercel.app/api/realtime/token>
# valid token + production origin → 101
curl --http1.1 -s -o /dev/null -w "%{http_code}\n" \
  -H "Origin: https://cloud-workspace-nine.vercel.app" \
  -H "Upgrade: websocket" -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  "https://cloud-workspace-realtime.samarth07nagar.workers.dev/?room=chat2&token=$TOKEN"
# bad origin → 403, bad token → 401
```

`{"ok":true}` on the auth status endpoint and this handshake prove only that
the gate works. They do NOT prove chat or meetings work. The real verification
is behavioral: open the live site in a browser, send a message in a chat
thread, and confirm a second tab receives it while the socket is connected.
When chat falls back to REST + 5 s polling, messages still appear — that is
the fallback working, not the realtime path. Confirm the socket is connected
(no periodic refetches, typing indicators live) before calling realtime done.

Worker-only smoke test (in the worker repo): `scripts/ws-test.ts` against the
deployed URL:

```bash
cd /home/samarth/dev/prod/cloud-workspace-realtime
REALTIME_URL=wss://cloud-workspace-realtime.samarth07nagar.workers.dev \
bun scripts/ws-test.ts
```

## Local Development

Copy `.env.example` to `.env` and set local URLs there. Local SQLite and local
service URLs are development settings only. They are not production defaults.

- No Socket.IO exists anymore. Do not start a chat websocket process locally.
- For local realtime, run `wrangler dev` in `cloud-workspace-realtime` and
  point `NEXT_PUBLIC_REALTIME_URL`/`NEXT_PUBLIC_WS_URL` at
  `ws://localhost:8787` (origin `http://localhost:3000` must be in
  `ALLOWED_ORIGINS`). With no local socket, chat uses the REST fallback and
  still works.
- Do not create `.env.prod` or `.env.vercel` scratch files here.