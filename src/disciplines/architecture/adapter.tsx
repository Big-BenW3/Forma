"use client";
/**
 * Architecture adapter.
 *
 *   - Roof toggle: peels the roof layer (a covering layer in the manifest).
 *   - Walls to outline: solid walls become thin edge lines, so rooms read like the plan.
 *   - Section plane: the shared cut-away, set to a HORIZONTAL plane (axis y) that
 *     starts above the roof and can be dragged down through the walls. Cut walls get a
 *     solid dark face, the way a drawing shows them.
 *   - Plan view: a custom block that draws the plan and links to the 3D selection.
 *
 * Plan <-> 3D linking needs no code here: both read the one workspace selection.
 */
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter, SceneProps } from "../types";
import type { CutConfig } from "@/engine/Cutaway";
import { useWorkspace } from "@/engine/store";
import { peelNeededFor, useSceneContext } from "@/engine/SemanticScene";
import { ToolButton } from "@/components/workspace/ControlBar";
import { PlanBlock } from "./PlanView";
import { ElevationBlock, SectionBlock } from "./ProjectionViews";
import { useArch } from "./store";

const WALL_PARTS = ["wall_exterior", "wall_interior"];

function cutOf(lesson: Lesson): CutConfig | undefined {
  const c = lesson.options.cut as CutConfig | undefined;
  return c ?? { axis: "y", removes: 1, openTo: 0.3 };
}

function Toolbar({ manifest }: SceneProps) {
  const layerStep = useWorkspace((s) => s.layerStep);
  const setLayerStep = useWorkspace((s) => s.setLayerStep);
  const cutaway = useWorkspace((s) => s.cutaway);
  const setCutaway = useWorkspace((s) => s.setCutaway);
  const outline = useArch((s) => s.outline);
  const setOutline = useArch((s) => s.setOutline);
  const roofOn = layerStep < 1;
  return (
    <>
      <ToolButton icon="layers" label={roofOn ? "Take the roof off" : "Put the roof on"} pressed={roofOn} onClick={() => setLayerStep(roofOn ? Math.max(1, manifest.layers.findIndex((l) => l.id === "roof") + 1) : 0)} />
      <ToolButton icon="eye" label={outline ? "Show solid walls" : "Show walls as outline"} pressed={outline} onClick={() => setOutline(!outline)} />
      <label className="flex items-center gap-2 px-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
        Section
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={cutaway}
          aria-label="Section plane height"
          onChange={(e) => setCutaway(+e.target.value)}
          onPointerUp={() => useWorkspace.getState().commit()}
          onKeyUp={() => useWorkspace.getState().commit()}
          className="h-1 w-[96px] accent-[var(--teal)]"
        />
      </label>
    </>
  );
}

/**
 * Walls to outline: each wall mesh gets an edge-line twin. In outline mode the solid
 * is hidden (also taking it out of picking, so clicks reach the rooms behind) and
 * the lines show. Built once per scene; toggling only flips visibility.
 */
function SceneExtras({ manifest }: SceneProps) {
  const ctx = useSceneContext();
  const outline = useArch((s) => s.outline);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!ctx) return;
    const made: THREE.LineSegments[] = [];
    for (const id of WALL_PARTS) {
      const obj = ctx.index.get(id)?.obj;
      obj?.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || o.userData.__edges) return;
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), new THREE.LineBasicMaterial({ color: "#1a2230" }));
        lines.userData.__edges = true;
        lines.raycast = () => {};
        lines.visible = false;
        m.parent?.add(lines);
        m.userData.__twin = lines;
        made.push(lines);
      });
    }
    return () => {
      for (const l of made) {
        l.parent?.remove(l);
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      }
    };
  }, [ctx]);

  useEffect(() => {
    if (!ctx) return;
    for (const id of WALL_PARTS) {
      ctx.index.get(id)?.obj.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.userData.__twin) {
          m.visible = !outline;
          (m.userData.__twin as THREE.Object3D).visible = outline;
        }
      });
    }
    invalidate();
  }, [ctx, outline, invalidate]);

  void manifest;
  return null;
}

export const architectureAdapter: DisciplineAdapter = {
  id: "architecture",
  cut: cutOf,
  ground: () => true,
  ToolbarExtra: Toolbar,
  SceneExtras,
  blocks: { plan: PlanBlock, elevation_south: ElevationBlock, section_aa: SectionBlock },
  reveal: (partId: string, _lesson: Lesson, manifest: Manifest) => {
    // Rooms sit under the roof: take it off before flying in.
    const layer = manifest.nodes[partId]?.layer;
    const idx = manifest.layers.findIndex((l) => l.id === layer);
    if (idx < 0) return;
    const need = Math.min(peelNeededFor(layer, manifest), idx);
    const s = useWorkspace.getState();
    if (s.layerStep < need) s.setLayerStep(need);
  },
};
