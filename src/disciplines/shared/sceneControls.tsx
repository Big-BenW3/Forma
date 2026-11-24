"use client";
/**
 * Shared scene controls
 * =====================
 * Controls that more than one discipline uses on a 3D scene: the cut-away
 * slider, the layer peel slider, "Isolate selected", the variant button in an
 * inspector card, and the layer-aware `reveal`. They read lesson.options and the
 * manifest, so a discipline adapter composes them instead of re-implementing them.
 */
import type { Lesson, Manifest, Part } from "@/content/schema";
import type { SceneProps } from "../types";
import type { CutConfig } from "@/engine/Cutaway";
import { useWorkspace } from "@/engine/store";
import { peelNeededFor } from "@/engine/SemanticScene";
import { ToolButton } from "@/components/workspace/ControlBar";

/** Lesson option: `{ cut: { axis: "z", removes: 1, openTo?: 0.5 } }` enables the cut-away slider. */
export function cutOf(lesson: Lesson): CutConfig | undefined {
  const c = lesson.options.cut as { axis: "x" | "y" | "z"; removes: 1 | -1; openTo?: number } | undefined;
  // openTo: how far the slider sweeps (0.5 = to the centre of the model; larger stops nearer the far side)
  return c ? { axis: c.axis, removes: c.removes, openTo: c.openTo } : undefined;
}

export function Slider({ label, value, onChange, onCommit }: { label: string; value: number; onChange: (v: number) => void; onCommit?: () => void }) {
  return (
    <label className="flex items-center gap-2 px-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
      {label}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(+e.target.value)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="h-1 w-[96px] accent-[var(--teal)]"
      />
    </label>
  );
}

export function SceneToolbar({ lesson, manifest }: SceneProps) {
  const cutaway = useWorkspace((s) => s.cutaway);
  const setCutaway = useWorkspace((s) => s.setCutaway);
  const layerStep = useWorkspace((s) => s.layerStep);
  const setLayerStep = useWorkspace((s) => s.setLayerStep);
  const isolate = useWorkspace((s) => s.isolate);
  const setIsolate = useWorkspace((s) => s.setIsolate);
  const selectedId = useWorkspace((s) => s.selectedId);
  const hasCut = !!cutOf(lesson);
  const layers = manifest.layers;
  return (
    <>
      {hasCut && <Slider label="Cut-away" value={cutaway} onChange={(v) => setCutaway(v)} onCommit={() => useWorkspace.getState().commit()} />}
      {layers.length > 1 && (
        <label className="flex items-center gap-2 px-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Peel
          <input
            type="range"
            min={0}
            max={layers.length - 1}
            step={1}
            value={layerStep}
            aria-label="Peel layers"
            aria-valuetext={layers[layerStep]?.label}
            onChange={(e) => setLayerStep(+e.target.value)}
            className="h-1 w-[96px] accent-[var(--teal)]"
          />
        </label>
      )}
      <ToolButton label={isolate ? "Show everything" : "Isolate selected"} icon="isolate" pressed={isolate} disabled={!selectedId} onClick={() => setIsolate(!isolate)} />
    </>
  );
}

/** "Section this bone": switches to the cross-section variant scene, when the lesson declares one for this part. */
export function VariantButton({ lesson, part }: SceneProps & { part: Part }) {
  const setVariant = useWorkspace((s) => s.setVariant);
  const variants = (lesson.options.variants ?? {}) as Record<string, { forPart?: string[]; label: string }>;
  const entry = Object.entries(variants).find(([, v]) => v.forPart?.includes(part.id));
  if (!entry) return null;
  return (
    <button type="button" onClick={() => setVariant(entry[0])} className="rounded-[7px] border border-line-strong px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink hover:bg-ground-deep">
      {entry[1].label}
    </button>
  );
}


/** Peel only as far as needed to expose a part: remove the opaque layers covering it, never its own layer. */
export function revealPart(partId: string, _lesson: Lesson, manifest: Manifest) {
  const layer = manifest.nodes[partId]?.layer;
  const idx = manifest.layers.findIndex((l) => l.id === layer);
  if (idx < 0) return;
  const need = Math.min(peelNeededFor(layer, manifest), idx);
  const s = useWorkspace.getState();
  if (s.layerStep < need) s.setLayerStep(need);
  else if (s.layerStep > idx) s.setLayerStep(idx);
}
