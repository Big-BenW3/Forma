# FORMA

Browser-based 3D lessons. You take a thing apart, tap any part and it explains itself, then you prove it with a short practice.

Four disciplines, eleven lessons, everything free in v1:

| Discipline | Lessons |
| --- | --- |
| Medicine & Surgery | The cell (14 parts) · The skeleton, by layers (33 bones and bone groups, 3 tissue layers) · The brain (20 structures) |
| Mechatronics | Meet the board · The breadboard · Blink an LED · Push a button |
| Architecture | Examine a house (3D model, plan, elevation and section from one layout) |
| Software Engineering | What makes up a computer · Memory · Your first program |

Mechatronics sketches are compiled by a real `arduino-cli` on the server and run on an emulated ATmega328P in the browser. Software's first program runs on a small teaching CPU in the browser.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

With no environment variables everything works except **accounts** (sign in, saved progress) and **Compile & run** (needs `arduino-cli`). Progress is then kept in the browser.

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | accounts | Neon URL uses Neon's HTTP driver; any other Postgres URL uses `pg`. |
| `BETTER_AUTH_SECRET` | accounts | 32+ random characters. |
| `BETTER_AUTH_URL` | accounts | Public origin, e.g. `https://forma.onrender.com`. |
| `ARDUINO_CLI_BIN` | compile | Path to `arduino-cli`. Defaults to `arduino-cli` on `PATH`. A test stub is in `src/server/__stubs__/`. |
| `ARDUINO_HOME` | compile | Home directory holding `.arduino15` with the `arduino:avr` core. |

Accounts need both `DATABASE_URL` and `BETTER_AUTH_SECRET`; without them the sign-in links disappear and `/api/auth/*` answers 503. The schema is applied automatically when the server starts. `npm run db:generate` makes a new migration after you change `src/server/db/schema.ts`.

## Commands

```bash
npm run check          # typecheck + lint + all tests (run this before pushing)
npm test               # vitest: logic tests (*.test.ts) and UI tests (*.test.tsx, jsdom)
npm run lint
npm run typecheck
npm run build          # also copies Monaco into public/ (prebuild)
npm run models         # regenerates every 3D model and manifest in public/models
```

Logic tests cover the validators, content and model parity, the teaching CPU, the AVR emulator, the compile guard, server-side judging, the distance-field modeller, the skull's bone boundaries, the house layout and camera framing. UI tests render real components in jsdom with Testing Library and drive them like a user: the floor plan and drawings, the Find it practice, sign-in and accounts, the 3D fallback, and the welcome and 404 pages. They do not render WebGL; there are no end-to-end browser tests.

## Adding things

**A lesson** is one data file. Write `src/content/disciplines/<discipline>/lessons/<id>.ts` (copy a neighbour), add it to that discipline's `lessonIds`, and add one import and one entry in `src/content/registry.ts`. Pages, cards, navigation, the rail and the content tests read the registry. `content.test.ts` fails if a part id is not in the model, a model part has no card, or a validator is not registered.

**A discipline** is content plus models plus at most one adapter: its record in `src/content/disciplines/<id>/discipline.ts`, GLB models from `scripts/models/`, and an adapter in `src/disciplines/<id>/` only if it needs custom behaviour (extra toolbar, a practice that is not "identify"). Register the adapter in `src/disciplines/registry.ts`. The generic adapter covers a discipline that only needs part cards and identification.

**A model** is a script in `scripts/models/<discipline>_<name>.ts`. Organic shapes are easiest as distance fields with `scripts/models/lib/sdf.ts` (see `lib/skull.ts`, `lib/bones.ts`, `lib/brainParts.ts`, `lib/cellParts.ts` for worked examples). The contract is that a part's `id` in the lesson file is the glTF node name. `npm run models` writes `<scene>.glb` and `<scene>.manifest.json` (camera, groups, layers, bounds, per-part camera and callout anchor).

**A validator** is a pure function `(lesson, snapshot) -> verdict` in `src/validators/`, registered in `src/validators/index.ts`. The browser uses it for live feedback and the server runs the identical function before recording a completion.

## Layout

```
src/app/                 routes: /, /home, /learn/..., /signin, /signup, /welcome, /settings, /about, /api/...
src/components/          site chrome and the workspace (rail, context panel, lesson strip)
src/engine/              the shared 3D stage: canvas, camera rig, semantic scene, callouts, cut-away
src/disciplines/         per-discipline adapters (toolbar, practice UI, scene extras)
src/content/             schema (Zod) and every discipline and lesson record
src/validators/          pure completion checks shared by browser and server
src/lib/teachisa/        the teaching CPU (assembler + machine)
src/lib/emulator/        AVR8js wrapper, HEX parser, worker, client
src/server/              auth, database, compile service, server-side judging
scripts/models/          procedural 3D model generators
drizzle/                 generated SQL migrations
```

## Brand

The mark is an isometric block with its nearest corner cut away, the cut faces in the accent orange. It lives as paths in `src/components/brand/Logo.tsx` (`LogoMark`, `Wordmark`); `npx tsx scripts/brand.ts` regenerates the files in `public/brand/` and the favicon and home-screen icon in `src/app/` from those same paths.

## Deploy (Render)

`Dockerfile` builds one image: Next.js standalone server plus `arduino-cli` and the `arduino:avr` core. `render.yaml` is a blueprint for a single Docker web service. Set `DATABASE_URL` and `BETTER_AUTH_URL` in the dashboard; `BETTER_AUTH_SECRET` is generated. Health check path: `/api/v1/config`.

The free tier sleeps when idle. Keeping it warm is left to you (an external pinger).

See `BUILD.md` for decisions, measured numbers and what is not verified.
