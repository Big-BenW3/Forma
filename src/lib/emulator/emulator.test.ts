import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runEmulation } from "./core";
import { parseHex } from "./hex";

// Fixtures are real avr-gcc output (see fixtures/*.c): plain avr-libc, no Arduino core.
const hex = (n: string) => readFileSync(path.join(__dirname, "fixtures", `${n}.hex`), "utf8");

describe("emulator", () => {
  it("blink: pin 13 toggles every 500 ms of simulated time", () => {
    const { events } = runEmulation(hex("blink"), { durationMs: 2600 });
    // The first microseconds are the program setting DDR then PORT; the blinking is what follows.
    const p13 = events.filter((e) => e.pin === 13 && e.t > 1);
    const highs = p13.filter((e) => e.value === 1);
    const lows = p13.filter((e) => e.value === 0);
    expect(highs.length).toBeGreaterThanOrEqual(2);
    expect(lows.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < p13.length; i++) {
      expect(p13[i].value).not.toBe(p13[i - 1].value);
      expect(p13[i].t - p13[i - 1].t).toBeGreaterThan(495);
      expect(p13[i].t - p13[i - 1].t).toBeLessThan(505);
    }
  });

  it("button: LED follows a scripted press (INPUT_PULLUP, pressed = LOW)", () => {
    const { events } = runEmulation(hex("button"), {
      durationMs: 1000,
      inputs: [
        { t: 200, pin: 2, value: 0 },
        { t: 600, pin: 2, value: 1 },
      ],
    });
    const p13 = events.filter((e) => e.pin === 13);
    const at = (t: number) => [...p13].filter((e) => e.t <= t).pop()?.value;
    expect(at(100)).toBe(0);
    expect(at(400)).toBe(1);
    expect(at(800)).toBe(0);
  });

  it("is deterministic", () => {
    const a = runEmulation(hex("blink"), { durationMs: 1200 });
    const b = runEmulation(hex("blink"), { durationMs: 1200 });
    expect(a.events).toEqual(b.events);
  });

  it("rejects a corrupt HEX file", () => {
    expect(() => parseHex(":10000000FFFF")).toThrow();
    expect(() => parseHex("hello")).toThrow();
    const bad = hex("blink").replace(/:(..)(....)(..)(.)/, ":$1$2$3F");
    expect(() => parseHex(bad)).toThrow(/checksum/);
  });
});
