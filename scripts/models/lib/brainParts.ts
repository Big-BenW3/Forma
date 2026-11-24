/**
 * Brain structures other than the folded cerebral cortex, as distance fields.
 *
 * Units are the brain scene's: decimetres, +z toward the forehead, +y up, x to
 * the side. Positions are chosen against the cortex in medicine_brain.ts:
 * the brainstem's top sits under the thalamus at about y = 0, the cerebellum
 * tucks under the occipital lobes at the back.
 *
 * Each builder returns a coloured BufferGeometry ready to become a part.
 */
import * as THREE from "three";
import { makeNoise3 } from "./math";
import { capsule, ellipsoid, meshSDF, mirrorX, path, relief, sphere, spline, subtract, union, type SDF, type Vec3 } from "./sdf";

const noise = makeNoise3(12);

const solid = (hex: string, vary = 0.08, freq = 12) => {
  const base = new THREE.Color(hex);
  return (p: Vec3) => base.clone().multiplyScalar(1 - vary + vary * (noise(p[0] * freq, p[1] * freq, p[2] * freq) * 0.5 + 0.5) * 2 * 0.5);
};

async function make(f: SDF, cell: number, tris: number, color: (p: Vec3, n: Vec3) => THREE.Color, pad = 0.03) {
  const b = f.box!;
  return meshSDF(f, { min: b.min.map((v) => v - pad) as Vec3, max: b.max.map((v) => v + pad) as Vec3, cell, tris, color, error: 0.006 });
}

// ------------------------------------------------------------- cerebellum
/** Two hemispheres and the vermis, covered in thin parallel folia with a deep primary fissure. */
export async function cerebellum() {
  const C: Vec3 = [0, -0.36, -0.56];
  let f = union(
    0.09,
    mirrorX(ellipsoid([0.24, C[1], C[2]], [0.29, 0.17, 0.25])),
    ellipsoid([0, C[1] + 0.02, C[2] - 0.03], [0.1, 0.17, 0.24]), // vermis
  );
  // Front face is hollowed where the brainstem and fourth ventricle sit.
  f = subtract(f, ellipsoid([0, -0.36, -0.28], [0.13, 0.2, 0.17]), 0.06);
  // Notch at the back between the hemispheres
  f = subtract(f, ellipsoid([0, -0.38, -0.84], [0.05, 0.14, 0.07]), 0.04);
  // Folia: narrow grooves on shells around a centre near the top-front, so they
  // run across the cerebellum like the leaves of a book.
  const O: Vec3 = [0, -0.18, -0.45];
  const lam = 0.034;
  const fissureR = 0.24;
  const groove = (x: number, y: number, z: number) => {
    const r = Math.hypot(x - O[0], (y - O[1]) * 1.25, z - O[2]) + noise(x * 6, y * 6, z * 6) * 0.006;
    const g = Math.pow(Math.abs(Math.cos((Math.PI * r) / lam)), 10);
    const fissure = Math.exp(-(((r - fissureR) / 0.012) ** 2));
    return { g, fissure };
  };
  const inner = f;
  const folded: SDF = (x, y, z) => {
    const d = inner(x, y, z);
    if (d > 0.03 || d < -0.05) return d;
    const { g, fissure } = groove(x, y, z);
    return d + 0.011 * g + 0.03 * fissure;
  };
  folded.box = inner.box;
  const base = new THREE.Color("#d79b84");
  const deep = new THREE.Color("#9b5b4d");
  return make(folded, 0.0075, 14000, (p) => {
    const { g, fissure } = groove(...p);
    return base.clone().lerp(deep, Math.min(1, g * 0.7 + fissure * 0.8));
  });
}

// --------------------------------------------------------------- brainstem
export async function midbrain() {
  const ped = mirrorX(capsule([0.04, -0.15, 0.1], [0.13, 0.02, 0.17], 0.055, 0.07)); // cerebral peduncles
  const core = ellipsoid([0, -0.07, 0.04], [0.1, 0.09, 0.1]);
  const colliculi = mirrorX(union(0.01, sphere([0.045, -0.02, -0.07], 0.035), sphere([0.042, -0.1, -0.065], 0.03)));
  let f = union(0.035, ped, core, colliculi);
  f = subtract(f, ellipsoid([0, -0.12, 0.17], [0.025, 0.06, 0.05]), 0.015); // interpeduncular fossa
  return make(relief(f, noise, 0.003, 25), 0.006, 3200, solid("#a99fcf"));
}

export async function pons() {
  const belly = ellipsoid([0, -0.27, 0.1], [0.165, 0.105, 0.12]);
  const back = ellipsoid([0, -0.27, -0.02], [0.11, 0.1, 0.09]);
  const mcp = mirrorX(capsule([0.1, -0.28, 0.03], [0.21, -0.32, -0.22], 0.07, 0.06)); // middle cerebellar peduncles
  const inner = union(0.04, belly, back, mcp);
  // Transverse fibres: fine horizontal ridges across the front of the pons
  const f: SDF = (x, y, z) => {
    const d = inner(x, y, z);
    if (d > 0.02 || z < 0.05) return d;
    return d + 0.003 * Math.pow(Math.abs(Math.sin(y * 95 + x * 4)), 4);
  };
  f.box = inner.box;
  // basilar groove down the midline
  const g = subtract(f, capsule([0, -0.18, 0.225], [0, -0.36, 0.215], 0.012), 0.01);
  return make(g, 0.006, 4200, solid("#9d95c4"));
}

export async function medulla() {
  const axis = spline([[0, -0.36, 0.04], [0, -0.5, 0.0], [0, -0.64, -0.06]], 8);
  const body = path(axis, (t) => 0.105 - 0.03 * t, 0.02);
  const pyramids = mirrorX(path([[0.03, -0.37, 0.12], [0.026, -0.5, 0.085], [0.02, -0.62, 0.03]], 0.028, 0.01));
  const olives = mirrorX(ellipsoid([0.075, -0.46, 0.07], [0.03, 0.055, 0.03]));
  const f = union(0.02, body, pyramids, olives);
  return make(relief(f, noise, 0.002, 30), 0.0055, 3000, solid("#a69ec9"));
}

export async function spinalCord() {
  const f = path(spline([[0, -0.6, -0.04], [0, -0.75, -0.11], [0, -0.9, -0.16]], 8), 0.068, 0.01);
  const fissure = subtract(f, path([[0, -0.6, 0.03], [0, -0.75, -0.04], [0, -0.92, -0.09]], 0.01), 0.004);
  return make(fissure, 0.006, 1500, solid("#c3bde0", 0.04));
}

// --------------------------------------------------------- deep structures
export async function thalamus() {
  const f = mirrorX(union(0.02, ellipsoid([0.075, 0.07, -0.02], [0.07, 0.068, 0.13]), ellipsoid([0.085, 0.04, -0.13], [0.05, 0.05, 0.05]))); // with the pulvinar behind
  return make(relief(f, noise, 0.002, 30), 0.006, 3000, solid("#8fa4dc"));
}

export async function hypothalamus() {
  const f = union(0.02, ellipsoid([0, -0.1, 0.15], [0.055, 0.05, 0.075]), mirrorX(sphere([0.02, -0.16, 0.07], 0.022))); // with the mammillary bodies
  return make(f, 0.005, 1400, solid("#b598d8"));
}

export async function pituitary() {
  const stalk = capsule([0, -0.14, 0.18], [0, -0.27, 0.2], 0.012, 0.01);
  const gland = union(0.012, ellipsoid([0, -0.31, 0.215], [0.045, 0.032, 0.038]), ellipsoid([0, -0.31, 0.175], [0.035, 0.03, 0.028]));
  return make(union(0.01, stalk, gland), 0.0045, 1400, solid("#de9fc4"));
}

export async function opticPathway() {
  const chiasm = ellipsoid([0, -0.212, 0.25], [0.06, 0.015, 0.03]);
  const nerves = mirrorX(path(spline([[0.025, -0.215, 0.26], [0.07, -0.225, 0.34], [0.11, -0.235, 0.41]], 8), 0.02, 0.005));
  const tracts = mirrorX(path(spline([[0.03, -0.2, 0.23], [0.12, -0.17, 0.12], [0.16, -0.12, 0.0]], 8), 0.017, 0.005));
  return make(union(0.012, chiasm, nerves, tracts), 0.0045, 2000, solid("#efe3a8", 0.04));
}

export async function olfactory() {
  // Sit in the groove under the frontal lobe (they were hanging a little below it)
  const tracts = mirrorX(path([[0.05, -0.215, 0.32], [0.06, -0.226, 0.5]], 0.01, 0.004));
  const bulbs = mirrorX(ellipsoid([0.062, -0.232, 0.58], [0.022, 0.014, 0.052]));
  return make(union(0.008, tracts, bulbs), 0.004, 1200, solid("#efd9a0", 0.04));
}

export async function hippocampus() {
  // Curls up and back along the floor of the temporal horn, then becomes the fornix.
  const body = mirrorX(path(spline([[0.3, -0.17, 0.12], [0.27, -0.12, -0.06], [0.2, -0.02, -0.22], [0.12, 0.1, -0.28]], 14), (t) => 0.042 * (1 - 0.65 * t), 0.01));
  // The "toes" of the head (pes hippocampi)
  const head = mirrorX(union(0.01, ...[0, 1, 2].map((k) => sphere([0.28 + 0.02 * k, -0.19 + 0.006 * k, 0.15 - 0.006 * k], 0.026))));
  return make(relief(union(0.02, body, head), noise, 0.0025, 28), 0.005, 2600, solid("#e1a49c"));
}

export async function amygdala() {
  return make(mirrorX(ellipsoid([0.28, -0.17, 0.22], [0.04, 0.04, 0.045])), 0.005, 800, solid("#eeb185"));
}

export async function basalGanglia() {
  const caudate = mirrorX(path(spline([[0.11, 0.14, 0.32], [0.13, 0.22, 0.12], [0.15, 0.2, -0.12], [0.24, 0.06, -0.28], [0.33, -0.1, -0.16]], 20), (t) => 0.062 * (1 - t) ** 1.4 + 0.012, 0.01));
  const lentiform = mirrorX(union(0.02, ellipsoid([0.2, 0.03, 0.1], [0.045, 0.09, 0.15]), ellipsoid([0.165, 0.02, 0.08], [0.03, 0.065, 0.1]))); // putamen + globus pallidus
  return make(union(0.01, caudate, lentiform), 0.006, 3600, solid("#7fbfae"));
}

export async function pineal() {
  return make(union(0.008, ellipsoid([0, 0.0, -0.15], [0.02, 0.018, 0.03]), capsule([0, 0.01, -0.1], [0, 0.0, -0.14], 0.01)), 0.003, 500, solid("#c8b07a"));
}
