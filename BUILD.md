# BUILD.md

What was built, why it is shaped this way, what was measured, and what has **not** been verified. Written at the end of the build; numbers are from this repository as it stands.

## What exists

- Four disciplines, eleven lessons (Medicine 3, Mechatronics 4, Architecture 1, Software 3), all free.
- Screens: `/`, `/signin`, `/signup`, `/welcome`, `/home`, `/learn/[discipline]`, `/learn/[discipline]/[lesson]`, `/settings`, `/about`, a 404 page, an error page, and a "3D not available" fallback inside the stage.
- Email + password accounts (Better Auth) on Postgres (Drizzle), with server-side checked progress.
- A compile service that runs `arduino-cli`, and an AVR emulator that runs in a Web Worker.
- A Dockerfile, a Render blueprint, generated SQL migrations that apply on server start.

## Decisions

**One service.** Next.js App Router, standalone output, one Docker image. Pages, auth, progress and compile are all route handlers in the same app, so there is one thing to deploy and one place to look.

**Lessons are data.** A lesson is a typed record validated by Zod at load (`src/content/schema.ts`). A new lesson is one file plus one registry line. A new discipline is content, models and at most one adapter. `content.test.ts` enforces the wiring: every part id exists in its model, every model part has a card, every validator is registered.

**The semantic ID contract.** A part's `id` in a lesson is the glTF node name. That single rule is what lets the 3D stage, callouts, the parts list, the inspector and the practice checks all agree on what a thing is. Each model ships a `*.manifest.json` with camera, groups, layers and per-part camera and anchor, so the stage has no per-model code.

**Procedural models, no third-party assets.** Every model is built from code in `scripts/models/` and exported as GLB. There are no licences to attribute. The trade-off is that they are stylised teaching models, not scans, and the About page says so.

**Organic shapes are distance fields.** Bones, the skull, the skin, the brainstem and deep brain structures, the cerebellum and the cell's organelles are described as signed distance functions (`scripts/models/lib/sdf.ts`): primitives blended with a smooth minimum and carved with smooth subtraction, then meshed with surface nets and simplified with meshoptimizer to a triangle budget. This is what gives the skull real orbits and a nasal aperture, the pelvis an acetabulum and an obturator foramen, and the mitochondria visible cristae. One continuous surface can be cut into named parts by the same boundary functions that draw the seams (the skull's bones are cut along its sutures), so every seam a student sees is a real boundary.

**One layout for the model and the drawings.** The house's walls, openings and furniture live in `src/content/disciplines/architecture/house.ts`. The 3D model, the plan, the elevation and the section are all generated from it, so they cannot disagree.

**Every part names itself on touch.** Hovering or tapping any part draws a label out of the exact point touched (`src/engine/TouchLabel.tsx`), not just the few parts with always-on callouts. It is hidden while an identify round is being answered, because it would give the answer away.

**Rendering on demand.** `frameloop="demand"`: nothing draws while the scene is idle (0 fps), orbiting renders each frame. `cacheComponents` is off so old scenes cannot keep GPU contexts alive in the background.

**Validators are shared pure functions.** The browser runs them for live feedback; the server runs the same code before it records a completion. A snapshot holds facts (what was opened, answered, typed), never verdicts.

**The server re-derives evidence it can derive.** For mechatronics the client's emulator trace is discarded; the server compiles the submitted source, runs the real emulator with the lesson's own scripted inputs and judges that. For the software lessons the validators re-run the student's code from scratch. `src/server/progress.test.ts` includes a forged-trace case that must fail.

**The compile endpoint is treated as hostile input.** 16 KB source cap, include allowlist, one job at a time, 25 s hard timeout, a scrubbed environment for the child process, a per-job temp directory, sanitised output (no server paths), a SHA-256 keyed HEX cache and 10 compiles per minute per IP.

**The software lessons use a teaching CPU, not x86 or ARM.** Four 8-bit registers, 32 memory cells, 14 instructions, a 5000-step cap. The lesson says plainly that it is a teaching machine. The code a student writes is sent to the server only inside the completion snapshot, to be re-run.

**Progress stores outcomes, not work.** One row per student per lesson: the key, the time and which checks passed. Code and traces are not kept.

**Two database drivers behind one API.** A Neon URL uses Neon's HTTP driver; any other Postgres URL uses `pg`. That is what let the auth and progress flow be tested against a real Postgres here.

## Measured

Models (from the GLB files; draw calls are mesh primitives per node, counted statically rather than profiled in a browser):

| Scene | KB | Triangles | Draw calls |
| --- | ---: | ---: | ---: |
| medicine_skeleton | 886 | 149,162 | 39 |
| medicine_brain | 700 | 129,954 | 22 |
| medicine_cell | 731 | 124,388 | 20 |
| medicine_bone_section | 231 | 45,040 | 6 |
| architecture_house | 479 | 26,252 | 23 |
| mechatronics_button | 137 | 13,768 | 32 |
| mechatronics_blink | 122 | 11,888 | 27 |
| software_computer | 174 | 9,644 | 21 |
| mechatronics_breadboard | 77 | 7,840 | 12 |
| software_dram_cell | 50 | 4,308 | 6 |
| mechatronics_uno | 71 | 3,158 | 14 |
| software_memory | 30 | 1,968 | 5 |

All are under the budgets (1.5 MB per GLB, 150k triangles, 40 draw calls). The skeleton is at 39 of 40 draw calls and close to the triangle limit; anything added to it must be paid for elsewhere. The house and the motherboard use small generated textures (512 to 1024 px WebP), within the 1024 px mobile limit.

Code: 97 unit tests pass (6 files); `tsc` is clean; ESLint reports no errors. `next build` succeeds.

Server judging cost: re-running a 5-second blink sketch took about 1.6 s end to end, a button sketch about 0.5 s. The emulation runs on the request thread, so it blocks other requests while it runs. Submissions are limited to 20 a minute per student. If traffic grows, move the emulation into a `worker_thread`.

## Design refresh (light drafting-paper look)

- **Tokens.** Palette and type live in `src/app/globals.css`: paper `#f6eddd`, navy ink `#18213d`, teal for progress and completion, amber for live signals, Barlow (body) and Barlow Semi Condensed (headings, buttons, tabs). The 3D selection highlight stays orange (`--accent`) so it is visible on the teal board and the red muscles; teal and orange each have a `-strong` variant for text that passes 4.5:1.
- **Stage floor.** `src/engine/StageFloor.tsx` draws a real plane under every model (disc, teal ring, tick ring, shadow pad) from flat-shaded primitives, so the model reads as standing in space. No texture, no request.
- **Workspace.** Desktop is roadmap (left), model (centre), reference tabs and practice (right). The icon rail and the bottom lesson strip are gone; the roadmap panel lists lessons and parts. Phone keeps the bottom tab bar and sheet.
- **Model detail.** The Uno now carries its printed silkscreen (pin numbers with `~` on PWM pins, POWER, ANALOG IN, DIGITAL, RESET, ICSP, TX/RX/L/ON, ARDUINO UNO) as one 1024 px WebP; the breadboard prints column numbers, row letters and rail signs. Ribs are flat bands instead of round tubes and the sternum has a broad manubrium and a tapered body. The olfactory bulbs sit under the frontal lobe. Triangle counts did not change, so the skeleton stays inside its budget.
- **Connective tissue, labelled.** The skeleton's Connective layer is four named parts, each with its own card, callout and Parts-list entry: intervertebral discs, cartilage (costal, joint caps, menisci, shoulder labrum), ligaments (knee cruciates and collaterals, sacroiliac) and tendons (patellar, quadriceps, Achilles, biceps, forearm, linea alba). They replace the single merged `tissue_connective` node and cost three extra draw calls.
- **Brain interior.** The cut-away now sweeps to the true midline (`openTo: 0.5`). Cut faces are opaque and coloured per structure: cortex rim, cream white matter, then the corpus callosum, ventricle, thalamus, basal ganglia, hippocampus, amygdala and brainstem as the plane passes through them. Moving the slider reveals them one after another.
- Models are still procedural and original; the real photographs used while comparing were studied for proportion and detail only, not copied or traced.

## Not verified, said plainly

- **A real `arduino-cli` compile has not run.** The sandbox could not download it. The compile service is tested with a stub that returns HEX built with real `avr-gcc` (the emulator tests use those same fixtures). The Dockerfile pins arduino-cli 1.2.2 and the `arduino:avr` 1.8.6 core and installs them; that image has **not been built**. The first Render build is its first run. Expect to adjust the version pins if either is unavailable.
- **The Neon HTTP driver path is untested.** The `pg` path was exercised against Postgres 16. Both are Drizzle with the same schema.
- **No real phone was used.** Phone layouts were checked at mobile viewport sizes in headless Chrome with software rendering. The 60 fps orbit target is not measured on a device.
- **Draw calls were counted from the files, not profiled.**
- **Identify and explore completions can be forged.** They record what a student clicked and the server cannot derive that. Nothing depends on it in v1: no grades, no ranking.
- **Progress made while signed out stays in that browser.** It cannot be moved into an account because the server cannot re-derive its evidence.

## Known rough edges

- The skin over the shoulders is still a little square; it is translucent and only seen at the first peel step.
- The skull is a teaching model: the cranial base seen from below is simplified, and the sphenoid is shown only where its wings reach the surface.

- Architecture: the roof callout stays on screen when the section cut removes the roof.
- Brain: the frontal pole is slightly pinched.
- Skeleton, brain and cell are 100k+ triangles, the heaviest scenes. The Quality control in the rail has a battery setting.
- On short screens (about 760 px high) the blink and button scenes sit close to the toolbar.

## Left out of v1

- The phone minimap.
- Offline use. There is no service worker; a failed model load shows a retry message.
- Password reset and email verification (there is no mail provider).
- Connecting to Unity. Nothing is live-linked.
- Keeping the Render free tier awake. That is yours to set up.
