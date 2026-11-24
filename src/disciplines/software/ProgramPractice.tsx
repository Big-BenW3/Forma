"use client";
/**
 * Practice body for the "your first program" lesson: the editor, with a
 * Hint/Solution drawer under it. Run / Step / Reset live in the terminal stage.
 * The student's source is the ONLY evidence: the validator re-assembles and
 * runs it, so there is nothing to forge.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import type { PracticeProps } from "../types";
import { useIsCompact } from "@/lib/useMedia";
import { usePractice } from "@/engine/practice";
import { useSoftware } from "./store";

// Monaco is large; load it only when this lesson is opened, and only on desktop.
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="p-4 font-mono text-[12px] text-ink-3">Loading editor…</div>,
});

export function ProgramPractice({ lesson }: PracticeProps) {
  const compact = useIsCompact();
  const code = usePractice((s) => s.code);
  const setCode = usePractice((s) => s.setCode);
  const errors = useSoftware((s) => s.errors);
  const nextLine = useSoftware((s) => (s.program && !s.machine.halted && s.started ? s.program[s.machine.pc]?.line : undefined));
  const reset = useSoftware((s) => s.reset);
  const [showHint, setShowHint] = useState(false);
  const hint = lesson.options.hint as string | undefined;
  const solution = lesson.options.solution as string | undefined;
  const [showSolution, setShowSolution] = useState(false);

  const onChange = (v: string) => {
    setCode(v);
    // Editing invalidates the last run.
    if (useSoftware.getState().started) reset();
  };

  return (
    <div className="flex min-h-[270px] flex-1 shrink-0 flex-col gap-2">
      <div className="min-h-[200px] flex-1 overflow-hidden rounded-[8px] border border-line">
        {compact ? (
          // Monaco is built for a keyboard and mouse; a phone gets a plain, honest text area.
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Program source"
            className="h-full min-h-[200px] w-full resize-none bg-[#fbfaf7] p-3 font-mono text-[13px] leading-5 text-ink outline-none"
          />
        ) : (
          <CodeEditor value={code} onChange={onChange} errors={errors} nextLine={nextLine} />
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {hint && (
          <button type="button" onClick={() => setShowHint((v) => !v)} className="rounded-[7px] border border-line-strong px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink hover:bg-ground-deep">
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
        {solution && (
          <button type="button" onClick={() => setShowSolution((v) => !v)} className="rounded-[7px] border border-line-strong px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink hover:bg-ground-deep">
            {showSolution ? "Hide solution" : "Show solution"}
          </button>
        )}
      </div>
      {showHint && hint && <p className="shrink-0 text-[12.5px] leading-[1.5] text-ink-2">{hint}</p>}
      {showSolution && solution && (
        <pre className="thin-scroll max-h-[170px] shrink-0 overflow-auto rounded-[8px] bg-ground-deep p-3 font-mono text-[12px] leading-[1.5] text-ink">{solution}</pre>
      )}
    </div>
  );
}
