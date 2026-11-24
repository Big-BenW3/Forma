"use client";
/**
 * The centre stage of the terminal lesson: a simulated terminal plus a live view
 * of the machine (registers, memory, the assembled program).
 *
 * It runs the teaching ISA (src/lib/teachisa) in the browser. Nothing here
 * executes student code as JavaScript: the program is data for a tiny
 * interpreter with a step limit.
 */
import { useMemo } from "react";
import { MEMORY_SIZE, REGISTERS, type Instr, type Step } from "@/lib/teachisa";
import { usePractice } from "@/engine/practice";
import { useSoftware } from "./store";
import { Icon } from "@/components/ui/Icon";

/** "LOAD A, 5" style text for an assembled instruction, so the list shows what the machine understood. */
function describe(i: Instr): string {
  switch (i.op) {
    case "LOAD": return `LOAD ${i.r}, ${i.n}`;
    case "MOV": return `MOV ${i.r}, ${i.s}`;
    case "ADD":
    case "SUB": return `${i.op} ${i.r}, ${i.s ?? i.n}`;
    case "WRITE": return `WRITE ${i.n}, ${i.r}`;
    case "READ": return `READ ${i.r}, ${i.n}`;
    case "JMP": return `JMP #${i.target + 1}`;
    case "JZ":
    case "JNZ": return `${i.op} ${i.r}, #${i.target + 1}`;
    case "HALT": return "HALT";
    default: return `${i.op} ${i.r}`;
  }
}

const bin = (n: number) => n.toString(2).padStart(8, "0");

function Btn({ label, icon, onClick, primary }: { label: string; icon: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[11.5px] font-bold uppercase tracking-[0.08em] ${
        primary ? "bg-ink text-surface hover:bg-ink/85" : "border border-line-strong bg-surface text-ink hover:bg-ground-deep"
      }`}
    >
      <Icon name={icon} size={15} /> {label}
    </button>
  );
}

export function TerminalStage() {
  const code = usePractice((s) => s.code);
  const { program, errors, machine, started, run, step, reset } = useSoftware();
  const nextLine = program && !machine.halted ? program[machine.pc]?.line : undefined;

  const text = useMemo(() => {
    if (!started) return null;
    return machine.output;
  }, [started, machine.output]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-3 pb-[96px] pt-[72px] sm:pl-[calc(var(--rail-w)+24px)] sm:pr-5">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary label="Run" icon="play" onClick={() => run(code)} />
        <Btn label="Step" icon="chevR" onClick={() => step(code)} />
        <Btn label="Reset" icon="reset" onClick={reset} />
        <span className="ml-auto font-mono text-[11px] text-ink-3">
          {started && !errors.length ? `${machine.steps} step${machine.steps === 1 ? "" : "s"}` : ""}
        </span>
      </div>

      {/* Terminal */}
      <div
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
        className="thin-scroll min-h-[120px] flex-1 overflow-y-auto rounded-[10px] bg-[#14181f] p-4 font-mono text-[13px] leading-[1.55] text-[#d7e0ee]"
      >
        <div className="text-[#6f7c92]">forma teaching machine · 4 registers · {MEMORY_SIZE} bytes of memory</div>
        {!started && <div className="mt-2 text-[#8fa0ba]">Write a program in the editor, then press Run, or Step to go one instruction at a time.</div>}
        {errors.map((e, i) => (
          <div key={i} className="mt-1 text-[#ff8a72]">
            line {e.line}: {e.message}
          </div>
        ))}
        {text !== null && !errors.length && (
          <>
            <div className="mt-2 text-[#6f7c92]">$ run</div>
            <pre className="whitespace-pre-wrap break-words font-mono text-[#e9f0fb]">{text}</pre>
            {machine.error && <div className="text-[#ff8a72]">{machine.error}</div>}
            {machine.halted && !machine.error && <div className="mt-1 text-[#6f7c92]">[halted after {machine.steps} steps]</div>}
          </>
        )}
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Registers and memory */}
        <div className="flex flex-col gap-3">
          <section aria-label="Registers" className="rounded-[10px] border border-line bg-surface p-3">
            <div className="micro mb-2">Registers</div>
            <div className="grid grid-cols-4 gap-2">
              {REGISTERS.map((r) => (
                <div key={r} className="rounded-[8px] border border-line bg-ground px-2 py-1.5 text-center">
                  <div className="font-mono text-[10px] font-bold text-ink-3">{r}</div>
                  <div className="font-mono text-[18px] font-bold leading-tight text-ink">{machine.regs[r]}</div>
                  <div className="font-mono text-[9px] tracking-wider text-ink-3">{bin(machine.regs[r])}</div>
                </div>
              ))}
            </div>
          </section>
          <section aria-label="Memory" className="rounded-[10px] border border-line bg-surface p-3">
            <div className="micro mb-2">Memory · address 0 to {MEMORY_SIZE - 1}</div>
            <div className="grid grid-cols-8 gap-1">
              {machine.mem.map((v, a) => (
                <div
                  key={a}
                  title={`address ${a}`}
                  className={`rounded-[5px] border px-1 py-0.5 text-center font-mono text-[11px] ${v ? "border-accent/40 bg-accent-soft font-bold text-ink" : "border-line bg-ground text-ink-3"}`}
                >
                  {v}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Assembled program */}
        <section aria-label="Assembled program" className="flex min-h-0 flex-col rounded-[10px] border border-line bg-surface p-3">
          <div className="micro mb-2">Program as the machine sees it</div>
          <ol className="thin-scroll max-h-[210px] overflow-y-auto font-mono text-[12px]">
            {program ? (
              program.map((ins: Step, i) => (
                <li
                  key={i}
                  className={`flex gap-2 rounded-[4px] px-1.5 py-[1px] ${program[machine.pc] === ins && !machine.halted && started ? "bg-ink text-surface" : "text-ink-2"}`}
                >
                  <span className="w-5 shrink-0 text-right opacity-60">{i + 1}</span>
                  <span>{describe(ins)}</span>
                </li>
              ))
            ) : (
              <li className="font-sans text-[12px] text-ink-3">Press Run or Step and the assembled instructions appear here.</li>
            )}
          </ol>
          {nextLine !== undefined && <div className="mt-2 font-mono text-[10.5px] text-ink-3">next: source line {nextLine}</div>}
        </section>
      </div>
    </div>
  );
}
