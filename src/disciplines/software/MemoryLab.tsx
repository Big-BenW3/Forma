"use client";
/**
 * Memory lab: a 16-cell RAM you can write to, read from, and cut the power on.
 *
 * The student's operations are recorded as FACTS (`facts.ops`) and the
 * `memory_lab` validator replays them against the same RAM model (applyOp), so
 * what the lab shows and what the validator decides can never drift apart.
 * Cutting the power empties every cell with a short fade, the way charge leaks
 * out of the capacitors in the previous view.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeProps } from "../types";
import { applyOp, freshRam, MEMORY_LAB_CELLS, parseOps, type MemOp } from "@/validators/software";

const hex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");

export function MemoryLab({ snapshot, setFacts }: PracticeProps) {
  const ops = useMemo(() => parseOps(snapshot.facts?.ops), [snapshot.facts?.ops]);
  // Current RAM = the recorded operations replayed from power-on.
  const { ram, lastRead } = useMemo(() => {
    let s = freshRam();
    let read: number | undefined;
    for (const op of ops) {
      const r = applyOp(s, op);
      s = r.state;
      if (r.read !== undefined) read = r.read;
      else if (op.k !== "read") read = undefined;
    }
    return { ram: s, lastRead: read };
  }, [ops]);

  const [addr, setAddr] = useState(3);
  const [val, setVal] = useState(42);
  // Cells that were full when power was cut fade out instead of vanishing.
  const [ghost, setGhost] = useState<Map<number, number> | null>(null);
  const ghostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (ghostTimer.current && clearTimeout(ghostTimer.current)), []);

  const push = (op: MemOp) => setFacts({ ops: [...ops, op].slice(-200) });
  const cutPower = () => {
    if (!ram.powered) return;
    setGhost(new Map(ram.cells));
    if (ghostTimer.current) clearTimeout(ghostTimer.current);
    ghostTimer.current = setTimeout(() => setGhost(null), 1400);
    push({ k: "off" });
  };

  const clampVal = (n: number) => Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
  const btn = "rounded-[7px] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] disabled:opacity-35";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${ram.powered ? "bg-ok" : "bg-line-strong"}`} />
        <span className="micro">{ram.powered ? "Power on" : "Power off"}</span>
      </div>

      <div role="group" aria-label="RAM cells" className="grid grid-cols-8 gap-1">
        {Array.from({ length: MEMORY_LAB_CELLS }, (_, a) => {
          const live = ram.powered ? ram.cells.get(a) : undefined;
          const fading = !ram.powered && ghost?.get(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAddr(a)}
              aria-label={`cell ${a}`}
              className={`flex flex-col items-center rounded-[6px] border px-1 py-1 font-mono ${a === addr ? "border-accent ring-1 ring-accent" : "border-line"} ${live ? "bg-accent-soft" : "bg-ground"}`}
            >
              <span className="text-[9px] text-ink-3">{a}</span>
              <span
                className="text-[12px] font-bold text-ink"
                style={fading ? { animation: "forma-fade 1.4s ease-out forwards" } : undefined}
              >
                {live !== undefined ? hex(live) : fading ? hex(fading) : "··"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
          Cell
          <input
            type="number"
            min={0}
            max={MEMORY_LAB_CELLS - 1}
            value={addr}
            onChange={(e) => setAddr(Math.max(0, Math.min(MEMORY_LAB_CELLS - 1, Math.round(+e.target.value || 0))))}
            className="h-8 w-[64px] rounded-[6px] border border-line-strong bg-surface px-2 font-mono text-[13px] text-ink"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
          Number (0 to 255)
          <input
            type="number"
            min={0}
            max={255}
            value={val}
            onChange={(e) => setVal(clampVal(+e.target.value))}
            className="h-8 w-[88px] rounded-[6px] border border-line-strong bg-surface px-2 font-mono text-[13px] text-ink"
          />
        </label>
        <button type="button" disabled={!ram.powered} onClick={() => push({ k: "write", a: addr, v: val })} className={`${btn} bg-ink text-surface hover:bg-ink/85`}>
          Write
        </button>
        <button type="button" disabled={!ram.powered} onClick={() => push({ k: "read", a: addr })} className={`${btn} border border-line-strong text-ink hover:bg-ground-deep`}>
          Read
        </button>
        {ram.powered ? (
          <button type="button" onClick={cutPower} className={`${btn} bg-accent text-white hover:brightness-110`}>
            Cut power
          </button>
        ) : (
          <button type="button" onClick={() => push({ k: "on" })} className={`${btn} bg-ok text-white hover:brightness-110`}>
            Restore power
          </button>
        )}
      </div>

      <p className="min-h-[18px] font-mono text-[12px] text-ink-2" aria-live="polite">
        {!ram.powered
          ? "No power. The capacitors have leaked away, so every cell is empty."
          : lastRead !== undefined
            ? `Read cell ${addr}: ${lastRead} (0x${hex(lastRead)})`
            : ""}
      </p>
    </div>
  );
}
