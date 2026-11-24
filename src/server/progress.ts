/**
 * Server-side judging of a completion.
 *
 * The browser sends a snapshot of FACTS (what was opened, answered, typed). This
 * module decides whether those facts really amount to a completed lesson, and it
 * never trusts a fact the server can derive for itself:
 *
 *  - Mechatronics: the browser's emulator trace is DISCARDED. The server compiles
 *    the submitted source, runs the real emulator with the lesson's own scripted
 *    inputs and builds the trace itself, then hands that to the same validator the
 *    browser uses (src/validators/mechatronics.ts).
 *  - Software (teaching ISA) and memory lab: the validators are pure functions of the
 *    code / operations, so the same call here re-runs them from scratch.
 *  - Identify / explore: these record what the student clicked. A determined student
 *    could forge that, but nothing is gained by it: progress is for their own
 *    benefit, there are no grades or rankings in v1.
 *
 * `judge` has no database in it so it can be unit tested; the route stores the result.
 */
import { z } from "zod";
import { getLesson } from "@/content/registry";
import { runEmulation, type InputEvent } from "@/lib/emulator/core";
import { runValidator, type Snapshot, type Verdict } from "@/validators";
import { compileSketch, type CompileResult } from "./compile";

/** Validators whose evidence is an emulator trace the server must produce itself. */
const TRACE_VALIDATORS = new Set(["blink_led", "button_led"]);

/** Hard ceiling on a submitted snapshot, in bytes of JSON. */
export const MAX_SNAPSHOT_BYTES = 64 * 1024;

const SnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  lessonKey: z.string().max(120),
  examined: z.array(z.string().max(80)).max(200),
  answers: z.record(z.string().max(40), z.object({ partId: z.string().max(80), attempts: z.number().int().min(0).max(1000) })).optional(),
  code: z.string().max(16 * 1024).optional(),
  facts: z.record(z.string(), z.unknown()).optional(),
});

export type JudgeResult =
  | { ok: true; verdict: Verdict; lessonKey: string }
  | { ok: false; status: 400 | 404 | 413 | 422 | 503; message: string };

export interface JudgeDeps {
  compile?: (source: unknown) => Promise<CompileResult>;
}

export async function judge(body: unknown, deps: JudgeDeps = {}): Promise<JudgeResult> {
  if (JSON.stringify(body ?? null).length > MAX_SNAPSHOT_BYTES) return { ok: false, status: 413, message: "That submission is too large." };

  const parsed = z.object({ lessonKey: z.string(), snapshot: SnapshotSchema }).safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, message: "That submission is not valid." };
  const { lessonKey, snapshot } = parsed.data;
  if (snapshot.lessonKey !== lessonKey) return { ok: false, status: 400, message: "That submission is not valid." };

  const [disciplineId, lessonId] = lessonKey.split("/");
  const lesson = disciplineId && lessonId ? getLesson(disciplineId, lessonId) : undefined;
  if (!lesson) return { ok: false, status: 404, message: "Unknown lesson." };

  let facts: Snapshot["facts"] = snapshot.facts;

  if (TRACE_VALIDATORS.has(lesson.practice.validator)) {
    // Throw away whatever trace the client sent; build our own.
    const compile = deps.compile ?? ((s: unknown) => compileSketch(s));
    const built = await compile(snapshot.code ?? "");
    if (!built.ok) {
      // A compile failure is the student's code failing, except when the toolchain itself is down.
      if (built.status === 503 || built.status === 504) return { ok: false, status: 503, message: "The compiler is busy. Try again in a moment." };
      return { ok: false, status: 422, message: "The sketch does not compile." };
    }
    const params = lesson.practice.params as { durationMs?: number; script?: InputEvent[] };
    const durationMs = Math.min(Math.max(Number(params.durationMs) || 5000, 100), 10_000);
    const run = runEmulation(built.hex, { durationMs, inputs: params.script ?? [] });
    facts = { trace: run.events };
  }

  const verdict = runValidator(lesson, { ...snapshot, facts });
  if (!verdict.passed) return { ok: false, status: 422, message: "The checks did not pass." };
  return { ok: true, verdict, lessonKey };
}
