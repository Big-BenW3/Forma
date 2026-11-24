"use client";
/**
 * Cutaway
 * =======
 * Slices the scene with a movable plane and paints a flat coloured
 * cross-section where the plane passes through solid parts.
 *
 * Two pieces:
 *
 * 1. CLIPPING. Every material in the scene gets the same THREE.Plane, so
 *    everything on one side of it disappears. The plane is only attached while
 *    the slider is open; at 0 the materials are untouched (clipping costs GPU).
 *
 * 2. CAPS. A clipped closed object is hollow-looking: you see its inside
 *    faces. To fake a solid cut we use the classic stencil technique:
 *      a. draw the object's BACK faces incrementing the stencil buffer,
 *      b. draw its FRONT faces decrementing it,
 *         -> the stencil is non-zero exactly where the plane passes through
 *            the object's interior,
 *      c. draw a plane-sized quad only where the stencil is non-zero, then
 *         reset the stencil to 0 for the next solid.
 *    Solids that declare `userData.cap` (a hex colour) take part. `capOrder`
 *    sets painting order so an inner solid (a nucleus) paints over the one
 *    that contains it (the cell body) at the same depth.
 *
 *    Caps need CLOSED meshes. Open surfaces (a brain lobe patch) can't be
 *    counted, so models include an invisible closed "proxy" solid
 *    (`userData.proxy`) that carries the cap instead.
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSceneContext, layerHidden } from "./SemanticScene";
import { useWorkspace } from "./store";

export interface CutConfig {
  /** Axis the plane is perpendicular to */
  axis: "x" | "y" | "z";
  /** +1 removes the positive side (e.g. the front, for z), -1 removes the negative side */
  removes: 1 | -1;
  /** Fraction of the bounds the plane sweeps through when fully open (0.5 = to the centre) */
  openTo?: number;
}

const AXIS = { x: 0, y: 1, z: 2 } as const;

/** Position of the plane along its axis for a slider value in [0, 1]. */
function planePosition(cfg: CutConfig, bounds: { min: number[]; max: number[] }, t: number) {
  const a = AXIS[cfg.axis];
  const lo = bounds.min[a];
  const hi = bounds.max[a];
  const size = hi - lo;
  const pad = size * 0.02;
  // "Closed" parks the plane just outside the object on the removed side.
  const start = cfg.removes === 1 ? hi + pad : lo - pad;
  const end = lo + size * (cfg.openTo ?? 0.5);
  return start + (end - start) * t;
}

export function Cutaway({ config }: { config: CutConfig }) {
  const ctx = useSceneContext();
  const invalidate = useThree((s) => s.invalidate);
  const cutaway = useWorkspace((s) => s.cutaway);
  const selectedId = useWorkspace((s) => s.selectedId);
  const isolate = useWorkspace((s) => s.isolate);
  const layerStep = useWorkspace((s) => s.layerStep);

  const plane = useMemo(() => new THREE.Plane(), []);

  // Solids that can be capped, sorted so outer ones paint first.
  const solids = useMemo(() => {
    if (!ctx) return [];
    const out: THREE.Mesh[] = [];
    ctx.root.updateMatrixWorld(true);
    ctx.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.userData.cap) out.push(o as THREE.Mesh);
    });
    return out.sort((a, b) => (a.userData.capOrder ?? 1) - (b.userData.capOrder ?? 1));
  }, [ctx]);

  // Build the stencil helpers once per scene.
  const rig = useMemo(() => {
    if (!ctx) return null;
    const group = new THREE.Group();
    group.name = "__cutaway_caps";
    const a = AXIS[config.axis];
    const size = Math.max(...ctx.manifest.bounds.max.map((v, i) => v - ctx.manifest.bounds.min[i])) * 3;

    const stencilBase = {
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: THREE.AlwaysStencilFunc,
    } as const;
    // Kept apart from the `as const` object: three wants a mutable Plane[].
    const planes: THREE.Plane[] = [plane];

    const items = solids.map((src, i) => {
      const back = new THREE.Mesh(
        src.geometry,
        new THREE.MeshBasicMaterial({
          ...stencilBase,
          clippingPlanes: planes,
          side: THREE.BackSide,
          stencilFail: THREE.IncrementWrapStencilOp,
          stencilZFail: THREE.IncrementWrapStencilOp,
          stencilZPass: THREE.IncrementWrapStencilOp,
        }),
      );
      const front = new THREE.Mesh(
        src.geometry,
        new THREE.MeshBasicMaterial({
          ...stencilBase,
          clippingPlanes: planes,
          side: THREE.FrontSide,
          stencilFail: THREE.DecrementWrapStencilOp,
          stencilZFail: THREE.DecrementWrapStencilOp,
          stencilZPass: THREE.DecrementWrapStencilOp,
        }),
      );
      for (const m of [back, front]) {
        m.matrixAutoUpdate = false;
        m.renderOrder = i + 1;
        m.raycast = () => {};
      }
      // A solid can ask for a see-through cap (`userData.capOpacity` < 1) so the
      // structures BEHIND the cut stay visible: a cell's cytoplasm fills the whole
      // section and would otherwise hide every organelle in the far half.
      // Blending is forced on while staying in the opaque pass: the stencil scheme
      // relies on each solid's stencil ops and cap running in renderOrder, which a
      // normal transparent material (drawn after everything) would break.
      const capOpacity = typeof src.userData.capOpacity === "number" ? (src.userData.capOpacity as number) : 1;
      const see = capOpacity < 1;
      const cap = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({
          color: src.userData.cap as string,
          roughness: 0.85,
          metalness: 0,
          side: THREE.DoubleSide,
          opacity: capOpacity,
          ...(see
            ? { blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthWrite: false }
            : {}),
          stencilWrite: true,
          stencilRef: 0,
          // Bias depth toward the camera so thin geometry lying on the cut plane
          // (membrane sheets) cannot z-fight with the cap and leave streaks.
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp,
        }),
      );
      cap.renderOrder = i + 1.1;
      cap.raycast = () => {};
      group.add(back, front, cap);
      return { src, back, front, cap };
    });
    return { group, items, a };
  }, [ctx, solids, plane, config.axis]);

  // Position the plane and the caps, and attach/detach clipping on every material.
  useEffect(() => {
    if (!ctx || !rig) return;
    const normal = new THREE.Vector3();
    normal.setComponent(rig.a, -config.removes);
    const pos = planePosition(config, { min: ctx.manifest.bounds.min, max: ctx.manifest.bounds.max }, cutaway);
    // three keeps points where dot(normal, p) + constant >= 0
    /* eslint-disable react-hooks/immutability -- `plane` is a long-lived three.js object shared with the materials; updating it in place is the point */
    plane.normal.copy(normal);
    // Removing the +side keeps coord <= pos  ->  normal = -axis, constant = pos.
    // Removing the -side keeps coord >= pos  ->  normal = +axis, constant = -pos.
    plane.constant = pos * config.removes;
    /* eslint-enable react-hooks/immutability */

    const open = cutaway > 0.002;
    const selectedIsShell = selectedId ? !!ctx.index.get(selectedId)?.isShell : false;

    // 1. Clipping on the scene's own materials
    ctx.root.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const m = (o as THREE.Mesh).material as THREE.Material;
      const had = !!m.clippingPlanes;
      m.clippingPlanes = open ? [plane] : null;
      if (had !== open) m.needsUpdate = true;
    });

    // 2. Caps: follow their source's visibility; ghosted parts do not cap.
    const center = new THREE.Vector3();
    center.setComponent(rig.a, pos);
    for (const it of rig.items) {
      let visible = open;
      if (visible) {
        // visible in the tree?
        for (let o: THREE.Object3D | null = it.src; o; o = o.parent) if (!o.visible) visible = false;
        const owner = (() => {
          for (let o: THREE.Object3D | null = it.src; o; o = o.parent) if (ctx.index.has(o.name)) return ctx.index.get(o.name)!;
          return null;
        })();
        if (owner) {
          if (layerHidden(owner.layer, ctx.manifest, layerStep)) visible = false;
          const ghosted = !!selectedId && !selectedIsShell && selectedId !== owner.id && (isolate || owner.isShell);
          if (ghosted) visible = false;
        }
      }
      for (const m of [it.back, it.front, it.cap]) m.visible = visible;
      if (!visible) continue;
      it.src.updateWorldMatrix(true, false);
      for (const m of [it.back, it.front]) {
        m.matrix.copy(it.src.matrixWorld);
        m.matrixWorldNeedsUpdate = true; // matrixAutoUpdate is off, so tell three we changed it
      }
      // The cap quad sits ON the plane and faces along its normal.
      it.cap.position.copy(center);
      it.cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().negate());
    }
    invalidate();
  }, [ctx, rig, plane, config, cutaway, selectedId, isolate, layerStep, invalidate]);

  if (!rig) return null;
  return <primitive object={rig.group} />;
}
