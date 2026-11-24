"use client";
/**
 * Roadmap: the left panel of the desktop workspace.
 *
 * It answers "where am I in this discipline, and what is in this scene?" in one
 * place: the discipline's lessons in order (done, current, next), and a second
 * view listing the scene's parts so any of them can be selected without finding
 * it in the 3D view. Phone has the same two lists in its bottom flyouts.
 */
import { useState } from "react";
import Link from "next/link";
import type { Discipline, Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";
import { useWorkspace } from "@/engine/store";
import { Icon } from "@/components/ui/Icon";

export interface LessonCard {
  id: string;
  title: string;
  order: number;
  href: string;
  thumb: string;
  completed: boolean;
}

/** The scene's parts grouped by the manifest's groups, as selectable rows. */
export function PartsList({ lesson, manifest, adapter, onPick }: { lesson: Lesson; manifest: Manifest | null; adapter: DisciplineAdapter; onPick?: () => void }) {
  const select = useWorkspace((s) => s.select);
  const selectedId = useWorkspace((s) => s.selectedId);
  const groups = manifest ? manifest.groups : {};
  const byGroup = new Map<string, typeof lesson.parts>();
  for (const p of lesson.parts) {
    // A lesson can have several scenes (variants); list only parts in the one showing.
    if (manifest && !manifest.nodes[p.id]) continue;
    const g = p.group ?? "other";
    byGroup.set(g, [...(byGroup.get(g) ?? []), p]);
  }
  return (
    <div className="flex flex-col gap-2 p-1.5">
      {Array.from(byGroup.entries()).map(([g, parts]) => (
        <div key={g}>
          <div className="micro flex items-center gap-1.5 px-2.5 pb-1 pt-1.5">
            {groups[g] && <span className="h-2 w-2 rounded-full" style={{ background: groups[g].color }} />}
            {groups[g]?.label ?? "Other"}
          </div>
          {parts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (!manifest) return;
                // Let the discipline reveal the part first (peel layers, open the cut) so the camera does not fly to something hidden.
                adapter.reveal?.(p.id, lesson, manifest);
                const n = manifest.nodes[p.id];
                select(p.id, n ? { fly: n.camera } : undefined);
                onPick?.();
              }}
              className={`block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[14px] hover:bg-ground-deep ${selectedId === p.id ? "bg-ground-deep font-semibold text-ink" : "text-ink-2"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function RoadmapPanel({
  discipline,
  lesson,
  manifest,
  adapter,
  cards,
}: {
  discipline: Discipline;
  lesson: Lesson;
  manifest: Manifest | null;
  adapter: DisciplineAdapter;
  cards: LessonCard[];
}) {
  const [view, setView] = useState<"lessons" | "parts">("lessons");
  const done = cards.filter((c) => c.completed).length;
  const hasParts = !!manifest && lesson.parts.length > 0;
  const tab = (id: "lessons" | "parts", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === id}
      onClick={() => setView(id)}
      className={`micro flex-1 rounded-[7px] px-2 py-1.5 !text-[11px] transition-colors ${view === id ? "!bg-ink !text-surface" : "hover:!text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <nav aria-label="Roadmap" className="absolute bottom-3 left-3 top-[68px] z-30 flex w-[var(--roadmap-w)] flex-col overflow-hidden rounded-[10px] border border-line bg-surface">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="micro">Roadmap</div>
        <h2 className="mt-1 text-[22px] font-bold leading-none text-ink">{discipline.name}</h2>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${(done / Math.max(cards.length, 1)) * 100}%` }} />
          </div>
          <span className="font-mono text-[11.5px] text-ink">
            {done}/{cards.length}
          </span>
        </div>
      </div>

      {hasParts && (
        <div role="tablist" aria-label="Roadmap view" className="mx-3 mb-2 flex shrink-0 gap-1 rounded-[9px] border border-line bg-ground p-1">
          {tab("lessons", "Lessons")}
          {tab("parts", "Parts")}
        </div>
      )}

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {view === "lessons" || !hasParts ? (
          <ol className="flex flex-col gap-1">
            {cards.map((c) => {
              const current = c.id === lesson.id;
              return (
                <li key={c.id}>
                  <Link
                    href={c.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-[9px] border px-3 py-2.5 transition-colors ${
                      current ? "border-teal bg-ground" : "border-transparent hover:bg-ground-deep"
                    }`}
                  >
                    <span
                      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold ${
                        current ? "border-ink bg-ink text-surface" : c.completed ? "border-teal bg-teal text-white" : "border-line-strong text-ink-2"
                      }`}
                    >
                      {c.completed && !current ? <Icon name="check" size={14} strokeWidth={2.6} /> : c.order}
                    </span>
                    <span className={`min-w-0 flex-1 text-[15px] leading-tight ${current ? "font-semibold text-ink" : "text-ink-2"}`}>{c.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <PartsList lesson={lesson} manifest={manifest} adapter={adapter} />
        )}
      </div>

      <div className="shrink-0 p-3">
        <Link href={`/learn/${discipline.id}`} className="flex h-[42px] items-center justify-center gap-1.5 rounded-[9px] border border-line-strong text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ground-deep" style={{ fontFamily: "var(--font-display)" }}>
          <Icon name="chevL" size={14} /> Back to roadmap
        </Link>
      </div>
    </nav>
  );
}
