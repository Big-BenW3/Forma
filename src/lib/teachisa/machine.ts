/**
 * Teaching ISA: machine
 * =====================
 * Immutable state + a pure `step`. The terminal UI steps one instruction at a
 * time; `runProgram` loops `step` for the validator. Same code, same answers.
 */
import { MEMORY_SIZE, type Reg, type Step } from "./assemble";

export const MAX_STEPS = 5000;

export interface Machine {
  regs: Record<Reg, number>;
  mem: number[];
  /** Index of the NEXT instruction to run */
  pc: number;
  output: string;
  halted: boolean;
  /** Instructions executed so far */
  steps: number;
  /** Jumps that went backwards: the fingerprint of a loop */
  backJumps: number;
  error?: string;
  /** Source line of the instruction that just ran (for highlighting) */
  lastLine?: number;
}

export function createMachine(): Machine {
  return { regs: { A: 0, B: 0, C: 0, D: 0 }, mem: new Array(MEMORY_SIZE).fill(0), pc: 0, output: "", halted: false, steps: 0, backJumps: 0 };
}

const wrap = (n: number) => ((n % 256) + 256) % 256;

/** Runs one instruction. Returns the same machine if it already stopped. */
export function stepMachine(m: Machine, program: Step[]): Machine {
  if (m.halted) return m;
  // Falling off the end of the program is a normal way to finish.
  if (m.pc >= program.length) return { ...m, halted: true };
  if (m.steps >= MAX_STEPS) {
    return { ...m, halted: true, error: `Stopped after ${MAX_STEPS} instructions. Is there a loop that never ends?` };
  }
  const ins = program[m.pc];
  const regs = { ...m.regs };
  let mem = m.mem;
  let pc = m.pc + 1;
  let output = m.output;
  let halted = false;
  let backJumps = m.backJumps;
  const jump = (target: number) => {
    if (target <= m.pc) backJumps += 1;
    pc = target;
  };

  switch (ins.op) {
    case "LOAD": regs[ins.r] = ins.n; break;
    case "MOV": regs[ins.r] = regs[ins.s]; break;
    case "ADD": regs[ins.r] = wrap(regs[ins.r] + (ins.s ? regs[ins.s] : ins.n)); break;
    case "SUB": regs[ins.r] = wrap(regs[ins.r] - (ins.s ? regs[ins.s] : ins.n)); break;
    case "INC": regs[ins.r] = wrap(regs[ins.r] + 1); break;
    case "DEC": regs[ins.r] = wrap(regs[ins.r] - 1); break;
    case "WRITE": mem = mem.slice(); mem[ins.n] = regs[ins.r]; break;
    case "READ": regs[ins.r] = mem[ins.n]; break;
    case "JMP": jump(ins.target); break;
    case "JZ": if (regs[ins.r] === 0) jump(ins.target); break;
    case "JNZ": if (regs[ins.r] !== 0) jump(ins.target); break;
    case "OUT": output += `${regs[ins.r]}\n`; break;
    case "OUTC": output += String.fromCharCode(regs[ins.r]); break;
    case "HALT": halted = true; break;
  }
  return { regs, mem, pc, output, halted, steps: m.steps + 1, backJumps, lastLine: ins.line };
}

/** Runs to completion (or to the step limit). Used by the validator and the Run button. */
export function runProgram(program: Step[]): Machine {
  let m = createMachine();
  while (!m.halted) m = stepMachine(m, program);
  return m;
}
