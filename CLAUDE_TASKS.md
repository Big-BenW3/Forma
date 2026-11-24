# FORMA: tasks for Claude Code (real services, then deployment guides)

You are working in the FORMA repo. It is a Next.js 16 app (standalone, one Docker service on Render) with 4 disciplines and 11 lessons. Everything below the unit-test level was built in a sandbox with no network, so **these parts have never run against real services**: the Neon database, Better Auth sign-in, the arduino-cli compile service, and the Docker image.

Your job: prove each of them works, fix what breaks, then write deployment guides.

## Rules

- Read `README.md`, `BUILD.md` and `AGENTS.md` first.
- Secrets live only in `.env` (git-ignored). Never print, log or commit them. Never paste their values into a doc, a test or a commit message.
- After every fix, run `npm run check` (typecheck, lint, tests). It must stay green.
- Keep the architecture: a new lesson is data only; validators are pure and shared by browser and server; the server re-derives evidence and ignores the client's trace.
- Keep the phone budget: models under 1.5 MB, under 150k triangles, under 40 draw calls, 1024 px textures, 0 fps when idle.
- Do not commit or push until I say so. Do not change pinned versions without telling me why.
- Keep a running log in `VERIFY.md`: for each step, what you ran, what happened, what you changed.
- If a step is blocked (missing tool, no network, bad credential), say exactly what you need from me and continue with the next step.

## Phase 0: environment check

1. Confirm Node 22+, npm, and Docker. Report versions.
2. Confirm `.env` exists and has `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ chars) and `BETTER_AUTH_URL`. Check shape only (never print values): the URL ends with `?sslmode=require`, and the secret length is at least 32.
3. `npm ci`, then `npm run check`. Everything must pass before you touch anything else (expected: typecheck clean, lint clean, 168 tests passing).

## Phase 1: database (Neon)

4. Run `npm run db:migrate` against the real database (`scripts/migrate.mjs`, schema in `drizzle/`). Confirm the tables exist (users, sessions, accounts, verifications, progress).
5. Run it a second time. It must be idempotent (no error, no duplicate objects).
6. Check the dual driver: with a `neon.tech` URL the Neon HTTP driver must be used (`src/server/db/index.ts`, `isNeonUrl`); test the `pg` path as well, with `DB_DRIVER` unset against a non-Neon Postgres (local Docker `postgres:16` is fine). Fix anything that differs between them.
7. Write one integration test (skipped when `DATABASE_URL` is missing) that writes and reads a progress row and cleans up after itself.

## Phase 2: accounts and progress (Better Auth)

8. Start the app with `npm run dev`. Confirm `/api/v1/config` reports accounts on.
9. Exercise the real flow with curl or a small script: sign up with email and password, sign in, call `/api/v1/progress` with the session cookie, save a lesson result, read it back, sign out, and confirm the signed-out response is `200` with `{saved:false, signedIn:false}` (progress GET returns `{keys:[], signedIn:false}`).
10. Check the failure cases: wrong password, duplicate email, short password, tampered cookie, a missing `BETTER_AUTH_SECRET` (app should fall back to accounts off, not crash).
11. In a browser (Playwright is fine, or just describe what you see): sign up, sign in, complete a lesson, reload, confirm progress is remembered; sign out, confirm the "Save progress" note shows and nothing breaks. Confirm no session request is made when accounts are off.

## Phase 3: the compile service (arduino-cli)

12. Install `arduino-cli` locally (the Dockerfile pins 1.2.2) and the AVR core `arduino:avr@1.8.6`. If you cannot install it, skip to step 16 and test it inside Docker.
13. Hit the compile endpoint with the Blink sketch. Confirm a HEX comes back, the run is cached on a second call, and AVR8js runs that HEX and toggles pin 13 (the "blink an LED" validator should pass **on the server**, with the client trace ignored).
14. Test the guards in `src/server/compile.ts`: source over 16 KB is rejected; an `#include` outside the allowlist is rejected; a program that never finishes is killed at 25 s; two simultaneous jobs queue (1 at a time); rate limiting kicks in; a syntax error returns a readable message, not a stack trace.
15. Attack it a little: try path tricks in `#include`, a huge file, binary junk, repeated requests. Confirm nothing escapes the temp directory and the process is not left running. Report anything you find and fix it.
16. Check cold-start time and the time to compile Blink. Report it; if it is over about 8 s warm, say why and propose a fix.

## Phase 4: the Docker image

17. `docker build -t forma .` The Dockerfile has never been built. Fix whatever breaks (arduino-cli install script, core install, file ownership, standalone output, the `public` and `drizzle` copies).
18. Run it with the `.env` values: `docker run --rm -p 10000:10000 --env-file .env -e BETTER_AUTH_URL=http://localhost:10000 forma`.
19. Against the container, repeat the checks from phases 2 and 3: `/api/v1/config`, sign up and sign in, a compile, and the progress round trip.
20. Check the image size and that it runs as the non-root user `app`. Check that no secret is baked into any layer (`docker history`).

## Phase 5: real-device performance

21. Build for production (`npm run build`), start it (`npm start`), and measure the first-visit download for each of the 11 lessons with a mobile viewport (390 x 844) and cache disabled. Targets: each lesson at or under 1.5 MB, home page about 1 MB or less. Report a table.
22. Check each model against the budgets: GLB under 1.5 MB, triangles under 150k, draw calls under 40. `npm test` already encodes these, so confirm they still pass after any change you made.
23. Throttle to "Slow 4G" and a 4x CPU slowdown. Report time to first interaction on the skeleton, cell, house and Blink-an-LED lessons. Flag anything over 5 s.
24. Confirm idle rendering is 0 fps (`frameloop="demand"`), and that touch-to-label still works on a touch-emulated viewport.

## Phase 6: security and hardening pass

25. Review every `/api/v1/*` route: input validated with Zod, auth required where it should be, no stack traces in errors, sensible status codes.
26. Check headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protection) and cookie flags (`HttpOnly`, `Secure` in production, `SameSite`). Add what is missing.
27. Check rate limiting on sign-in, sign-up and compile. Check the compile service cannot be used to read files or reach the network.
28. Run `npm audit --omit=dev`. Report anything high or critical, and fix what can be fixed safely.

## Phase 7: deployment guides (the final deliverable)

Write these into a `docs/` folder. Write for someone who has never deployed before: numbered steps, exact values to enter, what success looks like, and what to do if it fails. Use only what you actually verified in phases 0 to 6; mark anything you could not test as "not verified".

29. `docs/DEPLOY_RENDER.md`: the main path (the repo has a `render.yaml` blueprint and a Docker runtime). Cover: pushing the repo to GitHub; creating the service from the blueprint; every environment variable and where to get it (`DATABASE_URL` from Neon, `BETTER_AUTH_SECRET` generation, `BETTER_AUTH_URL` as the final public origin); running the migration against production; the health check path (`/api/v1/config`); the first deploy; a post-deploy checklist (home loads, a lesson loads, sign up works, a Blink compile works); custom domain and HTTPS.
30. `docs/DEPLOY_NEON.md`: creating the Neon project, the connection string (pooled vs direct, and which to use for migrations vs the app), `sslmode=require`, branching for staging, and backups.
31. `docs/DEPLOY_LOCAL_DOCKER.md`: running the exact production image on a laptop, with `.env` and a throwaway local Postgres.
32. `docs/ENVIRONMENT.md`: a table of every variable (name, required or optional, example shape, what breaks without it).
33. `docs/OPERATIONS.md`: keeping the free-tier Render service awake (the pinger is handled separately by me; just document that cold starts happen and how long they take), reading logs, rotating `BETTER_AUTH_SECRET` (and what it logs users out of), rotating the database password, restoring from a Neon backup, updating arduino-cli or the AVR core, and rolling back a bad deploy.
34. `docs/ADDING_A_LESSON.md`: the data-only workflow (model with part ids, lesson file, the automated checks, going live), using one real lesson as the worked example.
35. `docs/TROUBLESHOOTING.md`: the problems you actually hit during this work, with the fix for each, plus the likely ones (migration fails, `Invalid origin` on sign-in, compile returns 500, blank 3D canvas on an old phone, Render build runs out of memory).
36. Update `README.md` so it links to all of the above and its "status" section matches reality (what is now verified, what is not).

## Final report

When everything is done, give me:
- A one-page summary: what passed, what you fixed, what is still unverified or risky.
- The measured numbers: first-visit MB per lesson, compile time, image size.
- The exact list of files you changed or added.
- Anything I must do by hand (accounts, DNS, secrets in the Render dashboard).

Then stop and wait. Do not commit or push.
