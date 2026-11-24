"use client";
/**
 * Callouts
 * ========
 * The labels anchored to the 3D object. Two densities:
 *   - FULL (at rest): a card with a title and one line, joined by a leader to a
 *     dot that sits on the actual geometry.
 *   - PILL (zoomed in, something selected, or on a phone): the title only,
 *     beside the dot. The scene never fights itself for attention.
 *
 * Why FULL cards are laid out in screen space
 * -------------------------------------------
 * Anchors cluster (a cell's organelles are all inside one ellipsoid), so cards
 * placed relative to their own anchor overlap. Instead each card is assigned to
 * the left or right edge (`calloutSide`), the cards on an edge are stacked in
 * the order of their anchors' heights, and a minimum gap is enforced. They
 * cannot collide by construction, and the leaders still point at the right dot.
 *
 * Only parts marked `featured` get a callout; every other part is reachable from
 * the Parts flyout or by clicking it. The selected part's card is hidden here
 * because the inspector already shows it.
 *
 * Positions are written straight to the DOM in useFrame (no React state per
 * frame). With frameloop="demand" that runs only when something re-rendered,
 * i.e. when the camera moved, so an idle scene costs nothing.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { Lesson } from "@/content/schema";
import { layerExposed, useSceneContext } from "./SemanticScene";
import { useWorkspace } from "./store";

const CARD_W = 168;
const GAP = 8;
/** Where an element sits until its first layout pass places it (off-screen, so nothing flashes at 0,0) */
const PARKED = "translate(-9999px, 0)";
/** Space kept clear on each edge: left rail, right margin, masthead, control bar + lesson strip */
const INSET = { left: 88, right: 16, top: 68, bottom: 150 };

export function Callouts({ lesson, compact }: { lesson: Lesson; compact: boolean }) {
  const ctx = useSceneContext();
  const labels = useWorkspace((s) => s.labels);
  const selectedId = useWorkspace((s) => s.selectedId);
  const zoomedIn = useWorkspace((s) => s.zoomedIn);
  const layerStep = useWorkspace((s) => s.layerStep);
  const hoveredId = useWorkspace((s) => s.hoveredId);
  const select = useWorkspace((s) => s.select);

  const pill = zoomedIn || !!selectedId || compact;

  const parts = useMemo(
    // Featured parts that are in this scene AND not hidden behind an opaque layer.
    () =>
      ctx
        ? lesson.parts.filter((p) => {
            const n = ctx.manifest.nodes[p.id];
            return p.featured && !!n && layerExposed(n.layer, ctx.manifest, layerStep);
          })
        : [],
    [ctx, lesson.parts, layerStep],
  );

  // One entry of DOM refs per part, written to every frame.
  const dots = useRef<Record<string, HTMLButtonElement | null>>({});
  const cards = useRef<Record<string, HTMLButtonElement | null>>({});
  const pills = useRef<Record<string, HTMLButtonElement | null>>({});
  const lines = useRef<Record<string, SVGLineElement | null>>({});
  const v = useMemo(() => new THREE.Vector3(), []);

  // drei <Html> mounts its children through a portal AFTER the first render, and
  // a demand-mode canvas does not draw again by itself. Without this nudge the
  // first layout pass finds no elements and the labels would sit unplaced until
  // the user first moves the camera. Re-run the layout when what is shown changes.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const timers = [0, 60, 250].map((ms) => window.setTimeout(invalidate, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [invalidate, parts, pill, labels, selectedId, hoveredId]);

  useFrame(({ camera, size }) => {
    if (!ctx || !labels) return;
    const w = size.width;
    const h = size.height;

    // 1. project every anchor to pixels
    const pos: Record<string, { x: number; y: number; visible: boolean }> = {};
    for (const p of parts) {
      const a = ctx.manifest.nodes[p.id].anchor;
      v.set(a[0], a[1], a[2]).project(camera);
      pos[p.id] = { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 };
    }

    // 2. dots and pills follow their anchor
    for (const p of parts) {
      const { x, y, visible } = pos[p.id];
      const d = dots.current[p.id];
      if (d) {
        d.style.transform = `translate(${x - 7}px, ${y - 7}px)`;
        d.style.display = visible ? "" : "none";
      }
      const pl = pills.current[p.id];
      if (pl) {
        // Flip to the left of the dot when it would run off the right edge.
        const flip = x + 14 + pl.offsetWidth > w - 8;
        pl.style.transform = `translate(${flip ? x - 14 - pl.offsetWidth : x + 14}px, ${y - 10}px)`;
        pl.style.display = visible ? "" : "none";
      }
    }
    if (pill) return;

    // 3. stack FULL cards per side so they cannot overlap
    for (const side of ["left", "right"] as const) {
      const group = parts
        .filter((p) => (p.calloutSide === "left" ? "left" : "right") === side && p.id !== selectedId)
        .sort((a, b) => pos[a.id].y - pos[b.id].y);
      if (!group.length) continue;
      const heights = group.map((p) => cards.current[p.id]?.offsetHeight ?? 74);
      const x = side === "left" ? INSET.left : w - INSET.right - CARD_W;

      // target = centred on the anchor; then push down to respect the gap
      const ys = group.map((p, i) => pos[p.id].y - heights[i] / 2);
      for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + heights[i - 1] + GAP);
      // clamp to the usable band, pushing back up from the bottom
      const maxY = h - INSET.bottom;
      const last = ys.length - 1;
      if (ys[last] + heights[last] > maxY) {
        ys[last] = maxY - heights[last];
        for (let i = last - 1; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - heights[i] - GAP);
      }
      if (ys[0] < INSET.top) {
        ys[0] = INSET.top;
        for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + heights[i - 1] + GAP);
      }

      group.forEach((p, i) => {
        const c = cards.current[p.id];
        if (c) {
          c.style.transform = `translate(${x}px, ${ys[i]}px)`;
          c.style.display = pos[p.id].visible ? "" : "none";
        }
        const l = lines.current[p.id];
        if (l) {
          // leader leaves the card edge nearest the scene
          l.setAttribute("x1", String(side === "left" ? x + CARD_W : x));
          l.setAttribute("y1", String(ys[i] + heights[i] / 2));
          l.setAttribute("x2", String(pos[p.id].x));
          l.setAttribute("y2", String(pos[p.id].y));
        }
      });
    }
  });

  if (!ctx || !labels) return null;

  return (

    <Html fullscreen zIndexRange={[30, 0]} style={{ pointerEvents: "none" }} calculatePosition={(_el, _cam, size) => [size.width / 2, size.height / 2]}>
      <div className="absolute inset-0">
        {!pill && (
          <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {parts
              .filter((p) => p.id !== selectedId)
              .map((p) => (
                <line key={p.id} ref={(el) => void (lines.current[p.id] = el)} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />
              ))}
          </svg>
        )}
        {parts.map((part) => {
          const node = ctx.manifest.nodes[part.id];
          const isSelected = selectedId === part.id;
          const color = node.group ? ctx.manifest.groups[node.group]?.color : undefined;
          // drei <Html> mounts these in their own React root inside the canvas wrapper.
          // The click would bubble to R3F, which sees "nothing hit" and DESELECTS.
          // Stopping it here keeps a callout click a pure select.
          const go = (e: React.MouseEvent) => {
            e.stopPropagation();
            select(part.id, { fly: node.camera });
          };
          return (
            <div key={part.id}>
              <button
                type="button"
                ref={(el) => void (dots.current[part.id] = el)}
                aria-label={`Select ${part.name}`}
                onClick={go}
                className="pointer-events-auto absolute left-0 top-0 h-[14px] w-[14px] rounded-full border-2 transition-[background-color] hover:brightness-95"
                style={{
                  transform: PARKED,
                  background: isSelected || hoveredId === part.id ? "var(--teal)" : "var(--surface)",
                  borderColor: isSelected ? "var(--teal)" : (color ?? "var(--teal-strong)"),
                }}
              />
              {!isSelected &&
                (pill ? (
                  compact && !zoomedIn ? null : (
                  <button
                    type="button"
                    tabIndex={-1}
                    ref={(el) => void (pills.current[part.id] = el)}
                    onClick={go}
                    className="pointer-events-auto absolute left-0 top-0 whitespace-nowrap rounded-[5px] border border-line-strong bg-surface-raised/95 px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink"
                    style={{ transform: PARKED }}
                  >
                    {part.name}
                  </button>
                  )
                ) : (
                  <button
                    type="button"
                    tabIndex={-1}
                    ref={(el) => void (cards.current[part.id] = el)}
                    onClick={go}
                    className="pointer-events-auto absolute left-0 top-0 rounded-[8px] border border-line bg-surface-raised/95 p-2.5 text-left"
                    style={{ width: CARD_W, transform: PARKED }}
                  >
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink">{part.name}</div>
                    <div className="mt-1 line-clamp-3 text-[11px] leading-snug text-ink-2">{part.summary}</div>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </Html>
  );
}
