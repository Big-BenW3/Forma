"use client";
/**
 * StageFloor
 * ==========
 * The drafting-paper plane every model stands on: a pale disc with a hairline
 * rim, a teal ring, a ring of tick marks and a darker pad under the object. It is
 * a real plane in the scene, so it foreshortens with the camera and the student
 * reads the model as an object standing in space rather than a picture on a flat
 * background.
 *
 * Everything is flat-shaded (MeshBasicMaterial) and built from primitives: no
 * texture, no network request, a handful of draw calls. Colours come from the
 * design tokens so a palette change repaints the floor as well.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { sceneColors } from "@/lib/tokens";

function discPart(radius: number, y: number, color: string, order: number) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} renderOrder={order}>
      <circleGeometry args={[radius, 96]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function ring(inner: number, outer: number, y: number, color: string, order: number) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} renderOrder={order}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** `size` is the model's largest dimension (offsets); `foot` is its footprint (everything drawn on the plane). */
export function StageFloor({ center, y, size, foot }: { center: [number, number]; y: number; size: number; foot: number }) {
  const c = useMemo(() => sceneColors(), []);
  const R = foot * 1.32;
  const ticks = useMemo(() => {
    const pts: number[] = [];
    const N = 144;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const long = i % 6 === 0;
      const r0 = foot * 0.99, r1 = foot * (long ? 1.06 : 1.03);
      pts.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [foot]);

  return (
    <group position={[center[0], y, center[1]]}>
      {discPart(R, 0, c.floor, 0)}
      {ring(R * 0.995, R, 0.0005 * size, c.floorLine, 1)}
      {discPart(foot * 0.42, 0.0006 * size, c.floorPad, 2)}
      {ring(foot * 0.42 - foot * 0.004, foot * 0.42, 0.0012 * size, c.floorLine, 3)}
      {ring(foot * 0.8, foot * 0.8 + foot * 0.011, 0.0012 * size, c.teal, 3)}
      <lineSegments geometry={ticks} position-y={0.0012 * size} renderOrder={3}>
        <lineBasicMaterial color={c.floorLine} toneMapped={false} />
      </lineSegments>
    </group>
  );
}
