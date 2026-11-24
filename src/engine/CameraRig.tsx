"use client";
/**
 * CameraRig
 * =========
 * Owns the camera. Components never touch the camera directly; they ask via the
 * store (`requestCamera`, or `select(id, { fly })`) and this rig performs the
 * move with easing. Moves are always eased, never snapped.
 *
 * Also reports whether the camera is closer than the whole-object framing
 * (`zoomedIn`), which collapses callouts to compact pills and shows the minimap.
 */
import { useEffect, useMemo, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import type { Manifest } from "@/content/schema";
import { framingFit } from "./framing";
import { useWorkspace } from "./store";


/** Extra distance (x) so the model sits inside the stage with room for callouts. */
const STAGE_MARGIN = 1.55;
const STAGE_MARGIN_SLIM = 1.12;
const STAGE_MARGIN_PHONE = 1.08;

export function CameraRig({ manifest }: { manifest: Manifest }) {
  const ref = useRef<CameraControlsImpl>(null);
  const req = useWorkspace((s) => s.camera);
  const setZoomedIn = useWorkspace((s) => s.setZoomedIn);

  const width = useThree((s) => s.size.width);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const { target: t } = manifest.camera;

  // Pull back on narrow (phone) canvases only as far as this model needs; see framing.ts.
  // A margin on top of that keeps the model clear of the callout cards and the panels around the canvas.
  // Wide models (the board, the house) need room at both sides for cards; a tall, narrow one (a standing
  // skeleton) already leaves it, so it only gets a small margin and stays large.
  const fit = useMemo(() => {
    const raw = framingFit(manifest, aspect);
    const b = manifest.bounds;
    const tall = b.max[1] - b.min[1] > Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) * 1.3;
    const margin = width <= 640 ? STAGE_MARGIN_PHONE : tall ? STAGE_MARGIN_SLIM : STAGE_MARGIN;
    return raw * margin;
  }, [manifest, aspect, width]);
  const p = useMemo<[number, number, number]>(() => {
    const m = manifest.camera.position;
    return [t[0] + (m[0] - t[0]) * fit, t[1] + (m[1] - t[1]) * fit, t[2] + (m[2] - t[2]) * fit];
  }, [manifest, t, fit]);
  const homeDistance = Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]);

  // Place the camera at the scene's default framing whenever the scene (or fit) changes.
  useEffect(() => {
    ref.current?.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false);
  }, [manifest, p, t]);

  // Perform requested moves.
  useEffect(() => {
    const c = ref.current;
    if (!c || !req) return;
    if (req.kind === "goto") {
      c.setLookAt(...req.position, ...req.target, true);
    } else if (req.kind === "reset") {
      c.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], true);
    } else if (req.kind === "dolly") {
      c.dolly(req.amount, true);
    }
    // `nonce` makes a repeated identical request fire again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.nonce]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={manifest.camera.minDistance}
      maxDistance={Math.max(manifest.camera.maxDistance, homeDistance * 1.4)}
      smoothTime={0.22}
      draggingSmoothTime={0.07}
      dollyToCursor
      onChange={() => {
        const c = ref.current;
        if (c) setZoomedIn(c.distance < homeDistance * 0.7);
      }}
    />
  );
}
