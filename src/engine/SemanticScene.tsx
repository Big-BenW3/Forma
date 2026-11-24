"use client";
/**
 * SemanticScene
 * =============
 * Loads a GLB and makes it interactive, driven entirely by the scene MANIFEST
 * and the workspace store. It knows nothing about which discipline it is
 * rendering: a brain, a breadboard and a house all go through this component.
 *
 * How binding works: every interactive thing in the GLB is a node whose NAME
 * is a semantic id (e.g. `region_frontal_lobe`), listed in the manifest. We
 * index those nodes once, then:
 *   - clicks / hovers walk up from the hit mesh to the nearest semantic node,
 *   - the store's selection/isolate/layer state is applied to each node's
 *     materials in one place (`applyVisualState`).
 * We never address anything by mesh index, material name or hierarchy depth.
 *
 * Performance notes
 *   - The canvas runs `frameloop="demand"`: it only renders when something
 *     changed, so an idle scene costs nothing. Every state change here ends in
 *     `invalidate()`.
 *   - Materials are cloned once per mesh at load so highlighting one part can
 *     never leak onto another through a shared material.
 *   - Raycasting goes through a BVH (drei <Bvh>), because brute-force picking
 *     on a ~100k-triangle model makes pointer-move hover janky on phones.
 */
import { createContext, useContext, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Bvh, useGLTF } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { usePractice } from "@/engine/practice";
import type { Manifest } from "@/content/schema";
import { sceneColors } from "@/lib/tokens";
import { touch } from "./touch";
import { useWorkspace } from "./store";

// ---------------------------------------------------------------------------
// Index of semantic nodes
// ---------------------------------------------------------------------------

export interface PartEntry {
  id: string;
  obj: THREE.Object3D;
  meshes: THREE.Mesh[];
  isShell: boolean;
  layer?: string;
  basePosition: THREE.Vector3;
}

interface BaseLook {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

export interface SceneContextValue {
  root: THREE.Object3D;
  index: Map<string, PartEntry>;
  manifest: Manifest;
}

const SceneContext = createContext<SceneContextValue | null>(null);
export const useSceneContext = () => useContext(SceneContext);

/** Walks up from a hit object to the semantic node that owns it. */
function semanticOf(obj: THREE.Object3D | null, index: Map<string, PartEntry>): PartEntry | null {
  let o: THREE.Object3D | null = obj;
  while (o) {
    const hit = index.get(o.name);
    if (hit && hit.obj === o) return hit;
    o = o.parent;
  }
  return null;
}

function buildIndex(root: THREE.Object3D, manifest: Manifest): Map<string, PartEntry> {
  const index = new Map<string, PartEntry>();
  root.traverse((o) => {
    if (manifest.nodes[o.name] && !index.has(o.name)) {
      index.set(o.name, {
        id: o.name,
        obj: o,
        meshes: [],
        isShell: !!o.userData.shell,
        layer: manifest.nodes[o.name].layer,
        basePosition: o.position.clone(),
      });
    }
  });
  // Assign each mesh to its nearest semantic ancestor.
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const mesh = o as THREE.Mesh;
    // Clone the material once so per-part highlighting never leaks across parts.
    const m = (mesh.material as THREE.MeshStandardMaterial).clone();
    m.userData.base = {
      color: m.color.clone(),
      emissive: m.emissive.clone(),
      emissiveIntensity: m.emissiveIntensity,
      opacity: m.opacity,
      transparent: m.transparent,
      depthWrite: m.depthWrite,
    } satisfies BaseLook;
    mesh.material = m;
    // Stencil/cap proxies (invisible helper solids) must not catch pointer events.
    if (mesh.userData.proxy) mesh.raycast = () => {};
    semanticOf(mesh, index)?.meshes.push(mesh);
  });
  return index;
}

// ---------------------------------------------------------------------------
// Applying the store's state to materials
// ---------------------------------------------------------------------------

type Mode = "normal" | "hover" | "selected" | "ghost";

const GHOST_OPACITY = 0.1;

function setMode(entry: PartEntry, mode: Mode, accent: THREE.Color) {
  for (const mesh of entry.meshes) {
    // Cap proxies are invisible helper solids: never tint or un-hide them.
    if (mesh.userData.proxy) continue;
    const m = mesh.material as THREE.MeshStandardMaterial;
    const base = m.userData.base as BaseLook;
    if (mode === "ghost") {
      m.transparent = true;
      m.opacity = base.opacity * GHOST_OPACITY;
      m.depthWrite = false;
      m.emissive.copy(base.emissive);
      m.emissiveIntensity = base.emissiveIntensity;
    } else {
      m.transparent = base.transparent;
      m.opacity = base.opacity;
      m.depthWrite = base.depthWrite;
      if (mode === "normal") {
        m.emissive.copy(base.emissive);
        m.emissiveIntensity = base.emissiveIntensity;
      } else {
        m.emissive.copy(accent);
        m.emissiveIntensity = mode === "selected" ? 0.5 : 0.22;
      }
    }
  }
}

/** Pure: which mode should this part be in, given the store? */
export function modeFor(
  entry: PartEntry,
  s: { selectedId: string | null; hoveredId: string | null; isolate: boolean },
  selectedIsShell: boolean,
): Mode {
  if (s.selectedId === entry.id) return "selected";
  if (s.selectedId && !selectedIsShell) {
    // Isolating ghosts everything else. Selecting an interior part also ghosts
    // "shell" parts (a cell membrane, say) so the part is actually visible.
    if (s.isolate || entry.isShell) return "ghost";
  }
  if (s.hoveredId === entry.id) return "hover";
  return "normal";
}

/** Layer visibility: the first `layerStep` layers (outermost first) are peeled away. */
export function layerHidden(layer: string | undefined, manifest: Manifest, layerStep: number) {
  if (!layer || layerStep <= 0) return false;
  const i = manifest.layers.findIndex((l) => l.id === layer);
  return i >= 0 && i < layerStep;
}

/**
 * True when nothing opaque sits between the viewer and this layer: every still-
 * visible layer outside it is non-covering. Parts with no layer are always exposed.
 */
export function layerExposed(layer: string | undefined, manifest: Manifest, layerStep: number) {
  if (!layer) return true;
  const i = manifest.layers.findIndex((l) => l.id === layer);
  if (i < 0) return true;
  // Peeled away entirely: not exposed (it is gone, not merely uncovered).
  if (i < layerStep) return false;
  for (let j = Math.max(0, layerStep); j < i; j++) if (manifest.layers[j].covers) return false;
  return true;
}

/** How many layers must be peeled so that `layer` is no longer covered. */
export function peelNeededFor(layer: string | undefined, manifest: Manifest) {
  const i = manifest.layers.findIndex((l) => l.id === layer);
  let need = 0;
  for (let j = 0; j < i; j++) if (manifest.layers[j].covers) need = j + 1;
  return need;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SemanticScene({
  manifest,
  children,
  interactive = true,
}: {
  manifest: Manifest;
  /** Rendered inside the scene context: caps, discipline extras, etc. */
  children?: React.ReactNode;
  interactive?: boolean;
}) {
  const gltf = useGLTF(manifest.glb);
  const invalidate = useThree((s) => s.invalidate);

  // One independent copy per mount, so remounting a lesson never shares state.
  const root = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const index = useMemo(() => buildIndex(root, manifest), [root, manifest]);
  const accent = useMemo(() => new THREE.Color(sceneColors().accent), []);

  const selectedId = useWorkspace((s) => s.selectedId);
  const hoveredId = useWorkspace((s) => s.hoveredId);
  const isolate = useWorkspace((s) => s.isolate);
  const layerStep = useWorkspace((s) => s.layerStep);
  const explode = useWorkspace((s) => s.explode);

  // Apply highlight / ghost / peel / explode whenever the store changes.
  useEffect(() => {
    const selectedIsShell = selectedId ? !!index.get(selectedId)?.isShell : false;
    for (const entry of index.values()) {
      entry.obj.visible = !layerHidden(entry.layer, manifest, layerStep);
      setMode(entry, modeFor(entry, { selectedId, hoveredId, isolate }, selectedIsShell), accent);
      const off = manifest.nodes[entry.id].explode;
      if (off) entry.obj.position.copy(entry.basePosition).add(new THREE.Vector3(...off).multiplyScalar(explode));
    }
    invalidate();
  }, [index, manifest, selectedId, hoveredId, isolate, layerStep, explode, accent, invalidate]);

  // Pointer handling: pick the nearest part that is actually visible and not a ghost.
  // World point of the last successful pick, for the touch label.
  let lastPoint: THREE.Vector3 | null = null;
  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const { selectedId: sel, isolate: iso } = useWorkspace.getState();
    const selIsShell = sel ? !!index.get(sel)?.isShell : false;
    // A see-through part (skin drawn as glass, a cell membrane) must not swallow
    // the click meant for what is visible behind it. It is only picked when
    // nothing solid lies behind that point.
    let seeThrough: PartEntry | null = null;
    let seePoint: THREE.Vector3 | null = null;
    for (const hit of e.intersections) {
      const entry = semanticOf(hit.object, index);
      if (!entry) continue;
      // Decor (hand bones, cut-face helpers) is drawn but is not a selectable part.
      if (manifest.nodes[entry.id]?.decor) continue;
      // Skip anything hidden (the raycaster does not check `visible`) or ghosted.
      let visible = true;
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) if (!o.visible) visible = false;
      if (!visible) continue;
      if (sel && !selIsShell && entry.id !== sel && (iso || entry.isShell)) continue;
      const glass = entry.meshes.length > 0 && entry.meshes.every((m) => (((m.material as THREE.Material).userData.base as BaseLook | undefined)?.opacity ?? 1) < 0.5);
      if (glass) {
        if (!seeThrough) {
          seeThrough = entry;
          seePoint = hit.point.clone();
        }
        continue;
      }
      lastPoint = hit.point.clone();
      return entry;
    }
    lastPoint = seePoint;
    return seeThrough;
  };

  const ctx = useMemo<SceneContextValue>(() => ({ root, index, manifest }), [root, index, manifest]);

  return (
    <SceneContext.Provider value={ctx}>
      <Bvh firstHitOnly>
        <primitive
          object={root}
          onPointerMove={
            interactive
              ? (e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation();
                  const p = pick(e);
                  touch.hover = p && lastPoint ? { id: p.id, point: lastPoint } : null;
                  // The touch label follows the pointer, so draw a frame (demand mode).
                  if (p) invalidate();
                  useWorkspace.getState().hover(p?.id ?? null);
                  document.body.style.cursor = p ? "pointer" : "";
                }
              : undefined
          }
          onPointerOut={
            interactive
              ? () => {
                  touch.hover = null;
                  useWorkspace.getState().hover(null);
                  document.body.style.cursor = "";
                }
              : undefined
          }
          onClick={
            interactive
              ? (e: ThreeEvent<MouseEvent>) => {
                  // A drag that ended on the model is a camera move, not a selection.
                  if (e.delta > 4) return;
                  const p = pick(e);
                  if (!p) return;
                  e.stopPropagation();
                  if (lastPoint) touch.selected.set(p.id, lastPoint);
                  const n = manifest.nodes[p.id];
                  // While the student is answering an identify round the click is an
                  // ANSWER: the camera must not fly in, or the lesson gives it away.
                  const answering = usePractice.getState().active;
                  useWorkspace.getState().select(p.id, answering ? undefined : { fly: n.camera });
                }
              : undefined
          }
        />
      </Bvh>
      {children}
    </SceneContext.Provider>
  );
}
