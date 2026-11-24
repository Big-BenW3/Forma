/**
 * Lesson 3: Your first program.
 *
 * No 3D scene: the centre of the screen is a terminal (layout "terminal") and the
 * practice card holds the editor. The student writes a program for the TEACHING
 * ISA (src/lib/teachisa), a deliberately tiny made-up instruction set that runs
 * in the browser. The lesson says plainly that it is not x86 or ARM.
 *
 * Practice: sum 1 to 5 and print it, using a loop. The `first_program` validator
 * assembles and runs the source, so it works the same on the server.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

const STARTER = `; Print 2 + 3, then change it to add up 1 to 5.
LOAD A, 2
LOAD B, 3
ADD A, B     ; A = A + B
OUT A        ; print A
HALT
`;

const SOLUTION = `LOAD A, 0     ; A is the running total
LOAD B, 5     ; B counts down from 5
loop:
  ADD A, B    ; total = total + B
  DEC B       ; B = B - 1
  JNZ B, loop ; if B is not 0, go back to loop
OUT A         ; prints 15
HALT`;

export const yourFirstProgram: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "your_first_program",
  disciplineId: "software",
  order: 3,
  title: "Your first program",
  blurb: "Write instructions for a tiny CPU and watch each one run.",
  layout: "terminal",
  scene: null,
  options: {
    starterCode: STARTER,
    hint:
      "Keep a total in A and a counter in B. Add B to A, take one off B, and jump back while B is not zero. JNZ means 'jump if not zero'.",
    solution: SOLUTION,
  },

  parts: [],

  tabs: {
    overview: {
      heading: "What a CPU actually does",
      blocks: [
        {
          type: "paragraph",
          text:
            "In lesson 1 the CPU carried out instructions one small step at a time. Here you write those steps yourself. A program is a list of instructions; the CPU does the first one, then the next, and so on, except when an instruction tells it to jump somewhere else.",
        },
        {
          type: "paragraph",
          text:
            "This is a teaching machine, not a real chip. It has four registers (A, B, C, D), 32 bytes of memory and fourteen instructions. Real CPUs such as x86 and ARM do the same kinds of things with hundreds of instructions.",
        },
        {
          type: "bullets",
          items: [
            { text: "Edit the program in the editor." },
            { text: "Run executes it all. Step runs one instruction so you can watch the registers change." },
            { text: "Your goal is to add up 1 to 5 with a loop and print 15." },
          ],
        },
      ],
    },
    layers: {
      heading: "The machine",
      blocks: [
        {
          type: "table",
          head: ["Part", "What it is"],
          rows: [
            { cells: ["Registers A, B, C, D", "Four tiny stores inside the CPU. Each holds a number from 0 to 255 (8 bits)."] },
            { cells: ["Memory", "32 cells, numbered 0 to 31, each holding 0 to 255. Slower to reach than a register."] },
            { cells: ["Program counter", "Which instruction runs next. It moves down one at a time, unless a jump changes it."] },
            { cells: ["Terminal", "Where OUT and OUTC print."] },
          ],
        },
        {
          type: "paragraph",
          text:
            "Numbers wrap around. 255 plus 1 gives 0, and 0 minus 1 gives 255, because eight bits cannot hold more. Real hardware does the same.",
        },
      ],
    },
    instructions: {
      heading: "The instructions",
      blocks: [
        {
          type: "table",
          head: ["Instruction", "Does"],
          rows: [
            { cells: ["LOAD A, 5", "Put the number 5 in register A"] },
            { cells: ["MOV A, B", "Copy B into A"] },
            { cells: ["ADD A, B", "A = A + B. The second operand can also be a number: ADD A, 1"] },
            { cells: ["SUB A, B", "A = A - B. The second operand can also be a number"] },
            { cells: ["INC A  /  DEC A", "Add 1 / subtract 1"] },
            { cells: ["WRITE 4, A", "Store A in memory cell 4"] },
            { cells: ["READ A, 4", "Load memory cell 4 into A"] },
            { cells: ["JMP name", "Go to the label called name"] },
            { cells: ["JZ A, name", "Go to name if A is 0"] },
            { cells: ["JNZ A, name", "Go to name if A is not 0"] },
            { cells: ["OUT A", "Print A as a number and start a new line"] },
            { cells: ["OUTC A", "Print A as a character, for example 72 prints H"] },
            { cells: ["HALT", "Stop"] },
          ],
        },
        {
          type: "paragraph",
          text:
            "A loop is a label plus a jump back to it: after a label such as loop:, a JNZ to loop sends the machine back there until a register reaches 0.",
        },
      ],
    },
    reference: {
      heading: "Writing it",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "Label", value: "a name and a colon, e.g. loop:" },
            { label: "Comment", value: "a semicolon to the end of the line" },
            { label: "Numbers", value: "decimal 10, hex 0x0A, or a character 'A'" },
            { label: "Case", value: "instructions and registers are not case sensitive" },
            { label: "Step limit", value: "a program stops after 5000 instructions" },
          ],
        },
        {
          type: "code",
          language: "asm",
          code: "LOAD A, 3\nagain:\n  OUT A\n  DEC A\n  JNZ A, again\nHALT",
        },
        {
          type: "paragraph",
          text: "The example prints 3, 2, 1. Mistakes are reported with their line number, in the terminal and as a red mark in the editor.",
        },
      ],
    },
  },

  practice: {
    validator: "first_program",
    title: "Write it",
    prompt: "Make the program print the sum of 1 to 5 using a loop.",
    params: { expected: "15\n", minBackJumps: 2 },
  },
};
