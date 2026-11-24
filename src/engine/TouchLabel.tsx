"use client";
/**
 * TouchLabel
 * ==========
 * A label that comes out of the model wherever you touch it. Hovering any part
 * (desktop) or tapping one (any device) draws a dot on the exact point touched,
 * a short leader line out from it, and the part's name in a tag at the end.
 *
 * It complements the Callouts: those are a curated few at rest; this works for
 * EVERY part, including small ones that never get a callout (a carpal bone, the
 * nasal bones, a ribosome).
 *
 * The leader angles away from the model's centre on screen, so the tag lands in
 * empty space rather than on top of what it names.
 *
 * Hidden while an identify round is being answered: naming what you hover would
 * give the answer away.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { Lesson } from "@/content/schema";
import { usePractice } from "@/engine/practice";
import { useSceneContext } from "./SemanticScene";
import { touch } from "./touch";
import { useWorkspace } from "./store";

const LEAD = 46; // leader length in px

export function TouchLabel({ lesson }: { lesson: Lesson }) {
  const ctx = useSceneContext();
  const hoveredId = useWorkspace((s) => s.hoveredId);
  const selectedId = useWorkspace((s) => s.selectedId);
  const answering = usePractice((s) => s.active);
  const invalidate = useThree((s) => s.invalidate);

  const names = useMemo(() => new Map(lesson.parts.map((p) => [p.id, p.name])), [lesson.parts]);
  const centre = useMemo(() => {
    if (!ctx) return new THREE.Vector3();
    const b = ctx.manifest.bounds;
    return new THREE.Vector3((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2);
  }, [ctx]);

  // Hover wins over the selection label: it is what the student is looking at now.
  const showId = answering ? null : hoveredId ?? selectedId;
  const isHover = !!hoveredId && showId === hoveredId;

  const dot = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const t = window.setTimeout(invalidate, 30);
    return () => window.clearTimeout(t);
  }, [invalidate, showId]);

  useFrame(({ camera, size }) => {
    if (!ctx || !showId || !dot.current || !tag.current || !line.current) return;
    // The exact touched point if we have it; otherwise the part's anchor (picked from a list).
    const p = isHover && touch.hover?.id === showId ? touch.hover.point : touch.selected.get(showId);
    const a = ctx.manifest.nodes[showId]?.anchor;
    if (p) v.copy(p);
    else if (a) v.set(a[0], a[1], a[2]);
    else return;
    v.project(camera);
    c.copy(centre).project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width, y = (-v.y * 0.5 + 0.5) * size.height;
    const cx = (c.x * 0.5 + 0.5) * size.width, cy = (-c.y * 0.5 + 0.5) * size.height;
    // Leader direction: away from the model centre, biased upward so the tag rarely covers the part.
    let dx = x - cx, dy = y - cy - 40;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const ex = x + dx * LEAD, ey = y + dy * LEAD;
    dot.current.style.transform = `translate(${x - 5}px, ${y - 5}px)`;
    line.current.setAttribute("x1", String(x));
    line.current.setAttribute("y1", String(y));
    line.current.setAttribute("x2", String(ex));
    line.current.setAttribute("y2", String(ey));
    const w = tag.current.offsetWidth, h = tag.current.offsetHeight;
    const left = dx >= 0 ? ex + 2 : ex - w - 2;
    tag.current.style.transform = `translate(${Math.max(8, Math.min(size.width - w - 8, left))}px, ${ey - h / 2}px)`;
    const visible = v.z < 1;
    for (const el of [dot.current, tag.current]) el.style.display = visible ? "" : "none";
    line.current.style.display = visible ? "" : "none";
  });

  if (!ctx || !showId || !names.has(showId)) return null;
  const node = ctx.manifest.nodes[showId];
  const color = node?.group ? ctx.manifest.groups[node.group]?.color : undefined;

  return (
    <Html fullscreen zIndexRange={[35, 0]} style={{ pointerEvents: "none" }} calculatePosition={(_el, _cam, s) => [s.width / 2, s.height / 2]}>
      <div className="absolute inset-0" aria-live="polite">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <line ref={line} stroke="var(--ink)" strokeWidth="1.25" />
        </svg>
        <div
          ref={dot}
          className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-2 border-surface"
          style={{ background: "var(--teal)", transform: "translate(-9999px,0)", boxShadow: "0 0 0 1px var(--ink)" }}
        />
        <div
          ref={tag}
          className="forma-touch-tag absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border border-ink bg-surface-raised px-2 py-[5px] text-[11px] font-bold uppercase tracking-[0.08em] text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          style={{ transform: "translate(-9999px,0)" }}
        >
          {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
          {names.get(showId)}
        </div>
      </div>
    </Html>
  );
}
