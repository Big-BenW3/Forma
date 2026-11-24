# Prompt for Claude Code: build the full test suite (with Docker), verify real services, then get FORMA ready for Render

Paste everything below the line into Claude Code, run from the repo root.

---

You are working in the FORMA repo (Next.js 16, standalone output, one Docker web service on Render, Neon Postgres, Better Auth, arduino-cli compile service, AVR8js, R3F models). Deployment target is **Render**; that is settled, do not suggest another host.

## Where the project stands (verified just now)

- `npm run check` (typecheck, lint, tests) passes: 17 test files, 168 tests. `npm run build` passes with no warnings.
- 4 disciplines, 11 lessons, light design implemented in the app. Models are procedural (`scripts/models/*.ts`, `npm run models`) and the budgets are enforced by tests: GLB under 1.5 MB, triangles under 150k, draw calls under 40, textures 1024 px. The skeleton is at 39 of 40 draw calls, so do not add parts to it.
- The skeleton has four named connective-tissue parts (discs, cartilage, ligaments, tendons). The brain cut-away reaches the midline and shows coloured interior structures.
- NEVER RUN against real services so far: Neon, Better Auth sign-in, the arduino-cli compile service, the Docker image (the Dockerfile has never been built), real-phone performance.
- There is no `.env` in the repo. Ask me for what you need; never print, log or commit secret values.

## Rules

- Read `README.md`, `BUILD.md`, `AGENTS.md` and `CLAUDE_TASKS.md` first. `CLAUDE_TASKS.md` is the phased plan for verifying the real services and writing the deployment guides; **do all of its phases (0 to 7) and its final report**, with the additions below.
- Keep the architecture: a new lesson is data only; validators are pure and shared by browser and server; the server re-derives evidence and ignores the client's trace; students only (no teacher view); wording is "Completed", not "verified"; no gradients.
- After every fix run `npm run check`. It must stay green.
- Do not change pinned versions without telling me why. Do not commit or push until I say so.
- Keep a running log in `VERIFY.md`: what you ran, what happened, what you changed.
- If a step is blocked, say exactly what you need from me and continue with the next step.

## Additions to CLAUDE_TASKS.md: the test suite (do this as "Phase T", right after Phase 0)

T1. **Docker Compose test stack.** Add `docker-compose.test.yml` with: `postgres:16` (throwaway, healthcheck), and the app built from the repo `Dockerfile`, wired to that Postgres via `DATABASE_URL` (non-Neon URL, so the `pg` driver path is exercised) and a test `BETTER_AUTH_SECRET` (32+ chars, generated at run time, not committed). The app waits for the database, runs `npm run db:migrate`, then serves on 10000. Add npm scripts: `test:stack:up`, `test:stack:down`, `test:e2e`, `test:all`.

T2. **API integration tests** (Vitest, run against the running stack, skipped with a clear message when the stack is not up): `/api/v1/config`; sign up, sign in, wrong password, duplicate email, short password, tampered cookie, sign out; `/api/v1/progress` save and read back and signed-out behaviour (`{saved:false, signedIn:false}`, GET `{keys:[], signedIn:false}`); `/api/v1/compile` with Blink (HEX returned, cached on second call, server-side judging passes while ignoring the client trace), a syntax error (readable message, no stack trace), source over 16 KB, an `#include` outside the allowlist, path tricks in `#include`, a runaway program killed at 25 s, two simultaneous jobs queued, rate limiting. Fail the suite if any response leaks a stack trace or a filesystem path.

T3. **End-to-end browser tests (Playwright)**, run against the stack, desktop (1440 x 900) and phone (390 x 844) projects:
  - Home loads; every discipline page loads; every one of the 11 lessons loads and the 3D canvas renders non-blank (screenshot pixel check, not just "element exists").
  - Desktop lesson layout: roadmap left, model centre, notes/tasks/code right. On phone: no horizontal overflow on any page (assert `scrollWidth <= clientWidth`) and the rail works.
  - The tab feature (Overview, Pinout or Structures, Example or Clinical, Specifications) switches content on every lesson.
  - Selecting a part from the Parts list, from a callout, and by tapping the model opens its card and highlights the part.
  - Skeleton: the Peel slider removes skin, muscle, then connective; the four connective parts (discs, cartilage, ligaments, tendons) appear in the Parts list and open their cards.
  - Brain: the cut-away slider opens a cut face; at about 0.8 the interior structures show; selecting the corpus callosum or a ventricle from the cut face works.
  - Blink an LED: write the Blink sketch in the editor, compile, run, the LED toggles, the task completes on the server. A broken sketch shows a readable error.
  - Sign up, complete a lesson, reload, progress is remembered; sign out shows the "Save progress" note and nothing breaks. With accounts off (no `DATABASE_URL`) no session request is made.
  - Accessibility smoke test with axe on home, one lesson per discipline, sign in and sign up: no serious or critical violations (list and fix what you find).
  - Save a screenshot of each lesson on both viewports to `test-results/` for me to look at.

T4. **Performance gates in CI form**: a script that measures first-visit transfer for each lesson at 390 x 844 with cache off and fails above 1.5 MB per lesson (home about 1 MB). Include the Slow 4G + 4x CPU numbers for the skeleton, cell, house and Blink lessons in the report; flag anything over 5 s.

T5. **GitHub Actions workflow** `.github/workflows/ci.yml`: on push and pull request, run `npm ci`, `npm run check`, `npm run build`, then bring up the compose test stack and run `test:e2e`. Cache npm and Playwright browsers. Upload `test-results/` and the Playwright report as artifacts. Do not require any secret; use generated test values.

T6. Make the whole thing runnable with one command from a clean clone (`npm run test:all`) and document it in `docs/TESTING.md`.

## Then: Phases 1 to 7 of CLAUDE_TASKS.md

Use the Compose stack for the Docker phases wherever it saves time, and the real Neon database (from `.env`, which I will provide) for Phase 1 and the production-shaped run in Phase 4. Write all the guides listed in Phase 7 into `docs/`, plus `docs/TESTING.md`. Remember the Render specifics: `render.yaml` is a Docker blueprint, `healthCheckPath` is `/api/v1/config`, `DATABASE_URL` and `BETTER_AUTH_URL` are set in the dashboard, `BETTER_AUTH_SECRET` is generated, and the first deploy is the first real build of this image, so the Render guide must include how to read a failed build and what to do if the build runs out of memory.

## Known things to check, not to assume

- The Dockerfile pins arduino-cli 1.2.2 and the AVR core 1.8.6 and downloads the installer from GitHub; it has never been run. If the install script or core download breaks, fix it and tell me.
- The Dockerfile copies `.next/standalone`, `.next/static`, `public`, `drizzle`; confirm migrations can run from the image or from a separate step on Render, and write down which one you chose and why.
- A three.js deprecation notice appears in the test output; it comes from a dependency loading three's CommonJS build. Find which one and either fix it or document it.
- Open items I will handle myself, do not invent them: the second team member in the proposal, the submission link and deadline, the keep-awake pinger.

## Final report

Give me: one page on what passed, what you fixed, what is still unverified or risky; the measured numbers (first-visit MB per lesson, compile time, image size, e2e run time); the exact list of files changed or added; and anything I must do by hand (Neon account, GitHub repo, Render dashboard values, DNS). Then stop and wait. Do not commit or push.
