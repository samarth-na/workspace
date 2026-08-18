# Handoff — Cloud Workspace production

Date: August 18, 2026. This document tells the next human or AI session what
was done, what is verified, what is NOT yet verified, and what to do next.

## 1. What was done (recent commits)

App repo — `cloud-workspace`, branch `dev` (ahead of origin — push first):

| Commit | Change |
| --- | --- |
| `534aecc` | Point `NEXT_PUBLIC_WS_URL` at the realtime worker |
| `8448d78` | Migrate chat realtime from Socket.IO to the Cloudflare Worker (native WebSocket client; deleted `ws/server.ts`, socket.io deps, docker-compose `ws` service) |
| `cf152ac` | Use `chat2` room to escape a stale Cloudflare DO instance |
| `bcdd083` (docs) | Add fix-and-ship workflow + Vercel CLI usage to production report |
| (pending) | This commit: completed AGENTS.md + DEPLOYMENT.md + HANDOFF.md |

Worker repo — `cloud-workspace-realtime`, branch `main` (pushed):

| Commit | Change |
| --- | --- |
| `da0806f` | Real chat on the worker: persistence to Turso + `message:send` / `reaction:toggle` / `typing` handlers; `@libsql/client` |

## 2. Current deployed state

- App: `https://cloud-workspace-nine.vercel.app` — deployed via `vercel deploy
  --prod` from the current tree. The GitHub-linked project will rebuild the
  same tree when `dev` is pushed.
- Worker: `https://cloud-workspace-realtime.samarth07nagar.workers.dev` —
  deployed with `TURSO_AUTH_TOKEN` secret set.
- Realtime is the Worker ONLY. There is no Socket.IO anywhere.

## 3. Verified (with evidence)

- Chat realtime round-trip on the live site: socket connects to `?room=chat2`,
  `chat:join` + `message:send` frames, server replies `message:new` +
  `message:sent` + `conversations:changed`; message persisted in Turso and
  survived reload.
- Cross-client broadcast: a second socket in the same conversation received
  the first socket's `message:new`.
- Reactions: `reaction:toggle` → Turso write → `reaction:update` broadcast with
  correct aggregation.
- Worker auth/origin gates: bad token `401`, valid token `101`, wrong/missing
  origin `403` (curl over `--http1.1` — HTTP/2 strips the Upgrade header).
- Pages render without app errors: `/home`, `/messages`, `/calls`, `/meetings`,
  `/files`. Only console noise is PostHog scripts blocked by the ad blocker.
- Static: `bunx tsc --noEmit`, `bun run lint`, `bun run build`, worker
  typecheck + biome — all green.

## 4. NOT yet verified (do these next)

1. Signed-out login. The test browser already had a session. From a fresh tab:
   - Google OAuth login reaches the workspace.
   - Demo-account login works if demo users exist in the Turso DB.
   This directly exercises `BETTER_AUTH_URL` + trusted origins — the original
   "invalid origin" failure.
2. Meetings/calls WebRTC end-to-end (two peers, media flowing). Worker
   handlers are untouched by this work; earlier sessions verified them, but a
   two-browser test is the only complete proof.
3. Cross-user typing indicator UI (broadcast path proven at the wire level).

## 5. Immediate actions

1. `cd /home/samarth/dev/prod/cloud-workspace && git push origin dev`
   (Vercel will rebuild the same tree — expected, not drift).
2. Re-run the signed-out login checks above.
3. If any `NEXT_PUBLIC_*` value must change, change it on the Vercel dashboard
   and redeploy; values are inlined at build time.

## 6. Service map and where credentials live

| Secret/Var | Where set | Notes |
| --- | --- | --- |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, OAuth pairs, UploadThing, Turso | Vercel dashboard (Sensitive type) | Cannot be read back; verify indirectly |
| `WS_AUTH_SECRET` | Vercel AND worker `wrangler secret` / repo `.dev.vars` | Must match both sides |
| `ALLOWED_ORIGINS` | Worker `wrangler secret` | Must include the production origin |
| `TURSO_DATABASE_URL` | Vercel + worker `[vars]` + `.dev.vars` | Not secret |
| `TURSO_AUTH_TOKEN` | Vercel + worker `wrangler secret` + `.dev.vars` | Same DB the app reads |

Local `.env` (gitignored) holds working copies for dev. Full list in
`DEPLOYMENT.md` → Environment Variables.

## 7. Gotchas worth remembering

- **DO staleness.** Cloudflare keeps a Durable Object instance on the code it
  was created with for up to 30 days. A freshly deployed worker can look
  "silent" (connects, drops all events) for an old room name. Bump the room
  name (`chat2` precedent) or run the two-step `delete_classes` +
  `new_sqlite_classes` migration pair (a single combined migration is rejected,
  error 10074).
- **Sensitive env vars are unreadable.** `vercel env pull` returns literal
  `[SENSITIVE]`. Never save a pulled file back into the repo as `.env.vercel`.
  Never create `.env.prod`.
- **curl + WebSockets.** Use `--http1.1`; a 2xx/`{"ok":true}` probe proves
  only that a gate passes, not that chat/meetings work. Verify in a browser
  with a `window.WebSocket` instrumentation script.
- **REST fallback masks realtime.** If chat works but via 5 s polling, the
  socket is dead. Watch for `message:sent`/`message:new` frames, not just "the
  message appeared".
- **Fix deployed values, never the guard.** `next.config.ts` enforces HTTPS
  production URLs. Keep it that way.

## 8. Background / why this pass existed

A full investigation (session history, git log, live probes, instrumented
browser tests) concluded that prior "production ready" passes treated the
local environment as production truth: localhost env values were copied up to
Vercel, the build guard was relaxed to allow localhost, and chat realtime
(client spoke Socket.IO; only a local process spoke Socket.IO) silently fell
back to REST polling in production. Full detail: `PRODUCTION_REPORT.html` in
this repo.