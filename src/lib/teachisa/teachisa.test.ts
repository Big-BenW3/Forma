import { describe, expect, it } from "vitest";
import { assemble, runProgram } from "./index";

const run = (src: string) => {
  const a = assemble(src);
  if (!a.ok) throw new Error(a.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));
  return runProgram(a.program);
};

describe("teaching ISA", () => {
  it("adds two numbers and prints", () => {
    expect(run("LOAD A, 2\nLOAD B, 3\nADD A, B\nOUT A\nHALT").output).toBe("5\n");
  });

  it("sums 1..5 with a loop and counts back-jumps", () => {
    const m = run(`
      LOAD A, 0      ; total
      LOAD B, 5      ; counter
      loop:
        ADD A, B
        DEC B
        JNZ B, loop
      OUT A
      HALT`);
    expect(m.output).toBe("15\n");
    expect(m.backJumps).toBe(4);
  });

  it("wraps at 8 bits", () => {
    expect(run("LOAD A, 250\nADD A, 10\nOUT A").output).toBe("4\n");
    expect(run("LOAD A, 0\nDEC A\nOUT A").output).toBe("255\n");
  });

  it("memory round-trips and character output", () => {
    expect(run("LOAD A, 'H'\nWRITE 3, A\nREAD B, 3\nOUTC B").output).toBe("H");
  });

  it("stops an infinite loop instead of hanging", () => {
    const m = run("top: JMP top");
    expect(m.error).toMatch(/never ends/);
  });

  it("reports errors with line numbers", () => {
    const a = assemble("LOAD A, 1\nFLY A\nJMP nowhere\nLOAD Z, 1");
    expect(a.ok).toBe(false);
    if (!a.ok) {
      expect(a.errors.map((e) => e.line)).toEqual([2, 3, 4]);
      expect(a.errors[0].message).toMatch(/not an instruction/);
    }
  });

  it("rejects bad memory addresses and duplicate labels", () => {
    expect(assemble("WRITE 40, A").ok).toBe(false);
    expect(assemble("x:\nx: HALT").ok).toBe(false);
  });

  it("keeps a semicolon character literal", () => {
    expect(run("LOAD A, ';'\nOUTC A").output).toBe(";");
  });
});
