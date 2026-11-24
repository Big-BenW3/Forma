/**
 * Software engineering validators.
 *
 *  - `memory_lab`   : replays a list of memory operations against a model of RAM
 *                     and checks the student saw that RAM forgets without power.
 *  - `first_program`: assembles and runs the student's teaching-ISA program and
 *                     checks what it printed and whether it used a loop.
 *
 * Neither trusts the client's own account of results. `memory_lab` is given
 * only the operations (facts) and recomputes every read; `first_program` is
 * given only the source code and runs it. Both are pure, so the server runs
 * them again on submission and reaches the same verdict.
 */
import { assemble, runProgram } from "@/lib/teachisa";
import { verdict, type Validator } from "./types";

export const MEMORY_LAB_CELLS = 16;

export type MemOp = { k: "write"; a: number; v: number } | { k: "read"; a: number } | { k: "off" } | { k: "on" };

/** Defensive parse: a snapshot comes from the network, so keep only well-formed operations. */
export function parseOps(raw: unknown): MemOp[] {
  if (!Array.isArray(raw)) return [];
  const int = (x: unknown, max: number) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= max;
  const ops: MemOp[] = [];
  for (const o of raw.slice(0, 200) as Array<Record<string, unknown>>) {
    if (!o || typeof o !== "object") continue;
    if (o.k === "write" && int(o.a, MEMORY_LAB_CELLS - 1) && int(o.v, 255)) ops.push({ k: "write", a: o.a as number, v: o.v as number });
    else if (o.k === "read" && int(o.a, MEMORY_LAB_CELLS - 1)) ops.push({ k: "read", a: o.a as number });
    else if (o.k === "off" || o.k === "on") ops.push({ k: o.k });
  }
  return ops;
}

/** The model of RAM the lab and the validator share: a powered flag and the stored cells. */
export interface RamState {
  powered: boolean;
  cells: Map<number, number>;
}

export const freshRam = (): RamState => ({ powered: true, cells: new Map() });

/**
 * Applies one operation. Without power nothing can be read or written, and cutting
 * power empties every cell: that is the whole lesson. Returns the new state and,
 * for a read, the value it returned (an unwritten cell reads 0).
 */
export function applyOp(s: RamState, op: MemOp): { state: RamState; read?: number; ignored?: boolean } {
  if (op.k === "off") return { state: { powered: false, cells: s.powered ? new Map() : s.cells }, ignored: !s.powered };
  if (op.k === "on") return { state: { powered: true, cells: s.cells }, ignored: s.powered };
  if (!s.powered) return { state: s, ignored: true };
  if (op.k === "write") {
    const cells = new Map(s.cells);
    cells.set(op.a, op.v);
    return { state: { powered: true, cells } };
  }
  return { state: s, read: s.cells.get(op.a) ?? 0 };
}

export const memory_lab: Validator = (_lesson, snap) => {
  let ram = freshRam();
  let wrote = false;
  let readBack = false;
  let cutWhileStored = false;
  let forgot = false;
  // Cells that held a non-zero value at the moment power was cut, and whether power has come back since.
  let heldAtCut = new Set<number>();
  let powerBack = false;

  for (const op of parseOps(snap.facts?.ops)) {
    if (op.k === "off" && ram.powered) {
      heldAtCut = new Set([...ram.cells].filter(([, v]) => v !== 0).map(([a]) => a));
      if (heldAtCut.size > 0) cutWhileStored = true;
      powerBack = false;
    }
    if (op.k === "on" && !ram.powered) powerBack = true;
    const r = applyOp(ram, op);
    ram = r.state;
    if (op.k === "write" && !r.ignored && op.v !== 0) wrote = true;
    if (r.read !== undefined) {
      if (r.read !== 0) readBack = true;
      if (powerBack && heldAtCut.has(op.k === "read" ? op.a : -1) && r.read === 0) forgot = true;
    }
  }

  return verdict([
    { id: "write", label: "Write a non-zero number into a cell", passed: wrote },
    { id: "read", label: "Read it back and get the same number", passed: readBack },
    { id: "cut", label: "Cut the power while a number is stored", passed: cutWhileStored },
    { id: "forgot", label: "Restore power and read that cell: it has forgotten", passed: forgot },
  ]);
};

interface FirstProgramParams {
  expected: string;
  minBackJumps: number;
}

export const first_program: Validator = (lesson, snap) => {
  const p = lesson.practice.params as unknown as FirstProgramParams;
  const src = typeof snap.code === "string" ? snap.code.slice(0, 4000) : "";
  const asm = assemble(src);
  const run = asm.ok ? runProgram(asm.program) : null;
  const printedOk = !!run && !run.error && run.output === p.expected;
  return verdict([
    {
      id: "assembles",
      label: "The program assembles with no errors",
      passed: asm.ok,
      detail: asm.ok ? undefined : `Line ${asm.errors[0].line}: ${asm.errors[0].message}`,
    },
    {
      id: "output",
      label: `It prints ${JSON.stringify(p.expected.trim())}, the sum of 1 to 5`,
      passed: printedOk,
      detail: run && !printedOk ? (run.error ?? `It printed ${JSON.stringify(run.output.trim())}.`) : undefined,
    },
    {
      id: "loop",
      label: "It gets there with a loop, not five ADDs in a row",
      passed: !!run && run.backJumps >= p.minBackJumps,
      detail: run && run.backJumps < p.minBackJumps ? "A loop jumps back to an earlier label." : undefined,
    },
  ]);
};
