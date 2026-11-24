/**
 * Furniture and fittings for the house, built from the shared layout in
 * src/content/disciplines/architecture/house.ts (FURNITURE).
 *
 * Every item is authored centred on the origin, standing on y = 0, with its
 * FRONT facing +z and its width along x, then rotated to face the way the
 * layout says and moved into place. Rounded boxes and turned shapes keep the
 * pieces soft enough to read as furniture, not crates, while staying cheap:
 * the whole house's furniture is a few thousand triangles per room.
 */
import * as THREE from "three";
import { faceAngle, type Furniture } from "../../../src/content/disciplines/architecture/house";
import { merge, roundedBox, tint } from "./geo";

// ------------------------------------------------------------------ palette
const OAK = "#b98c5e", OAK_D = "#8a643f", WALNUT = "#6b4a33", WHITE = "#f4f2ed", PORCELAIN = "#f7f8f8";
const STEEL = "#c3c8cc", BLACK = "#1d2024", LINEN = "#e9e4da";

/** Rounded box with its BASE at y0, centred at (x, z). */
function rb(w: number, h: number, d: number, r: number, x: number, y0: number, z: number, color: string, seg = 3) {
  const g = roundedBox(w, h, d, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4), seg);
  g.deleteAttribute("uv");
  g.translate(x, y0 + h / 2, z);
  return tint(g, color);
}
function cyl(rTop: number, rBot: number, h: number, x: number, y0: number, z: number, color: string, seg = 16) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  g.deleteAttribute("uv");
  g.translate(x, y0 + h / 2, z);
  return tint(g, color);
}
function blob(rx: number, ry: number, rz: number, x: number, y: number, z: number, color: string) {
  const g = new THREE.SphereGeometry(1, 12, 9);
  g.deleteAttribute("uv");
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  return tint(g, color);
}
const legs = (w: number, d: number, h: number, inset: number, r: number, color: string) =>
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => cyl(r, r * 0.8, h, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), color, 8));

// ---------------------------------------------------------------- the items
type Builder = (w: number, d: number) => THREE.BufferGeometry[];

const bed = (duvet: string): Builder => (w, d) => {
  const g: THREE.BufferGeometry[] = [];
  g.push(...legs(w, d, 0.1, 0.06, 0.025, WALNUT));
  g.push(rb(w, 0.22, d, 0.03, 0, 0.1, 0, OAK)); // frame
  g.push(rb(w - 0.06, 0.2, d - 0.1, 0.06, 0, 0.3, 0.02, LINEN)); // mattress
  g.push(rb(w - 0.02, 0.07, d * 0.64, 0.05, 0, 0.47, d * 0.17, duvet)); // duvet
  g.push(rb(w, 0.09, 0.2, 0.045, 0, 0.47, -d * 0.16, duvet)); // folded top edge
  const pillows = w > 1.2 ? [-w / 4 + 0.02, w / 4 - 0.02] : [0];
  for (const px of pillows) g.push(rb(Math.min(0.62, w * 0.42 + 0.1), 0.13, 0.38, 0.065, px, 0.48, -d / 2 + 0.3, "#fbfbf9"));
  g.push(rb(w + 0.04, 0.95, 0.07, 0.03, 0, 0.1, -d / 2 + 0.035, OAK_D)); // headboard
  g.push(rb(w - 0.12, 0.55, 0.02, 0.01, 0, 0.42, -d / 2 + 0.075, OAK)); // headboard panel
  return g;
};

const B: Record<Furniture["kind"], Builder> = {
  bed_double: bed("#9fb4cf"),
  bed_single: bed("#a9c6a4"),
  nightstand: (w, d) => [
    rb(w, 0.5, d, 0.02, 0, 0.04, 0, OAK),
    ...legs(w, d, 0.04, 0.04, 0.015, WALNUT),
    rb(w - 0.06, 0.005, 0.005, 0.002, 0, 0.32, d / 2, OAK_D), // drawer line
    cyl(0.012, 0.012, 0.03, 0, 0.4, d / 2 + 0.01, STEEL, 6),
    cyl(0.05, 0.06, 0.04, 0, 0.54, 0, "#d9d2c3"), // lamp base
    cyl(0.008, 0.008, 0.22, 0, 0.58, 0, STEEL, 6),
    cyl(0.08, 0.12, 0.16, 0, 0.74, 0, "#f3ead6"), // shade
  ],
  wardrobe: (w, d) => {
    const g = [rb(w, 2.05, d, 0.015, 0, 0.05, 0, OAK), rb(w - 0.04, 0.05, d - 0.06, 0.01, 0, 0, 0, WALNUT)];
    const n = w > 1.6 ? 3 : 2;
    for (let i = 1; i < n; i++) g.push(rb(0.006, 1.95, 0.004, 0.002, -w / 2 + (w * i) / n, 0.1, d / 2, OAK_D)); // door joints
    for (let i = 0; i < n; i++) g.push(cyl(0.008, 0.008, 0.22, -w / 2 + (w * (i + 0.5)) / n + (i % 2 ? -0.08 : 0.08), 0.95, d / 2 + 0.015, STEEL, 6));
    return g;
  },
  desk: (w, d) => [
    rb(w, 0.035, d, 0.01, 0, 0.72, 0, OAK),
    ...legs(w, d, 0.72, 0.04, 0.018, BLACK),
    rb(0.4, 0.5, d - 0.08, 0.01, w / 2 - 0.24, 0.2, 0, WHITE), // drawer unit
    rb(0.5, 0.32, 0.02, 0.01, -0.05, 0.86, -d / 2 + 0.12, BLACK), // monitor
    cyl(0.01, 0.01, 0.1, -0.05, 0.755, -d / 2 + 0.12, BLACK, 6),
    rb(0.36, 0.012, 0.13, 0.004, -0.05, 0.755, 0.05, "#2b2f35"), // keyboard
  ],
  chair: (w, d) => [
    ...legs(w, d, 0.44, 0.03, 0.014, WALNUT),
    rb(w, 0.04, d, 0.03, 0, 0.44, 0, OAK),
    rb(w, 0.36, 0.035, 0.02, 0, 0.5, -d / 2 + 0.02, OAK),
  ],
  rug: (w, d) => [rb(w, 0.012, d, 0.03, 0, 0, 0, "#a8634e"), rb(w - 0.16, 0.014, d - 0.16, 0.03, 0, 0, 0, "#d9c7a6")],
  bath: (w, d) => [
    rb(w, 0.55, d, 0.06, 0, 0, 0, PORCELAIN),
    rb(w - 0.12, 0.02, d - 0.16, 0.08, 0, 0.5, 0.02, "#8fc3d8"), // water
    rb(w - 0.06, 0.03, 0.05, 0.015, 0, 0.55, -d / 2 + 0.03, "#e6e8e8"),
    cyl(0.018, 0.018, 0.16, 0, 0.55, -d / 2 + 0.05, STEEL, 8), // tap
    rb(0.04, 0.02, 0.14, 0.01, 0, 0.7, -d / 2 + 0.11, STEEL),
  ],
  toilet: (w, d) => [
    rb(w * 0.95, 0.4, d * 0.42, 0.04, 0, 0.38, -d / 2 + d * 0.21, PORCELAIN), // cistern
    blob(w * 0.48, 0.2, d * 0.36, 0, 0.2, d * 0.1, PORCELAIN), // bowl
    rb(w * 0.82, 0.03, d * 0.62, 0.12, 0, 0.4, d * 0.12, "#eceeee"), // seat
    cyl(0.07, 0.09, 0.2, 0, 0, d * 0.06, PORCELAIN),
  ],
  basin: (w, d) => [
    cyl(0.07, 0.09, 0.8, 0, 0, -d / 2 + 0.12, PORCELAIN), // pedestal
    rb(w, 0.14, d, 0.06, 0, 0.78, 0, PORCELAIN),
    rb(w - 0.14, 0.01, d - 0.16, 0.05, 0, 0.915, 0.02, "#dfe7ea"), // bowl surface
    cyl(0.012, 0.012, 0.14, 0, 0.92, -d / 2 + 0.06, STEEL, 8),
    rb(w + 0.1, 0.7, 0.025, 0.015, 0, 1.15, -d / 2 - 0.03, "#cfe0e6"), // mirror
  ],
  counter: (w, d) => {
    const g = [rb(w, 0.1, d - 0.06, 0.01, 0, 0, -0.03, "#4e5359"), rb(w, 0.76, d - 0.02, 0.01, 0, 0.1, -0.01, "#eeebe5"), rb(w + 0.02, 0.04, d + 0.02, 0.01, 0, 0.86, 0, "#3e4247")];
    const n = Math.max(2, Math.round(w / 0.6));
    for (let i = 1; i < n; i++) g.push(rb(0.006, 0.7, 0.004, 0.002, -w / 2 + (w * i) / n, 0.13, d / 2, "#b9b4ab"));
    for (let i = 0; i < n; i++) g.push(rb(0.2, 0.015, 0.02, 0.006, -w / 2 + (w * (i + 0.5)) / n, 0.75, d / 2 + 0.01, STEEL));
    // wall cabinets above the worktop
    g.push(rb(w, 0.7, 0.34, 0.01, 0, 1.45, -d / 2 + 0.17, "#eeebe5"));
    for (let i = 1; i < n; i++) g.push(rb(0.006, 0.66, 0.004, 0.002, -w / 2 + (w * i) / n, 1.47, -d / 2 + 0.345, "#b9b4ab"));
    return g;
  },
  hob: (w, d) => {
    const g = [rb(w - 0.04, 0.008, d - 0.06, 0.01, 0, 0.9, 0, "#14171b")];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.push(cyl(0.085, 0.085, 0.004, sx * (w / 4 - 0.01), 0.908, sz * (d / 4 - 0.01), "#3a3f46", 20));
    g.push(rb(w - 0.04, 0.6, 0.012, 0.01, 0, 0.18, d / 2 + 0.006, "#202328")); // oven door
    g.push(rb(w - 0.2, 0.015, 0.025, 0.006, 0, 0.72, d / 2 + 0.02, STEEL));
    g.push(rb(w, 0.08, 0.36, 0.01, 0, 1.38, -d / 2 + 0.2, STEEL)); // extractor hood
    return g;
  },
  sink: (w, d) => [rb(w, 0.006, d, 0.04, 0, 0.9, 0, STEEL), rb(w * 0.45, 0.004, d - 0.1, 0.04, -w * 0.22, 0.905, 0, "#9aa1a7"), rb(w * 0.35, 0.004, d - 0.1, 0.04, w * 0.24, 0.905, 0, "#9aa1a7"), cyl(0.014, 0.014, 0.28, 0, 0.9, -d / 2 + 0.05, STEEL, 8), rb(0.03, 0.025, 0.2, 0.01, 0, 1.16, -d / 2 + 0.13, STEEL)],
  fridge: (w, d) => [rb(w, 1.85, d, 0.03, 0, 0, 0, "#d7dcdf"), rb(w - 0.02, 0.006, 0.004, 0.002, 0, 1.15, d / 2, "#9aa1a7"), cyl(0.012, 0.012, 0.35, w / 2 - 0.08, 1.25, d / 2 + 0.02, STEEL, 6), cyl(0.012, 0.012, 0.35, w / 2 - 0.08, 0.7, d / 2 + 0.02, STEEL, 6)],
  table: (w, d) => [rb(w, 0.04, d, 0.015, 0, 0.72, 0, OAK), ...legs(w, d, 0.72, 0.07, 0.022, OAK_D), cyl(0.07, 0.05, 0.12, 0, 0.76, 0, "#e8e2d4")],
  sofa: (w, d) => {
    const g = [...legs(w, d, 0.08, 0.06, 0.02, WALNUT), rb(w, 0.24, d, 0.06, 0, 0.08, 0, "#55707f")];
    const arm = 0.18;
    g.push(rb(arm, 0.4, d, 0.07, -w / 2 + arm / 2, 0.08, 0, "#4c6573"), rb(arm, 0.4, d, 0.07, w / 2 - arm / 2, 0.08, 0, "#4c6573"));
    g.push(rb(w - 2 * arm, 0.45, 0.2, 0.08, 0, 0.3, -d / 2 + 0.12, "#4c6573")); // back
    const n = 3, cw = (w - 2 * arm) / n;
    for (let i = 0; i < n; i++) {
      g.push(rb(cw - 0.02, 0.14, d - 0.26, 0.06, -w / 2 + arm + cw * (i + 0.5), 0.32, 0.08, "#62808f")); // seat cushions
      g.push(rb(cw - 0.03, 0.36, 0.14, 0.07, -w / 2 + arm + cw * (i + 0.5), 0.44, -d / 2 + 0.27, "#62808f")); // back cushions
    }
    g.push(rb(0.36, 0.3, 0.1, 0.06, -w / 2 + arm + 0.25, 0.46, -d / 2 + 0.4, "#d8a657")); // scatter cushion
    return g;
  },
  armchair: (w, d) => [...legs(w, d, 0.1, 0.06, 0.02, WALNUT), rb(w, 0.24, d, 0.06, 0, 0.1, 0, "#b7795a"), rb(0.15, 0.36, d, 0.06, -w / 2 + 0.075, 0.1, 0, "#a86d50"), rb(0.15, 0.36, d, 0.06, w / 2 - 0.075, 0.1, 0, "#a86d50"), rb(w - 0.3, 0.5, 0.16, 0.07, 0, 0.3, -d / 2 + 0.1, "#a86d50"), rb(w - 0.32, 0.12, d - 0.24, 0.05, 0, 0.34, 0.06, "#c48a6a")],
  coffee_table: (w, d) => [rb(w, 0.035, d, 0.015, 0, 0.4, 0, WALNUT), rb(w - 0.08, 0.02, d - 0.08, 0.01, 0, 0.12, 0, WALNUT), ...legs(w, d, 0.4, 0.04, 0.016, BLACK), rb(0.24, 0.04, 0.17, 0.005, 0.2, 0.435, 0.02, "#c0573f"), rb(0.22, 0.03, 0.16, 0.005, 0.2, 0.475, 0.0, "#2f5d7c")],
  tv_unit: (w, d) => [rb(w, 0.42, d, 0.015, 0, 0.06, 0, WALNUT), ...legs(w, d, 0.06, 0.05, 0.015, BLACK), rb(0.006, 0.36, 0.004, 0.002, 0, 0.09, d / 2, "#4a3527"), rb(1.25, 0.72, 0.04, 0.012, 0, 0.62, -0.05, BLACK), rb(1.21, 0.68, 0.006, 0.006, 0, 0.64, -0.028, "#2a3442"), cyl(0.02, 0.06, 0.14, 0, 0.48, -0.05, BLACK, 10)],
  plant: (w) => {
    const g = [cyl(w * 0.32, w * 0.24, 0.38, 0, 0, 0, "#c86d4f"), cyl(w * 0.3, w * 0.3, 0.02, 0, 0.36, 0, "#4a3426")];
    const leaves = [[0, 0.75, 0, 0.2], [0.12, 0.62, 0.06, 0.16], [-0.1, 0.66, -0.06, 0.16], [0.04, 0.9, -0.05, 0.14], [-0.06, 0.55, 0.1, 0.13]];
    for (const [x, y, z, r] of leaves) g.push(blob(r, r * 0.8, r, x * w * 2, y, z * w * 2, "#4f8a4b"));
    g.push(cyl(0.012, 0.012, 0.4, 0, 0.36, 0, "#5a4430", 5));
    return g;
  },
  lamp: () => [cyl(0.13, 0.15, 0.025, 0, 0, 0, BLACK, 18), cyl(0.012, 0.012, 1.45, 0, 0.02, 0, BLACK, 6), cyl(0.15, 0.22, 0.26, 0, 1.42, 0, "#f1e6cf", 20)],
};

/** One room's furniture, in world coordinates, as a single vertex-coloured geometry. */
export function furnitureGeometry(items: Furniture[], floorY: number) {
  const out: THREE.BufferGeometry[] = [];
  for (const it of items) {
    const parts = B[it.kind](it.w, it.d);
    const g = merge(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
    g.rotateY(faceAngle(it.face));
    g.translate(it.x, floorY, it.z);
    out.push(g);
  }
  return out.length ? merge(out) : null;
}
