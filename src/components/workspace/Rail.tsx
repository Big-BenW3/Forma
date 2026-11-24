"use client";
/**
 * Phone navigation and flyouts.
 *
 * Phone: four items form a bottom tab bar (Home, Lessons, Parts, Settings) and
 * their content opens as a sheet above it. Desktop has no rail: the roadmap
 * panel (Roadmap.tsx) holds the lessons and parts, and the settings flyout is
 * opened from the masthead. The flyout content is shared by both.
 */
import Link from "next/link";
import type { Discipline, Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";
import { useWorkspace, type Flyout } from "@/engine/store";
import { Icon } from "@/components/ui/Icon";
import { QUALITIES } from "@/lib/prefs";
import type { Quality } from "@/engine/Stage";
import { PartsList, type LessonCard } from "./Roadmap";

const ITEMS: Array<{ id: "home" | Exclude<Flyout, null>; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "home" },
  { id: "lessons", label: "Lessons", icon: "book" },
  { id: "parts", label: "Parts", icon: "parts" },
  { id: "settings", label: "Settings", icon: "gear" },
];

export function Rail() {
  const flyout = useWorkspace((s) => s.flyout);
  const setFlyout = useWorkspace((s) => s.setFlyout);

  const items = ITEMS.map((it) => {
    const target: Flyout = it.id === "home" ? null : it.id;
    const active = target !== null && flyout === target;
    const cls = `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[9px] py-1.5 transition-colors ${active ? "bg-ink text-surface" : "text-ink-2 hover:bg-ground-deep hover:text-ink"}`;
    const inner = (
      <>
        <Icon name={it.icon} size={20} />
        <span className="text-[10.5px] font-semibold">{it.label}</span>
      </>
    );
    return it.id === "home" ? (
      <Link key={it.id} href="/home" className={cls} aria-label="Home">
        {inner}
      </Link>
    ) : (
      <button key={it.id} type="button" className={cls} aria-label={it.label} aria-pressed={active} onClick={() => setFlyout(active ? null : target)}>
        {inner}
      </button>
    );
  });

  return (
    <nav aria-label="Workspace" className="pointer-events-auto fixed inset-x-0 bottom-0 z-[60] flex border-t border-line bg-surface-raised px-2 pb-[max(env(safe-area-inset-bottom),4px)] pt-1">
      {items}
    </nav>
  );
}

/** The flyout content for Lessons, Parts and Settings. */
export function Flyouts({
  compact,
  lesson,
  manifest,
  adapter,
  cards,
  quality,
  setQuality,
}: {
  compact: boolean;
  discipline: Discipline;
  lesson: Lesson;
  manifest: Manifest | null;
  adapter: DisciplineAdapter;
  cards: LessonCard[];
  quality: Quality;
  setQuality: (q: Quality) => void;
}) {
  const flyout = useWorkspace((s) => s.flyout);
  const setFlyout = useWorkspace((s) => s.setFlyout);
  const labels = useWorkspace((s) => s.labels);
  const setLabels = useWorkspace((s) => s.setLabels);
  if (!flyout) return null;

  const pos = compact
    ? "fixed inset-x-2 bottom-[64px] z-[55] max-h-[60vh]"
    : "absolute right-[calc(var(--panel-live,var(--panel-w))+36px)] top-[64px] z-20 max-h-[calc(100%-160px)] w-[260px]";
  const style = undefined;

  const title = flyout === "lessons" ? "Lessons" : flyout === "parts" ? "Parts" : "Settings";

  return (
    <div className={`${pos} pointer-events-auto thin-scroll flex flex-col overflow-y-auto rounded-[12px] border border-line-strong bg-surface-raised shadow-[0_8px_28px_rgba(26,34,48,0.12)]`} style={style} role="dialog" aria-label={title}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="micro">{title}</span>
        <button type="button" onClick={() => setFlyout(null)} aria-label="Close" className="text-ink-3 hover:text-ink">
          <Icon name="x" size={15} />
        </button>
      </div>

      {flyout === "lessons" && (
        <ul className="flex flex-col p-1.5">
          {cards.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                onClick={() => setFlyout(null)}
                className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] hover:bg-ground-deep ${c.id === lesson.id ? "font-bold text-ink" : "text-ink-2"}`}
              >
                <span className="w-4 font-mono text-[11px] text-ink-3">{c.order}</span>
                <span className="flex-1">{c.title}</span>
                {c.completed && <Icon name="check" size={14} className="text-ok" />}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {flyout === "parts" && <PartsList lesson={lesson} manifest={manifest} adapter={adapter} onPick={compact ? () => setFlyout(null) : undefined} />}

      {flyout === "settings" && (
        <div className="flex flex-col gap-4 p-3.5">
          <div>
            <div className="micro mb-1.5">Graphics</div>
            <div className="flex flex-col gap-1">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuality(q.id)}
                  aria-pressed={quality === q.id}
                  className={`flex items-baseline justify-between rounded-[8px] border px-2.5 py-1.5 text-left ${quality === q.id ? "border-ink bg-ground-deep" : "border-line hover:border-line-strong"}`}
                >
                  <span className="text-[12.5px] font-semibold text-ink">{q.label}</span>
                  <span className="text-[11px] text-ink-3">{q.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
            Part labels
            <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} className="h-4 w-4 accent-[var(--teal)]" />
          </label>
          <Link href="/settings" className="text-[12px] font-semibold text-teal-strong">
            All settings
          </Link>
        </div>
      )}
    </div>
  );
}
