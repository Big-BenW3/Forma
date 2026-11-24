"use client";
/**
 * Workspace: the lesson screen.
 *
 * Desktop (>= 1000px) has four zones:
 *   masthead (floating, top-left) | roadmap (left) | canvas (centre)
 *   | right panel: reference tabs, practice
 * Phone: full-bleed canvas, a bottom tab bar, and ONE bottom sheet that holds
 * the inspector (when a part is selected) or the reference + practice.
 *
 * This component is discipline-agnostic. Everything discipline-specific comes
 * from the adapter and the lesson record; see src/disciplines/types.ts.
 */
import { LogoMark } from "@/components/brand/Logo";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Discipline, Lesson, Manifest } from "@/content/schema";
import { getAdapter } from "@/disciplines/registry";
import { Stage } from "@/engine/Stage";
import { useWorkspace, type SheetDetent } from "@/engine/store";
import { usePractice } from "@/engine/practice";
import { useIsCompact } from "@/lib/useMedia";
import { useQuality } from "@/lib/prefs";
import { fetchServerCompleted, readLocalCompleted, submitCompletion, writeLocalCompleted } from "@/lib/progress";
import { ControlBar } from "./ControlBar";
import { InspectorAnchor, InspectorCard } from "./Inspector";
import { Flyouts, Rail } from "./Rail";
import { RoadmapPanel, type LessonCard } from "./Roadmap";
import { Practice, ProgressHeader, Reference, useSnapshot, useVerdict } from "./ContextPanel";
import { Icon } from "@/components/ui/Icon";

export interface WorkspaceProps {
  discipline: Discipline;
  lesson: Lesson;
  /** Manifest for the main scene, and for each declared variant scene */
  manifests: Record<string, Manifest>;
  cards: Omit<LessonCard, "completed">[];
}

const SHEET_HEIGHT: Record<SheetDetent, string> = { peek: "92px", half: "50vh", full: "88vh" };

export function Workspace({ discipline, lesson, manifests, cards }: WorkspaceProps) {
  const compact = useIsCompact();
  const adapter = useMemo(() => getAdapter(discipline.adapter), [discipline.adapter]);
  const lessonKey = `${discipline.id}/${lesson.id}`;
  const [quality, setQuality] = useQuality();

  // --- lesson lifecycle: reset transient state when the lesson changes
  const variant = useWorkspace((s) => s.variant);
  const startLesson = useWorkspace((s) => s.startLesson);
  const startPractice = usePractice((s) => s.start);
  useEffect(() => {
    const defaults: Record<string, Record<string, string>> = {};
    for (const p of lesson.parts) if (p.control) defaults[p.id] = { [p.control.key]: p.control.default };
    startLesson(lessonKey, { controls: defaults });
    startPractice(lessonKey, (lesson.options.starterCode as string | undefined) ?? "");
    // First visit lands on the discipline's first tab.
    if (!useWorkspace.getState().activeTab) useWorkspace.getState().setActiveTab(discipline.tabs[0].id);
  }, [lessonKey, lesson, discipline.tabs, startLesson, startPractice]);

  const manifest = manifests[variant ?? "main"] ?? manifests.main ?? null;
  const sceneLesson = lesson;

  // --- progress
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    setCompleted(readLocalCompleted());
    // Signed-in students also have a server list; show the union (it is never written back to local storage).
    let alive = true;
    void fetchServerCompleted().then((server) => {
      if (alive && server.length) setCompleted((c) => Array.from(new Set([...c, ...server])));
    });
    return () => {
      alive = false;
    };
  }, []);
  const snapshot = useSnapshot(lessonKey);
  const verdict = useVerdict(lesson, snapshot);
  const complete = completed.includes(lessonKey);
  useEffect(() => {
    if (!verdict.passed || complete) return;
    // Record locally right away; the server re-runs the validator and is the source of truth for signed-in users.
    const next = [...completed, lessonKey];
    setCompleted(next);
    writeLocalCompleted(next);
    void submitCompletion(lessonKey, snapshot);
  }, [verdict.passed, complete, completed, lessonKey, snapshot]);

  const withDone: LessonCard[] = useMemo(
    () => cards.map((c) => ({ ...c, completed: completed.includes(`${discipline.id}/${c.id}`) })),
    [cards, completed, discipline.id],
  );
  const idx = cards.findIndex((c) => c.id === lesson.id);
  const nextCard = idx >= 0 && idx < cards.length - 1 ? cards[idx + 1] : null;
  const next = nextCard ? { href: nextCard.href, title: nextCard.title } : null;

  const selectedId = useWorkspace((s) => s.selectedId);
  const practiceActive = usePractice((s) => s.active);
  const selectedPart = lesson.parts.find((p) => p.id === selectedId);
  const sheet = useWorkspace((s) => s.sheet);
  const setSheet = useWorkspace((s) => s.setSheet);

  // Phone: selecting a part lifts the sheet from peek to half so the card is readable.
  useEffect(() => {
    if (compact && selectedId && !practiceActive && useWorkspace.getState().sheet === "peek") setSheet("half");
  }, [compact, selectedId, practiceActive, setSheet]);

  const cycleSheet = useCallback(() => setSheet(sheet === "peek" ? "half" : sheet === "half" ? "full" : "peek"), [sheet, setSheet]);

  // Terminal lessons have no 3D scene: the adapter's Stage fills the centre instead.
  const terminal = lesson.layout === "terminal";
  const TerminalStage = terminal ? adapter.Stage : undefined;
  const stage = terminal ? (
    TerminalStage ? <TerminalStage lesson={sceneLesson} manifest={manifest} /> : null
  ) : manifest ? (
    <Stage lesson={sceneLesson} manifest={manifest} cut={adapter.cut?.(lesson)} ground={adapter.ground?.(lesson) ?? true} quality={quality} compact={compact}>
      {adapter.SceneExtras && <adapter.SceneExtras lesson={sceneLesson} manifest={manifest} />}
      {/* Desktop: the inspector hangs off the part. Phone: it lives in the sheet. */}
      {!compact && !practiceActive && <InspectorAnchor lesson={lesson} manifest={manifest} adapter={adapter} />}
    </Stage>
  ) : null;

  // A terminal lesson has no manifest, but still has reference tabs and a practice card.
  const reference =
    manifest || terminal ? (
      <>
        <Reference discipline={discipline} lesson={lesson} manifest={manifest} adapter={adapter} />
        <Practice discipline={discipline} lesson={lesson} verdict={verdict} snapshot={snapshot} adapter={adapter} complete={complete} next={next} tall={terminal || lesson.options.tallPractice === true} />
      </>
    ) : null;

  // The editor needs room: terminal lessons get a wider right panel on desktop.
  const panelW = terminal ? "min(600px, 46vw)" : "var(--panel-w)";

  const flyout = useWorkspace((s) => s.flyout);
  const setFlyout = useWorkspace((s) => s.setFlyout);
  const masthead = (
    <div className="pointer-events-none absolute left-3 top-3 z-30 flex items-center gap-2.5">
      <Link href="/home" className="pointer-events-auto flex h-[44px] items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5" aria-label="FORMA home">
        <LogoMark size={22} />
        <span className="text-[14px] font-bold tracking-[0.2em] text-ink" style={{ fontFamily: "var(--font-display)" }}>FORMA</span>
      </Link>
      <div className="pointer-events-auto hidden h-[44px] items-center rounded-[10px] border border-line bg-surface px-3.5 sm:flex">
        <span className="micro mr-2">{discipline.name}</span>
        <span className="text-[14px] font-semibold text-ink">{lesson.title}</span>
      </div>
    </div>
  );
  const settingsButton = (
    <button
      type="button"
      aria-label="Settings"
      aria-pressed={flyout === "settings"}
      onClick={() => setFlyout(flyout === "settings" ? null : "settings")}
      className={`pointer-events-auto absolute top-3 z-30 flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-line transition-colors ${flyout === "settings" ? "bg-ink text-surface" : "bg-surface text-ink-2 hover:text-ink"}`}
      style={{ right: "calc(var(--panel-live) + 36px)" }}
    >
      <Icon name="gear" size={18} />
    </button>
  );

  if (compact) {
    return (
      <div className="paper fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0" style={{ bottom: `calc(${SHEET_HEIGHT[sheet]} + 56px)`, transition: "bottom 220ms ease" }}>
          {stage}
          <div className="absolute left-2 top-2 z-30 flex h-[38px] items-center rounded-[10px] border border-line bg-surface-raised px-3">
            <span className="text-[13px] font-bold tracking-[0.18em] text-ink" style={{ fontFamily: "var(--font-display)" }}>FORMA</span>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex justify-center">{manifest && <ControlBar lesson={lesson} manifest={manifest} adapter={adapter} />}</div>
        </div>

        <section
          aria-label="Lesson panel"
          className="absolute inset-x-0 z-50 flex flex-col rounded-t-[16px] border border-b-0 border-line-strong bg-ground shadow-[0_-8px_28px_rgba(26,34,48,0.14)]"
          style={{ bottom: "56px", height: SHEET_HEIGHT[sheet], transition: "height 220ms ease" }}
        >
          <button type="button" onClick={cycleSheet} aria-label="Resize panel" className="flex shrink-0 flex-col items-center gap-1 pb-1 pt-2">
            <span className="h-[4px] w-9 rounded-full bg-line-strong" />
            {sheet === "peek" && <span className="micro">{selectedPart ? selectedPart.name : lesson.title} · tap to open</span>}
          </button>
          {sheet !== "peek" && (
            <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
              {selectedPart && manifest && !practiceActive ? (
                <div className="rounded-[10px] border border-line bg-surface p-3.5">
                  <InspectorCard part={selectedPart} lesson={lesson} manifest={manifest} adapter={adapter} embedded />
                </div>
              ) : (
                <ProgressHeader discipline={discipline} lesson={lesson} completed={completed} />
              )}
              <div className="flex min-h-[360px] flex-1 flex-col gap-2.5">{reference}</div>
            </div>
          )}
        </section>

        <Flyouts compact discipline={discipline} lesson={lesson} manifest={manifest} adapter={adapter} cards={withDone} quality={quality} setQuality={setQuality} />
        <Rail />
      </div>
    );
  }

  return (
    <div className="paper fixed inset-0 overflow-hidden" style={{ "--panel-live": panelW } as React.CSSProperties}>
      {/* centre canvas, between the roadmap and the right panel */}
      <div className="absolute inset-y-0" style={{ left: "calc(var(--roadmap-w) + 12px)", right: `calc(${panelW} + 12px)` }}>
        {stage}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center">
          {manifest && <ControlBar lesson={lesson} manifest={manifest} adapter={adapter} />}
        </div>
      </div>

      {masthead}
      {settingsButton}
      <RoadmapPanel discipline={discipline} lesson={lesson} manifest={manifest} adapter={adapter} cards={withDone} />
      <Flyouts compact={false} discipline={discipline} lesson={lesson} manifest={manifest} adapter={adapter} cards={withDone} quality={quality} setQuality={setQuality} />

      <aside aria-label="Lesson panel" className="absolute bottom-3 right-3 top-3 z-30 flex flex-col gap-2.5" style={{ width: panelW }}>
        {reference}
      </aside>
    </div>
  );
}
