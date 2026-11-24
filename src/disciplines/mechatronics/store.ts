"use client";
/**
 * Mechatronics run state: compile status, diagnostics, live pin levels and the
 * button. The source code lives in the practice store; the TRACE (evidence) is
 * written to the practice store's facts, never kept here.
 */
import { create } from "zustand";
import type { Diagnostic } from "@/server/compile-guard";
import { runBatch, startLive, type LiveRun } from "@/lib/emulator/client";
import type { InputEvent } from "@/lib/emulator/core";
import { usePractice } from "@/engine/practice";

export type RunStatus = "idle" | "compiling" | "running" | "error";

interface MechState {
  status: RunStatus;
  message: string | null;
  diagnostics: Diagnostic[];
  /** Live output level of each pin (only pins the program has driven) */
  pins: Record<number, 0 | 1>;
  /** Button state as the circuit sees it: true = pressed */
  pressed: boolean;
  /** Toggle mode: the latched state */
  latched: boolean;
  /** Compile, then run live and record the scripted trace as evidence */
  run: (source: string, plan: { durationMs: number; script?: InputEvent[]; buttonPin?: number }) => Promise<void>;
  stop: () => void;
  /** Press/release the button (pin goes LOW when pressed: INPUT_PULLUP wiring) */
  setPressed: (v: boolean) => void;
}

let live: LiveRun | null = null;
let buttonPin: number | undefined;

export const useMech = create<MechState>((set, get) => ({
  status: "idle",
  message: null,
  diagnostics: [],
  pins: {},
  pressed: false,
  latched: false,
  stop: () => {
    live?.stop();
    live = null;
    set({ status: "idle", pins: {}, pressed: false, latched: false });
  },
  setPressed: (v) => {
    set({ pressed: v });
    if (buttonPin !== undefined) live?.input(buttonPin, v ? 0 : 1);
  },
  run: async (source, plan) => {
    get().stop();
    buttonPin = plan.buttonPin;
    set({ status: "compiling", message: null, diagnostics: [] });
    let hex: string;
    try {
      const res = await fetch("/api/v1/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        set({ status: "error", message: body.message ?? "Compiling failed.", diagnostics: body.diagnostics ?? [] });
        return;
      }
      hex = body.hex;
    } catch {
      set({ status: "error", message: "Could not reach the compiler. Check your connection." });
      return;
    }
    // Live run for the student to watch...
    live = startLive(
      hex,
      (e) => set((s) => ({ pins: { ...s.pins, [e.pin]: e.value } })),
      (m) => set({ status: "error", message: m }),
    );
    set({ status: "running", message: null });
    // ...and a fast scripted run for the evidence, so judging never depends on timing in the browser.
    try {
      const r = await runBatch(hex, plan.durationMs, plan.script);
      usePractice.getState().setFacts({ trace: r.events });
    } catch (e) {
      set({ message: e instanceof Error ? e.message : "The check failed." });
    }
  },
}));
