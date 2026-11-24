"use client";
/**
 * Context panel: three stacked cards on the right of the workspace.
 *
 *   1. ProgressHeader  - discipline, progress bar, count, and a live clock
 *   2. Reference       - four tabs; tab set is fixed per discipline, content is
 *                        per lesson, and the selected tab survives a lesson change
 *   3. Practice        - what the student does with their hands
 *
 * All content comes from the lesson record. Nothing here is discipline-specific.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Discipline, Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";
import { usePractice } from "@/engine/practice";
import { useWorkspace } from "@/engine/store";
import { runValidator, type Snapshot, type Verdict } from "@/validators";
import { Icon } from "@/components/ui/Icon";
import { Blocks } from "./Blocks";

/** Builds the snapshot of FACTS a validator reads. Never includes a verdict. */
export function useSnapshot(lessonKey: string): Snapshot {
  const examined = useWorkspace((s) => s.examined);
  const answers = usePractice((s) => s.answers);
  const code = usePractice((s) => s.code);
  const facts = usePractice((s) => s.facts);
  return useMemo(
    () => ({ schemaVersion: 1, lessonKey, examined, answers, code, facts }),
    [lessonKey, examined, answers, code, facts],
  );
}

export function useVerdict(lesson: Lesson, snapshot: Snapshot): Verdict {
  return useMemo(() => {
    try {
      return runValidator(lesson, snapshot);
    } catch {
      return { passed: false, checks: [] };
    }
  }, [lesson, snapshot]);
}

export function ProgressHeader({ discipline, lesson, completed }: { discipline: Discipline; lesson: Lesson; completed: string[] }) {
  const total = discipline.lessonIds.length;
  const done = discipline.lessonIds.filter((id) => completed.includes(`${discipline.id}/${id}`)).length;
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="micro truncate">{discipline.name}</div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="font-mono text-[11.5px] text-ink">
            {done}/{total}
          </span>
        </div>
        <div className="mt-1 truncate text-[11px] text-ink-3">
          Lesson {lesson.order}: {lesson.title}
        </div>
      </div>
    </div>
  );
}

// Remembers scroll position per lesson + tab so switching away and back lands where you were.
const scrollMemory = new Map<string, number>();

export function Reference({
  discipline,
  lesson,
  manifest,
  adapter,
}: {
  discipline: Discipline;
  lesson: Lesson;
  manifest: Manifest | null;
  adapter: DisciplineAdapter;
}) {
  const activeTab = useWorkspace((s) => s.activeTab);
  const setActiveTab = useWorkspace((s) => s.setActiveTab);
  // The saved tab survives a lesson change only if this discipline has it.
  const tabId = discipline.tabs.some((t) => t.id === activeTab) ? activeTab : discipline.tabs[0].id;
  const tab = lesson.tabs[tabId];
  const ref = useRef<HTMLDivElement>(null);
  const memKey = `${discipline.id}/${lesson.id}/${tabId}`;

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollMemory.get(memKey) ?? 0;
  }, [memKey]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-line bg-surface">
      <div role="tablist" aria-label="Reference" className="flex shrink-0 border-b border-line">
        {discipline.tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === tabId}
            aria-controls="reference-panel"
            onClick={() => setActiveTab(t.id)}
            className={`micro relative flex-auto whitespace-nowrap px-2 py-2.5 !text-[11px] !tracking-[0.09em] transition-colors ${t.id === tabId ? "!text-ink" : "hover:!text-ink-2"}`}
          >
            {t.label}
            {t.id === tabId && <span className="absolute inset-x-2 bottom-[-1px] h-[2px] bg-ink" />}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        id="reference-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tabId}`}
        onScroll={(e) => scrollMemory.set(memKey, e.currentTarget.scrollTop)}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto p-3.5"
      >
        {tab ? (
          <>
            <h2 className="mb-3 text-[20px] font-bold leading-tight text-ink">{tab.heading}</h2>
            <Blocks blocks={tab.blocks} lesson={lesson} manifest={manifest} adapter={adapter} />
          </>
        ) : null}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Practice
// -------------------------------------------------------------------------

function IdentifyPractice({ lesson, verdict }: { lesson: Lesson; verdict: Verdict }) {
  const rounds = (lesson.practice.params as { rounds: Array<{ prompt: string; answer: string }> }).rounds;
  const { active, round, setActive, answer, nextRound } = usePractice();
  const selectedId = useWorkspace((s) => s.selectedId);
  const select = useWorkspace((s) => s.select);
  const setLabels = useWorkspace((s) => s.setLabels);
  const [msg, setMsg] = useState<string | null>(null);
  const current = rounds[round];

  // Each click while practising is an answer to the current round.
  useEffect(() => {
    if (!active || !selectedId || !current) return;
    answer(round, selectedId);
    if (selectedId === current.answer) {
      setMsg("Correct.");
      nextRound();
    } else {
      setMsg("Not quite. Try again.");
    }
    // Clear the selection so the next click is a fresh answer.
    const t = setTimeout(() => select(null), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const finished = round >= rounds.length;

  useEffect(() => {
    if (finished && active) {
      setActive(false);
      setLabels(true);
    }
  }, [finished, active, setActive, setLabels]);

  if (finished || verdict.passed) {
    return <p className="text-[12.5px] text-ink-2">You found every structure with the labels off.</p>;
  }
  if (!active) {
    return (
      <button
        type="button"
        onClick={() => {
          setActive(true);
          setLabels(false);
          select(null);
          setMsg(null);
        }}
        className="rounded-[7px] bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-surface hover:bg-ink/85"
      >
        Start · labels off
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="micro !text-teal-strong">
        Round {round + 1} of {rounds.length}
      </div>
      <p className="text-[13.5px] font-semibold leading-snug text-ink">{current.prompt}</p>
      <p className="text-[12px] text-ink-3">Click it in the scene.</p>
      {msg && (
        <p className={`text-[12px] font-semibold ${msg === "Correct." ? "text-ok" : "text-accent-strong"}`} aria-live="polite">
          {msg}
        </p>
      )}
    </div>
  );
}

export function Practice({
  lesson,
  verdict,
  snapshot,
  adapter,
  complete,
  next,
  tall,
}: {
  discipline: Discipline;
  lesson: Lesson;
  verdict: Verdict;
  snapshot: Snapshot;
  adapter: DisciplineAdapter;
  complete: boolean;
  next: { href: string; title: string } | null;
  /** Give the card the room of a working area (an editor) instead of capping it at 44% */
  tall?: boolean;
}) {
  const setFacts = usePractice((s) => s.setFacts);
  const setCode = usePractice((s) => s.setCode);
  // Identify rounds are generic (a click in the scene is the answer), so an adapter's Practice
  // only replaces the card body for lessons with their own kind of practice.
  const Custom = lesson.practice.validator === "identify" ? undefined : adapter.Practice;
  const passedCount = verdict.checks.filter((c) => c.passed).length;
  const isIdentify = lesson.practice.validator === "identify";

  return (
    <div className={`flex flex-col overflow-hidden rounded-[10px] border border-line bg-surface ${tall ? "min-h-0 flex-[1.4]" : "max-h-[44%] shrink-0"}`}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <div className="micro">{lesson.practice.title}</div>
        <span className="font-mono text-[11px] text-ink">
          {passedCount}/{verdict.checks.length}
        </span>
      </div>
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">
        <p className="text-[12.5px] leading-[1.5] text-ink-2">{lesson.practice.prompt}</p>
        {Custom ? (
          <Custom lesson={lesson} snapshot={snapshot} verdict={verdict} setFacts={setFacts} setCode={setCode} />
        ) : isIdentify ? (
          <IdentifyPractice lesson={lesson} verdict={verdict} />
        ) : null}
        {!isIdentify && (
          <ul className="flex flex-col gap-1.5">
            {verdict.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-[12.5px] leading-snug">
                <span
                  className={`mt-[2px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border ${
                    c.passed ? "border-ok bg-ok text-white" : "border-line-strong text-transparent"
                  }`}
                >
                  <Icon name="check" size={11} strokeWidth={2.4} />
                </span>
                <span className={c.passed ? "text-ink-3 line-through decoration-line-strong" : "text-ink"}>{c.label}</span>
              </li>
            ))}
          </ul>
        )}
        {complete && (
          <div className="flex items-center justify-between gap-3 rounded-[8px] bg-ink px-3 py-2.5 text-surface">
            <span className="text-[12px] font-bold uppercase tracking-[0.1em]">Lesson complete</span>
            {next && (
              <Link href={next.href} className="flex items-center gap-1 text-[11.5px] font-semibold text-signal">
                Next <Icon name="chevR" size={14} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
