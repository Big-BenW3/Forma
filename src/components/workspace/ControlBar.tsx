"use client";
/**
 * The floating pill under the canvas: undo, redo, zoom out/in, reset view,
 * labels on/off, then whatever the discipline adds (cut-away slider, layer
 * peel, signals...) via its adapter's ToolbarExtra.
 */
import type { Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";
import { useWorkspace } from "@/engine/store";
import { Icon } from "@/components/ui/Icon";

export function ToolButton({
  icon,
  label,
  onClick,
  pressed,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-[7px] transition-colors disabled:opacity-35 ${
        pressed ? "bg-teal-soft text-teal-strong" : "text-ink-2 hover:bg-ground-deep hover:text-ink"
      }`}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

export function ControlBar({ lesson, manifest, adapter }: { lesson: Lesson; manifest: Manifest; adapter: DisciplineAdapter }) {
  const s = useWorkspace();
  const Extra = adapter.ToolbarExtra;
  const variant = s.variant;
  return (
    <div
      role="toolbar"
      aria-label="Scene controls"
      className="pointer-events-auto flex max-w-[calc(100%-16px)] flex-wrap items-center justify-center gap-0.5 rounded-[12px] border border-line-strong bg-surface-raised/95 px-1.5 py-1 backdrop-blur-[2px]"
    >
      {variant && (
        <button
          type="button"
          onClick={() => s.setVariant(null)}
          className="mr-1 flex items-center gap-1 rounded-[7px] bg-ink px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-surface"
        >
          <Icon name="chevL" size={13} /> Back
        </button>
      )}
      <ToolButton icon="undo" label="Undo" onClick={s.undo} disabled={s.past.length === 0} />
      <ToolButton icon="redo" label="Redo" onClick={s.redo} disabled={s.future.length === 0} />
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolButton icon="minus" label="Zoom out" onClick={() => s.requestCamera({ kind: "dolly", amount: -0.35 })} />
      <ToolButton icon="plus" label="Zoom in" onClick={() => s.requestCamera({ kind: "dolly", amount: 0.35 })} />
      <ToolButton icon="reset" label="Reset view" onClick={s.resetView} />
      <ToolButton icon="tag" label={s.labels ? "Hide labels" : "Show labels"} pressed={s.labels} onClick={() => s.setLabels(!s.labels)} />
      {Extra && (
        <>
          <span className="mx-1 h-5 w-px bg-line" />
          <Extra lesson={lesson} manifest={manifest} />
        </>
      )}
    </div>
  );
}
