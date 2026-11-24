/**
 * Server judging: the server must reach its own verdict from facts it can derive,
 * not from what the client says. The compiler is replaced by a function returning
 * HEX that was built once with real avr-gcc (src/lib/emulator/fixtures).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLesson } from "@/content/registry";
import { judge, MAX_SNAPSHOT_BYTES } from "./progress";
import type { CompileResult } from "./compile";

const hex = (name: string) => readFileSync(path.join(process.cwd(), "src/lib/emulator/fixtures", `${name}.hex`), "utf8");
const compileTo = (name: string) => async (): Promise<CompileResult> => ({ ok: true, hex: hex(name), cached: false });
const snap = (lessonKey: string, extra: Record<string, unknown> = {}) => ({ lessonKey, snapshot: { schemaVersion: 1, lessonKey, examined: [], ...extra } });

describe("judge: request checks", () => {
  it("rejects malformed bodies, mismatched keys and unknown lessons", async () => {
    expect((await judge(null)).ok).toBe(false);
    expect((await judge({ lessonKey: "x" })) as { status: number }).toMatchObject({ status: 400 });
    expect(await judge({ lessonKey: "medicine/the_cell", snapshot: { ...snap("medicine/the_brain").snapshot } })).toMatchObject({ status: 400 });
    expect(await judge(snap("medicine/nope"))).toMatchObject({ status: 404 });
  });

  it("rejects an oversized submission", async () => {
    const big = snap("software/your_first_program", { code: "x".repeat(MAX_SNAPSHOT_BYTES) });
    expect(await judge(big)).toMatchObject({ status: 413 });
  });
});

describe("judge: software lesson re-runs the code itself", () => {
  const key = "software/your_first_program";
  it("accepts the real solution", async () => {
    const solution = getLesson("software", "your_first_program")!.options.solution as string;
    expect((await judge(snap(key, { code: solution }))).ok).toBe(true);
  });
  it("rejects code that does not print 15", async () => {
    expect(await judge(snap(key, { code: "LOAD A, 3\nOUT A\nHALT" }))).toMatchObject({ ok: false, status: 422 });
  });
  it("ignores a claimed verdict smuggled into facts", async () => {
    expect(await judge(snap(key, { code: "HALT", facts: { passed: true, output: "15\n" } }))).toMatchObject({ ok: false, status: 422 });
  });
});

describe("judge: mechatronics builds its own trace", () => {
  // A trace a cheater might send for a sketch that never blinks.
  const forgedBlink = Array.from({ length: 20 }, (_, i) => ({ t: 100 + i * 500, pin: 13, value: (i + 1) % 2 }));

  it("accepts a blinking sketch (trace made by the server)", async () => {
    expect((await judge(snap("mechatronics/blink_an_led", { code: "// blink" }), { compile: compileTo("blink") })).ok).toBe(true);
  });
  it("rejects when the compiled program does not blink, whatever trace the client claims", async () => {
    const r = await judge(snap("mechatronics/blink_an_led", { code: "// idle", facts: { trace: forgedBlink } }), { compile: compileTo("button") });
    expect(r).toMatchObject({ ok: false, status: 422 });
  });
  it("accepts the button sketch under the lesson's scripted presses", async () => {
    expect((await judge(snap("mechatronics/push_a_button", { code: "// button" }), { compile: compileTo("button") })).ok).toBe(true);
  });
  it("rejects a blinking program for the button lesson", async () => {
    expect(await judge(snap("mechatronics/push_a_button", { code: "// blink" }), { compile: compileTo("blink") })).toMatchObject({ ok: false, status: 422 });
  });
  it("maps compile failures: student error is 422, toolchain down is 503", async () => {
    const bad = async (): Promise<CompileResult> => ({ ok: false, status: 422, message: "x", diagnostics: [] });
    const down = async (): Promise<CompileResult> => ({ ok: false, status: 503, message: "x", diagnostics: [] });
    expect(await judge(snap("mechatronics/blink_an_led", { code: "x" }), { compile: bad })).toMatchObject({ status: 422 });
    expect(await judge(snap("mechatronics/blink_an_led", { code: "x" }), { compile: down })).toMatchObject({ status: 503 });
  });
});
