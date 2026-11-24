"use client";
/**
 * Browser side of the emulator: starts and stops the worker. Kept apart from the
 * store so it can be reasoned about on its own.
 */
import type { InputEvent, PinEvent, RunResult } from "./core";

const make = () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

export interface LiveRun {
  /** Drive an input pin (button) */
  input: (pin: number, value: 0 | 1) => void;
  stop: () => void;
}

/** Runs the program live, paced to real time. Pin changes arrive through `onPin`. */
export function startLive(hex: string, onPin: (e: PinEvent) => void, onError: (m: string) => void): LiveRun {
  const w = make();
  w.onmessage = (ev: MessageEvent) => {
    if (ev.data.type === "pin") onPin({ t: ev.data.t, pin: ev.data.pin, value: ev.data.value });
    else if (ev.data.type === "error") onError(ev.data.message);
  };
  w.onerror = () => onError("The emulator stopped unexpectedly.");
  w.postMessage({ type: "start", hex });
  return { input: (pin, value) => w.postMessage({ type: "input", pin, value }), stop: () => w.terminate() };
}

let batchId = 0;

/** Runs the program fast and returns the whole trace: the evidence the validator judges. */
export function runBatch(hex: string, durationMs: number, inputs?: InputEvent[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const w = make();
    const id = ++batchId;
    const done = (fn: () => void) => {
      clearTimeout(timer);
      w.terminate();
      fn();
    };
    const timer = setTimeout(() => done(() => reject(new Error("The check took too long."))), 20_000);
    w.onmessage = (ev: MessageEvent) => {
      if (ev.data.type === "batchResult" && ev.data.id === id) done(() => resolve({ events: ev.data.events, serial: ev.data.serial }));
      else if (ev.data.type === "error") done(() => reject(new Error(ev.data.message)));
    };
    w.onerror = () => done(() => reject(new Error("The emulator stopped unexpectedly.")));
    w.postMessage({ type: "batch", id, hex, durationMs, inputs });
  });
}
