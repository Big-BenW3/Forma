/**
 * Mechatronics validators. Both judge an emulator TRACE: the list of pin changes
 * produced by running the student's compiled program. A trace is a fact; whether
 * it is the right behaviour is decided here.
 *
 * The browser records a trace from its own emulator run for instant feedback. On
 * the server the trace is NOT taken from the client: it re-compiles the code and
 * re-runs the emulator (src/server/evidence.ts), then calls these same functions.
 *
 *  - `blink_led`  : pin 13 blinks steadily at a speed a person can see.
 *  - `button_led` : the LED follows a scripted button press (script from the lesson,
 *                   so every student is tested the same way).
 */
import type { PinEvent } from "@/lib/emulator/core";
import { verdict, type Validator } from "./types";

/** Defensive parse: a trace may arrive from the network. */
export function parseTrace(raw: unknown): PinEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: PinEvent[] = [];
  for (const e of raw.slice(0, 5000) as Array<Record<string, unknown>>) {
    if (e && typeof e.t === "number" && Number.isFinite(e.t) && typeof e.pin === "number" && Number.isInteger(e.pin) && (e.value === 0 || e.value === 1)) {
      out.push({ t: e.t, pin: e.pin, value: e.value });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Level of a pin at simulated time t (ms): its last change at or before t; never driven reads as off. */
export function levelAt(trace: PinEvent[], pin: number, t: number): 0 | 1 {
  let v: 0 | 1 = 0;
  for (const e of trace) {
    if (e.t > t) break;
    if (e.pin === pin) v = e.value;
  }
  return v;
}

interface BlinkParams {
  pin: number;
  minMs: number;
  maxMs: number;
  /** How many steady on/off intervals prove it repeats */
  minIntervals: number;
}

export const blink_led: Validator = (lesson, snap) => {
  const p = lesson.practice.params as unknown as BlinkParams;
  const ev = parseTrace(snap.facts?.trace).filter((e) => e.pin === p.pin);
  const turnedOn = ev.some((e) => e.value === 1);
  const firstOn = ev.findIndex((e) => e.value === 1);
  const turnedOff = firstOn >= 0 && ev.slice(firstOn).some((e) => e.value === 0);
  // Steady blinking = consecutive changes that alternate and are a visible length apart.
  let good = 0;
  for (let i = 1; i < ev.length; i++) {
    const dt = ev[i].t - ev[i - 1].t;
    if (ev[i].value !== ev[i - 1].value && dt >= p.minMs && dt <= p.maxMs) good++;
  }
  const none = ev.length === 0;
  return verdict([
    { id: "on", label: `The LED on pin ${p.pin} turns on`, passed: turnedOn, detail: none ? "Pin 13 never changed. Press Compile & run first." : undefined },
    { id: "off", label: "It turns off again", passed: turnedOff },
    {
      id: "repeat",
      label: `It keeps blinking, each on and off lasting ${p.minMs / 1000} to ${p.maxMs / 1000} seconds`,
      passed: good >= p.minIntervals,
      detail: turnedOn && good < p.minIntervals ? "Too fast to see, too slow, or it only changes once. Check your delay() values." : undefined,
    },
  ]);
};

interface ButtonParams {
  led: number;
  /** The scripted presses the server (and the Check button) run; also used here to know when to sample */
  script: Array<{ t: number; pin: number; value: 0 | 1 }>;
}

export const button_led: Validator = (lesson, snap) => {
  const p = lesson.practice.params as unknown as ButtonParams;
  const trace = parseTrace(snap.facts?.trace);
  const at = (t: number) => levelAt(trace, p.led, t);
  // Sample 150 ms after each scripted change, plus once before the first press.
  const firstT = Math.min(...p.script.map((s) => s.t));
  const idle = at(firstT - 100) === 0;
  const pressed = p.script.filter((s) => s.value === 0).map((s) => s.t + 150);
  const released = p.script.filter((s) => s.value === 1).map((s) => s.t + 150);
  return verdict([
    { id: "idle", label: "The LED is off while the button is not pressed", passed: idle && trace.length > 0 },
    { id: "press", label: "The LED turns on when the button is pressed", passed: pressed.length > 0 && pressed.every((t) => at(t) === 1) },
    { id: "release", label: "The LED turns off when the button is released", passed: released.length > 0 && released.every((t) => at(t) === 0) && trace.length > 0 },
  ]);
};
