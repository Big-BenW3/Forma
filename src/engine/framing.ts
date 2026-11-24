/**
 * How far to pull the camera back from a scene's authored framing so the model
 * fits a canvas of a given shape. Pure, so it is unit tested (framing.test.ts).
 *
 * The manifest frames each model for a landscape canvas (aspect FRAMED_ASPECT).
 * On a narrower canvas only the model's on-screen WIDTH can stop fitting, so we
 * compare its width (seen from the default view) with its height: a tall, narrow
 * subject such as a standing skeleton needs no pull-back, a wide one such as a
 * house needs about as much as the aspect change. Clamped to [1, MAX_FIT] so an
 * extreme window shape never flings the camera far away.
 */
import type { Manifest } from "@/content/schema";

/** The canvas aspect ratio the manifest framing was authored for (landscape desktop) */
export const FRAMED_ASPECT = 1.05;
export const MAX_FIT = 2.4;

export function framingFit(manifest: Pick<Manifest, "bounds" | "camera">, aspect: number): number {
  const b = manifest.bounds;
  const t = manifest.camera.target;
  const m = manifest.camera.position;
  const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  const d = [m[0] - t[0], m[1] - t[1], m[2] - t[2]];
  const dl = Math.hypot(d[0], d[1], d[2]) || 1;
  const dir = d.map((v) => v / dl);
  // right = up x dir (up = +y), then the screen's up = dir x right
  let right = [dir[2], 0, -dir[0]];
  const rl = Math.hypot(right[0], right[2]) || 1;
  right = right.map((v) => v / rl);
  const up = [dir[1] * right[2] - dir[2] * right[1], dir[2] * right[0] - dir[0] * right[2], dir[0] * right[1] - dir[1] * right[0]];
  const ext = (axis: number[]) => Math.abs(axis[0]) * size[0] + Math.abs(axis[1]) * size[1] + Math.abs(axis[2]) * size[2];
  const w = ext(right), h = ext(up);
  const need = w / Math.max(1e-3, aspect) / Math.max(h, w / FRAMED_ASPECT);
  return Math.min(MAX_FIT, Math.max(1, need));
}
