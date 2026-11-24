import { describe, expect, it } from "vitest";
import { runValidator, type Snapshot } from "./index";
import { theBrain } from "@/content/disciplines/medicine/lessons/the_brain";
import { Lesson } from "@/content/schema";

const lesson = Lesson.parse(theBrain);
const snap = (over: Partial<Snapshot> = {}): Snapshot => ({ schemaVersion: 1, lessonKey: "medicine/the_brain", examined: [], ...over });

describe("identify validator", () => {
  const rounds = (lesson.practice.params as { rounds: { answer: string }[] }).rounds;

  it("fails with no answers", () => {
    expect(runValidator(lesson, snap()).passed).toBe(false);
  });

  it("passes only when every round is answered correctly", () => {
    const answers = Object.fromEntries(rounds.map((r, i) => [String(i), { partId: r.answer, attempts: 1 }]));
    expect(runValidator(lesson, snap({ answers })).passed).toBe(true);
  });

  it("fails when one round is wrong", () => {
    const answers = Object.fromEntries(rounds.map((r, i) => [String(i), { partId: r.answer, attempts: 1 }]));
    answers["0"] = { partId: "brain_cerebellum", attempts: 2 };
    const v = runValidator(lesson, snap({ answers }));
    expect(v.passed).toBe(false);
    expect(v.checks[0].detail).toBeTruthy();
  });

  it("cannot be passed by claiming a verdict: only facts count", () => {
    // A snapshot has no `passed` field; extra keys are ignored.
    const forged = { ...snap(), passed: true } as unknown as Snapshot;
    expect(runValidator(lesson, forged).passed).toBe(false);
  });

  it("throws for an unknown validator id", () => {
    const bad = { ...lesson, practice: { ...lesson.practice, validator: "nope" } };
    expect(() => runValidator(bad, snap())).toThrow();
  });
});

// --- software validators ---------------------------------------------------
import { first_program, memory_lab } from "./software";

const sw = (practice: object, snap: object) =>
  [{ practice } as never, { schemaVersion: 1, lessonKey: "software/x", examined: [], ...snap } as never] as const;

describe("memory_lab", () => {
  const run = (ops: unknown[]) => memory_lab(...sw({}, { facts: { ops } }));
  it("passes when RAM is shown to forget", () => {
    const v = run([
      { k: "write", a: 3, v: 42 },
      { k: "read", a: 3 },
      { k: "off" },
      { k: "on" },
      { k: "read", a: 3 },
    ]);
    expect(v.passed).toBe(true);
  });
  it("does not pass without cutting power", () => {
    const v = run([{ k: "write", a: 3, v: 42 }, { k: "read", a: 3 }]);
    expect(v.passed).toBe(false);
    expect(v.checks.find((c) => c.id === "cut")?.passed).toBe(false);
  });
  it("ignores malformed and out-of-range operations", () => {
    expect(run([{ k: "write", a: 99, v: 1 }, { k: "read", a: -1 }, "x", null]).passed).toBe(false);
  });
  it("cannot be satisfied by reading a cell that was never written", () => {
    expect(run([{ k: "off" }, { k: "on" }, { k: "read", a: 1 }]).checks.find((c) => c.id === "forgot")?.passed).toBe(false);
  });
});

describe("first_program", () => {
  const params = { expected: "15\n", minBackJumps: 2 };
  const run = (code: string) => first_program(...sw({ params }, { code }));
  it("passes a loop that sums 1..5", () => {
    expect(run("LOAD A,0\nLOAD B,5\nl: ADD A,B\nDEC B\nJNZ B,l\nOUT A\nHALT").passed).toBe(true);
  });
  it("rejects the right answer without a loop", () => {
    const v = run("LOAD A,15\nOUT A");
    expect(v.passed).toBe(false);
    expect(v.checks.find((c) => c.id === "output")?.passed).toBe(true);
    expect(v.checks.find((c) => c.id === "loop")?.passed).toBe(false);
  });
  it("reports an assembly error with its line", () => {
    const v = run("LOAD A,1\nBOGUS");
    expect(v.checks[0].detail).toMatch(/Line 2/);
  });
});

// --- mechatronics validators (traces come from REAL avr-gcc output run in the emulator) ---
import { readFileSync } from "node:fs";
import path from "node:path";
import { blink_led, button_led } from "./mechatronics";
import { runEmulation } from "@/lib/emulator/core";

const fx = (n: string) => readFileSync(path.join(process.cwd(), "src/lib/emulator/fixtures", `${n}.hex`), "utf8");
const blinkParams = { pin: 13, minMs: 100, maxMs: 3000, minIntervals: 2 };
const btnParams = {
  led: 13,
  script: [
    { t: 300, pin: 2, value: 0 },
    { t: 800, pin: 2, value: 1 },
    { t: 1100, pin: 2, value: 0 },
    { t: 1500, pin: 2, value: 1 },
  ],
};

describe("blink_led", () => {
  const judge = (trace: unknown) => blink_led(...sw({ params: blinkParams }, { facts: { trace } }));
  it("passes a real blink trace", () => {
    expect(judge(runEmulation(fx("blink"), { durationMs: 5000 }).events).passed).toBe(true);
  });
  it("fails when nothing ever changed, and says so", () => {
    const v = judge([]);
    expect(v.passed).toBe(false);
    expect(v.checks[0].detail).toMatch(/never changed/);
  });
  it("fails an LED that is only switched on", () => {
    expect(judge([{ t: 0.1, pin: 13, value: 1 }]).passed).toBe(false);
  });
  it("fails a blink that is too fast to see", () => {
    const fast = Array.from({ length: 20 }, (_, i) => ({ t: i * 10, pin: 13, value: (i % 2) as 0 | 1 }));
    expect(judge(fast).checks.find((c) => c.id === "repeat")?.passed).toBe(false);
  });
  it("ignores malformed events", () => {
    expect(judge([{ t: "x", pin: 13, value: 1 }, null, { t: 5, pin: 13, value: 7 }]).passed).toBe(false);
  });
});

describe("button_led", () => {
  const judge = (trace: unknown) => button_led(...sw({ params: btnParams }, { facts: { trace } }));
  it("passes a program whose LED follows the button", () => {
    const { events } = runEmulation(fx("button"), { durationMs: 1800, inputs: btnParams.script as never });
    expect(judge(events).passed).toBe(true);
  });
  it("fails an LED that blinks regardless of the button", () => {
    const { events } = runEmulation(fx("blink"), { durationMs: 1800, inputs: btnParams.script as never });
    expect(judge(events).passed).toBe(false);
  });
  it("fails an inverted button (LED on when released)", () => {
    const inverted = [{ t: 1, pin: 13, value: 1 as const }, { t: 450, pin: 13, value: 0 as const }, { t: 950, pin: 13, value: 1 as const }, { t: 1250, pin: 13, value: 0 as const }, { t: 1650, pin: 13, value: 1 as const }];
    expect(judge(inverted).passed).toBe(false);
  });
  it("fails with an empty trace", () => {
    expect(judge([]).passed).toBe(false);
  });
});
