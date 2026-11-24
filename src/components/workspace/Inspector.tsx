"use client";
/**
 * Inspector card
 * ==============
 * What opens when you click a part. Always the same shape, in this order:
 *
 *   1. the part's name and a close button,
 *   2. ONE plain sentence of what it is,
 *   3. a divider,
 *   4. a control group, where the part has a behaviour worth changing,
 *      and one sentence of consequence that updates live with that control
 *      (parts without a control show what they do instead),
 *   5. quick facts and the "if it fails" line, where the part has them,
 *   6. a footer: "Zoom to it", plus any discipline-specific action.
 *
 * Not a tooltip, not a name badge: identity, a live control, the consequence
 * and a way in. Desktop anchors it to the part with a dashed leader; the
 * phone layout shows the same card inside the bottom sheet.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Lesson, Manifest, Part } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";
import { useSceneContext } from "@/engine/SemanticScene";
import { useWorkspace } from "@/engine/store";
import { Icon } from "@/components/ui/Icon";

export function InspectorCard({
  part,
  lesson,
  manifest,
  adapter,
  embedded = false,
}: {
  part: Part;
  lesson: Lesson;
  manifest: Manifest;
  adapter: DisciplineAdapter;
  /** True inside the phone sheet (no shadow-box styling, no anchor) */
  embedded?: boolean;
}) {
  const controls = useWorkspace((s) => s.controls);
  const setControl = useWorkspace((s) => s.setControl);
  const select = useWorkspace((s) => s.select);
  const requestCamera = useWorkspace((s) => s.requestCamera);
  const node = manifest.nodes[part.id];
  const Extra = adapter.InspectorExtra;

  const ctl = part.control;
  const current = ctl ? (controls[part.id]?.[ctl.key] ?? ctl.default) : null;
  const effect = ctl?.options.find((o) => o.value === current)?.effect;

  return (
    <div
      role="dialog"
      aria-label={part.name}
      // Clicks inside the card must not reach the canvas (which would treat them as "clicked empty space" and deselect).
      onClick={(e) => e.stopPropagation()}
      className={
        embedded
          ? "flex flex-col gap-3"
          : "thin-scroll pointer-events-auto flex max-h-[min(440px,64vh)] w-[272px] flex-col gap-3 overflow-auto rounded-[10px] border border-line-strong bg-surface-raised/97 p-3.5 backdrop-blur-[2px]"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[11.5px] font-bold uppercase leading-tight tracking-[0.11em] text-ink">{part.name}</h3>
        <button
          type="button"
          onClick={() => select(null)}
          aria-label="Close"
          className="-mr-1 -mt-1 rounded p-1 text-ink-3 hover:text-ink"
        >
          <Icon name="x" size={15} />
        </button>
      </div>

      <p className="text-[13px] leading-[1.45] text-ink">{part.summary}</p>
      <hr className="border-line" />

      {ctl && (
        <div className="flex flex-col gap-2">
          <div className="micro">{ctl.label}</div>
          <div role="radiogroup" aria-label={ctl.label} className="flex gap-1.5">
            {ctl.options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={current === o.value}
                onClick={() => setControl(part.id, ctl.key, o.value)}
                className={`rounded-[6px] border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                  current === o.value
                    ? "border-ink bg-ink text-surface"
                    : "border-line-strong text-ink-2 hover:border-ink hover:text-ink"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] leading-[1.45] text-ink-2" aria-live="polite">
            {effect}
          </p>
        </div>
      )}

      {!ctl && <p className="text-[12.5px] leading-[1.5] text-ink-2">{part.does}</p>}

      {part.facts && part.facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-1.5">
          {part.facts.map((f) => (
            <div key={f.label} className="rounded-[6px] border border-line bg-surface px-2 py-1.5">
              <dt className="micro !text-[8.5px]">{f.label}</dt>
              <dd className="mt-0.5 font-mono text-[11.5px] leading-snug text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {part.consequence && (
        <div className="rounded-[6px] border-l-2 border-accent bg-accent-soft px-2.5 py-2">
          <div className="micro !text-[9px] !text-accent-strong">{part.consequenceLabel ?? "If it fails"}</div>
          <p className="mt-1 text-[12px] leading-[1.45] text-ink">{part.consequence}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <button
          type="button"
          onClick={() => requestCamera({ kind: "goto", ...node.camera })}
          className="flex items-center gap-1.5 rounded-[6px] border border-line-strong px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink hover:border-ink"
        >
          <Icon name="target" size={13} />
          Zoom to it
        </button>
        {Extra ? <Extra part={part} lesson={lesson} manifest={manifest} /> : <span className="text-[10.5px] text-ink-3">Try it in the scene</span>}
      </div>
    </div>
  );
}

/**
 * Desktop: the card hangs off the part's anchor point, with a dashed leader.
 * Rendered inside the canvas so <Html> keeps it attached as the camera moves.
 */
export function InspectorAnchor({ lesson, manifest, adapter }: { lesson: Lesson; manifest: Manifest; adapter: DisciplineAdapter }) {
  const ctx = useSceneContext();
  const selectedId = useWorkspace((s) => s.selectedId);
  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const invalidate = useThree((st) => st.invalidate);

  // The Html portal mounts after the first frame, and a demand-mode canvas will not
  // draw again on its own, so nudge a few frames after the selection changes.
  useEffect(() => {
    const timers = [0, 60, 250].map((ms) => window.setTimeout(invalidate, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [invalidate, selectedId]);

  // Keep the card on screen: hang it to the right of the anchor, flip to the left when
  // there is no room, and slide it vertically between the top bar and the toolbar.
  useFrame(({ camera, size }) => {
    const el = card.current;
    const n = selectedId ? manifest.nodes[selectedId] : undefined;
    if (!el || !n) return;
    v.set(n.anchor[0], n.anchor[1], n.anchor[2]).project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    const right = x + 40 + cw <= size.width - 12;
    const left = right ? 40 : -40 - cw;
    const minTop = 64 - y;
    const maxTop = size.height - Math.min(ch, Math.max(200, size.height - 64 - 150)) - 150 - y; // keep clear of the bottom toolbar
    const top = Math.max(minTop, Math.min(-36, maxTop));
    // Tall cards scroll inside the free band instead of running under the toolbar.
    el.style.maxHeight = `${Math.max(200, size.height - 64 - 150)}px`;
    el.style.overflowY = "auto";
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
    line.current?.setAttribute("x2", String(right ? 40 : -40));
    line.current?.setAttribute("y2", String(Math.max(-60, Math.min(60, top + 28))));
  });

  if (!ctx || !selectedId) return null;
  const part = lesson.parts.find((p) => p.id === selectedId);
  const node = manifest.nodes[selectedId];
  if (!part || !node) return null;
  return (
    <Html key={selectedId} position={node.anchor} zIndexRange={[50, 40]} style={{ pointerEvents: "none" }}>
      <div className="relative" style={{ width: 0, height: 0 }}>
        <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
          <line ref={line} x1="0" y1="0" x2="40" y2="-36" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
        <div className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full border-2 border-surface bg-teal ring-1 ring-ink" />
        <div ref={card} className="absolute" style={{ left: 40, top: -36, visibility: "hidden" }}>
          <InspectorCard part={part} lesson={lesson} manifest={manifest} adapter={adapter} />
        </div>
      </div>
    </Html>
  );
}
