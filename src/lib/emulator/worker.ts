/**
 * Emulator Web Worker. Runs the AVR in real time off the main thread so a
 * program stuck in a busy loop can never freeze the page; stopping the
 * simulation is just terminating this worker.
 *
 * Messages in:  { type: "start", hex }                    run live, paced to the wall clock
 *               { type: "input", pin, value }              drive an input (a button)
 *               { type: "batch", id, hex, durationMs, inputs? }  run fast, reply with the whole trace
 * Messages out: { type: "pin", t, pin, value } | { type: "batchResult", id, events, serial } | { type: "error", message }
 */
import { Emulator, runEmulation, type InputEvent } from "./core";

type In =
  | { type: "start"; hex: string }
  | { type: "input"; pin: number; value: 0 | 1 }
  | { type: "batch"; id: number; hex: string; durationMs: number; inputs?: InputEvent[] };

const ctx = self as unknown as { postMessage: (m: unknown) => void; onmessage: ((e: MessageEvent<In>) => void) | null };

let emu: Emulator | null = null;
let startedAt = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
// Inputs that arrive before the live run exists are applied when it starts.
const pendingInputs: Array<{ pin: number; value: 0 | 1 }> = [];

function tick() {
  if (!emu) return;
  try {
    emu.runTo(performance.now() - startedAt);
  } catch (e) {
    ctx.postMessage({ type: "error", message: e instanceof Error ? e.message : "The emulator stopped." });
    emu = null;
    return;
  }
  timer = setTimeout(tick, 16);
}

ctx.onmessage = (ev) => {
  const m = ev.data;
  try {
    if (m.type === "start") {
      if (timer) clearTimeout(timer);
      emu = new Emulator(m.hex, (e) => ctx.postMessage({ type: "pin", ...e }));
      for (const i of pendingInputs) emu.setInput(i.pin, i.value);
      startedAt = performance.now();
      tick();
    } else if (m.type === "input") {
      if (emu) emu.setInput(m.pin, m.value);
      else pendingInputs.push({ pin: m.pin, value: m.value });
    } else if (m.type === "batch") {
      const r = runEmulation(m.hex, { durationMs: m.durationMs, inputs: m.inputs });
      ctx.postMessage({ type: "batchResult", id: m.id, events: r.events, serial: r.serial });
    }
  } catch (e) {
    ctx.postMessage({ type: "error", message: e instanceof Error ? e.message : "The emulator failed." });
  }
};
