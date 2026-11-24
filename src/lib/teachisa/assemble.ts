/**
 * Teaching ISA: assembler
 * =======================
 * A tiny made-up instruction set, small enough to learn in a lesson and real
 * enough to show what a CPU does: it has registers, memory, arithmetic,
 * jumps and a way to print. It is NOT x86 or ARM, and the lesson says so.
 *
 * Machine model
 *   - four 8-bit registers A, B, C, D (values wrap at 256),
 *   - 32 memory cells of 8 bits, addressed 0..31,
 *   - one program counter, counting instructions (not bytes).
 *
 * Instructions (operands separated by commas, case-insensitive)
 *   LOAD r, n      put the number n in register r
 *   MOV  r, s      copy register s into register r
 *   ADD  r, s|n    r = r + (register s or number n)
 *   SUB  r, s|n    r = r - (register s or number n)
 *   INC r / DEC r  add / subtract one
 *   WRITE n, r     memory[n] = r
 *   READ  r, n     r = memory[n]
 *   JMP label      continue at label
 *   JZ  r, label   jump if r is 0
 *   JNZ r, label   jump if r is not 0
 *   OUT r          print r as a number and a newline
 *   OUTC r         print r as a character (no newline)
 *   HALT           stop
 *
 * Syntax: `label:` on its own line or before an instruction, `;` starts a
 * comment, numbers are decimal, 0xFF hex or 'A' (a character code).
 *
 * This module is pure (no DOM, no clock, no randomness) so the lesson's
 * validator can run the student's program identically on server and client.
 */

export const REGISTERS = ["A", "B", "C", "D"] as const;
export type Reg = (typeof REGISTERS)[number];
export const MEMORY_SIZE = 32;

export type Instr =
  | { op: "LOAD"; r: Reg; n: number }
  | { op: "MOV"; r: Reg; s: Reg }
  | { op: "ADD" | "SUB"; r: Reg; s: Reg | null; n: number }
  | { op: "INC" | "DEC" | "OUT" | "OUTC"; r: Reg }
  | { op: "WRITE"; n: number; r: Reg }
  | { op: "READ"; r: Reg; n: number }
  | { op: "JMP"; target: number }
  | { op: "JZ" | "JNZ"; r: Reg; target: number }
  | { op: "HALT" };

/** An instruction plus the 1-based source line it came from (for highlighting and errors). */
export type Step = Instr & { line: number };

export interface AsmError {
  line: number;
  message: string;
}

export type AsmResult = { ok: true; program: Step[]; labels: Record<string, number> } | { ok: false; errors: AsmError[] };

const OPS = ["LOAD", "MOV", "ADD", "SUB", "INC", "DEC", "WRITE", "READ", "JMP", "JZ", "JNZ", "OUT", "OUTC", "HALT"] as const;
const LABEL = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseNumber(tok: string): number | null {
  if (/^-?\d+$/.test(tok)) return parseInt(tok, 10);
  if (/^0x[0-9a-f]+$/i.test(tok)) return parseInt(tok, 16);
  const ch = /^'(.)'$/.exec(tok);
  return ch ? ch[1].charCodeAt(0) : null;
}

const asReg = (tok: string): Reg | null => {
  const u = tok.toUpperCase();
  return (REGISTERS as readonly string[]).includes(u) ? (u as Reg) : null;
};

/** Turns source text into a program, or a list of errors with line numbers. */
export function assemble(source: string): AsmResult {
  const errors: AsmError[] = [];
  const err = (line: number, message: string) => errors.push({ line, message });

  // Pass 1: strip comments, collect labels, split into raw instructions.
  type Raw = { line: number; op: string; args: string[] };
  const raws: Raw[] = [];
  const labels: Record<string, number> = {};
  source.split(/\r?\n/).forEach((text, i) => {
    const line = i + 1;
    // A ';' starts a comment, but not inside a character literal such as ';'
    let code = text.replace(/'[^']'/g, (m) => m.replace(";", "\u0001"));
    code = code.split(";")[0].replace(/\u0001/g, ";").trim();
    // Leading labels: "loop:" optionally followed by an instruction.
    for (;;) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(code);
      if (!m) break;
      if (labels[m[1]] !== undefined) err(line, `The label "${m[1]}" is defined twice.`);
      labels[m[1]] = raws.length;
      code = m[2];
    }
    if (!code) return;
    const sp = code.search(/\s/);
    const op = (sp < 0 ? code : code.slice(0, sp)).toUpperCase();
    const rest = sp < 0 ? "" : code.slice(sp).trim();
    const args = rest ? rest.split(",").map((a) => a.trim()) : [];
    raws.push({ line, op, args });
  });

  // Pass 2: check operands and resolve labels.
  const program: Step[] = [];
  for (const { line, op, args } of raws) {
    if (!(OPS as readonly string[]).includes(op)) {
      err(line, `"${op}" is not an instruction. Try one of ${OPS.join(", ")}.`);
      continue;
    }
    const need = (n: number) => {
      if (args.length === n) return true;
      err(line, `${op} takes ${n === 0 ? "no operands" : n === 1 ? "one operand" : "two operands separated by a comma"}.`);
      return false;
    };
    const reg = (tok: string) => {
      const r = asReg(tok);
      if (!r) err(line, `"${tok}" is not a register. Use A, B, C or D.`);
      return r;
    };
    const num = (tok: string, what: string) => {
      const n = parseNumber(tok);
      if (n === null) err(line, `"${tok}" is not a number. ${what}`);
      return n;
    };
    const addr = (tok: string) => {
      const n = num(tok, "Use a memory address from 0 to 31.");
      if (n !== null && (n < 0 || n >= MEMORY_SIZE)) {
        err(line, `Memory address ${n} does not exist. Use 0 to ${MEMORY_SIZE - 1}.`);
        return null;
      }
      return n;
    };
    const label = (tok: string) => {
      if (!LABEL.test(tok)) {
        err(line, `"${tok}" is not a valid label name.`);
        return null;
      }
      if (labels[tok] === undefined) {
        err(line, `There is no label called "${tok}".`);
        return null;
      }
      return labels[tok];
    };

    switch (op) {
      case "LOAD": {
        if (!need(2)) break;
        const r = reg(args[0]);
        const n = num(args[1], "LOAD puts a number into a register.");
        if (r && n !== null) program.push({ op: "LOAD", r, n: ((n % 256) + 256) % 256, line });
        break;
      }
      case "MOV": {
        if (!need(2)) break;
        const r = reg(args[0]);
        const s = reg(args[1]);
        if (r && s) program.push({ op: "MOV", r, s, line });
        break;
      }
      case "ADD":
      case "SUB": {
        if (!need(2)) break;
        const r = reg(args[0]);
        const s = asReg(args[1]);
        const n = s ? 0 : num(args[1], `${op} needs a register or a number as its second operand.`);
        if (r && (s || n !== null)) program.push({ op, r, s, n: n ?? 0, line });
        break;
      }
      case "INC":
      case "DEC":
      case "OUT":
      case "OUTC": {
        if (!need(1)) break;
        const r = reg(args[0]);
        if (r) program.push({ op, r, line });
        break;
      }
      case "WRITE": {
        if (!need(2)) break;
        const n = addr(args[0]);
        const r = reg(args[1]);
        if (n !== null && r) program.push({ op: "WRITE", n, r, line });
        break;
      }
      case "READ": {
        if (!need(2)) break;
        const r = reg(args[0]);
        const n = addr(args[1]);
        if (r && n !== null) program.push({ op: "READ", r, n, line });
        break;
      }
      case "JMP": {
        if (!need(1)) break;
        const t = label(args[0]);
        if (t !== null) program.push({ op: "JMP", target: t, line });
        break;
      }
      case "JZ":
      case "JNZ": {
        if (!need(2)) break;
        const r = reg(args[0]);
        const t = label(args[1]);
        if (r && t !== null) program.push({ op, r, target: t, line });
        break;
      }
      case "HALT":
        if (need(0)) program.push({ op: "HALT", line });
        break;
    }
  }

  if (errors.length === 0 && program.length === 0) err(1, "The program is empty. Write at least one instruction.");
  return errors.length ? { ok: false, errors: errors.sort((a, b) => a.line - b.line) } : { ok: true, program, labels };
}
