"use client";
/**
 * Terminal lesson state: the assembled program and the machine running it.
 *
 * The editor (right panel) and the terminal (centre stage) are separate
 * components, so they meet here. The SOURCE lives in the practice store (it is
 * a fact the validator reads); this store holds only what running it produced.
 * Nothing here is ever sent as evidence: the validator re-runs the source.
 */
import { create } from "zustand";
import { assemble, createMachine, runProgram, stepMachine, type AsmError, type Machine, type Step } from "@/lib/teachisa";

interface SoftwareState {
  program: Step[] | null;
  errors: AsmError[];
  machine: Machine;
  /** True once Run or Step has been pressed since the last reset */
  started: boolean;
  /** Assembles `source` and, on success, resets the machine. Returns true if it assembled. */
  load: (source: string) => boolean;
  /** Runs the whole program from the start */
  run: (source: string) => void;
  /** Runs one instruction, assembling first if this is the first step */
  step: (source: string) => void;
  reset: () => void;
}

export const useSoftware = create<SoftwareState>((set, get) => ({
  program: null,
  errors: [],
  machine: createMachine(),
  started: false,
  load: (source) => {
    const r = assemble(source);
    if (!r.ok) {
      set({ program: null, errors: r.errors, machine: createMachine(), started: true });
      return false;
    }
    set({ program: r.program, errors: [], machine: createMachine(), started: true });
    return true;
  },
  run: (source) => {
    if (!get().load(source)) return;
    set((s) => ({ machine: runProgram(s.program!) }));
  },
  step: (source) => {
    // Re-assemble at the start of a run so edits take effect; mid-run, keep stepping the same program.
    const { program, machine, started } = get();
    if (!program || !started || machine.steps === 0 || machine.halted) {
      if (!get().load(source)) return;
    }
    set((s) => ({ machine: stepMachine(s.machine, s.program!) }));
  },
  reset: () => set({ program: null, errors: [], machine: createMachine(), started: false }),
}));
