"use client";
/**
 * Practice body for the sketch lessons: a C++ editor, Compile & run, and (for the
 * button lesson) a button you can hold or latch. Compilation happens on the server
 * (real arduino-cli); the result runs in the AVR emulator in a Web Worker.
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { PracticeProps } from "../types";
import { useIsCompact } from "@/lib/useMedia";
import { usePractice } from "@/engine/practice";
import { useMech } from "./store";
import type { InputEvent } from "@/lib/emulator/core";

const CodeEditor = dynamic(() => import("../software/CodeEditor"), {
  ssr: false,
  loading: () => <div className="p-4 font-mono text-[12px] text-ink-3">Loading editor…</div>,
});

interface Params {
  durationMs?: number;
  script?: InputEvent[];
}

const pill = "rounded-[7px] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] disabled:opacity-40";

export function CodeLab({ lesson }: PracticeProps) {
  const compact = useIsCompact();
  const code = usePractice((s) => s.code);
  const setCode = usePractice((s) => s.setCode);
  const { status, message, diagnostics, run, stop } = useMech();
  const params = lesson.practice.params as Params;
  const buttonPin = lesson.options.buttonPin as number | undefined;
  const hint = lesson.options.hint as string | undefined;
  const solution = lesson.options.solution as string | undefined;
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Leaving the lesson stops the emulator (terminates its worker).
  useEffect(() => () => useMech.getState().stop(), []);

  const busy = status === "compiling";
  const go = () => void run(code, { durationMs: params.durationMs ?? 5000, script: params.script, buttonPin });

  return (
    <div className="flex min-h-[290px] flex-1 shrink-0 flex-col gap-2">
      <div className="min-h-[210px] flex-1 overflow-hidden rounded-[8px] border border-line">
        {compact ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Sketch source"
            className="h-full min-h-[210px] w-full resize-none bg-[#fbfaf7] p-3 font-mono text-[12.5px] leading-5 text-ink outline-none"
          />
        ) : (
          <CodeEditor language="cpp" value={code} onChange={setCode} errors={diagnostics.filter((d) => d.severity === "error")} />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button type="button" onClick={go} disabled={busy} className={`${pill} bg-ink text-surface hover:bg-ink/85`}>
          {busy ? "Compiling…" : "Compile & run"}
        </button>
        <button type="button" onClick={stop} disabled={status !== "running"} className={`${pill} border border-line-strong text-ink hover:bg-ground-deep`}>
          Stop
        </button>
        {hint && (
          <button type="button" onClick={() => setShowHint((v) => !v)} className={`${pill} border border-line-strong text-ink hover:bg-ground-deep`}>
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
        {solution && (
          <button type="button" onClick={() => setShowSolution((v) => !v)} className={`${pill} border border-line-strong text-ink hover:bg-ground-deep`}>
            {showSolution ? "Hide solution" : "Solution"}
          </button>
        )}
        <span className="micro ml-auto" aria-live="polite">
          {status === "running" ? "Running" : status === "compiling" ? "Compiling" : status === "error" ? "Error" : ""}
        </span>
      </div>

      {(message || diagnostics.length > 0) && (
        <div role="alert" className="shrink-0 rounded-[8px] border border-accent/40 bg-accent-soft p-2.5 font-mono text-[11.5px] leading-[1.5] text-ink">
          {message && <div className="font-sans text-[12.5px] font-semibold">{message}</div>}
          {diagnostics.slice(0, 6).map((d, i) => (
            <div key={i}>
              line {d.line}: {d.message}
            </div>
          ))}
        </div>
      )}
      {showHint && hint && <p className="shrink-0 text-[12.5px] leading-[1.5] text-ink-2">{hint}</p>}
      {showSolution && solution && <pre className="thin-scroll max-h-[170px] shrink-0 overflow-auto rounded-[8px] bg-ground-deep p-3 font-mono text-[12px] leading-[1.5] text-ink">{solution}</pre>}
    </div>
  );
}
