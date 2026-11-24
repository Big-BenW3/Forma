/**
 * Organelles with real internal structure, as distance fields (cell scene units:
 * the cell is about 2.7 wide; organelles are enlarged for legibility).
 *
 *   mitochondrion  outer membrane, inner membrane folded into cristae; "open"
 *                  copies are sliced lengthwise so the cristae show
 *   golgi          a stack of curved cisternae with swollen rims and fenestrae,
 *                  vesicles budding from the edges
 *   rough ER       ruffled sheets around the nucleus, joined to each other
 *
 * Each builder meshes ONE copy in local coordinates; the scene places copies
 * with `placeCopies`, so many mitochondria cost one meshing pass.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeNoise3 } from "./math";
import { box, capsule, ellipsoid, intersect, meshSDF, plane, shell, sphere, subtract, torus, union, type SDF, type Vec3 } from "./sdf";

const noise = makeNoise3(5);

export function placeCopies(g: THREE.BufferGeometry, places: Array<{ p: Vec3; r: Vec3; s?: number }>) {
  return mergeGeometries(
    places.map(({ p, r, s }) => {
      const c = g.clone();
      c.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(s ?? 1, s ?? 1, s ?? 1)));
      return c;
    }),
  )!;
}

// ------------------------------------------------------------ mitochondrion
const ML = 0.17, MR = 0.075; // half length (x) and radius
function mitoField(open: boolean): SDF {
  // bean: bend the capsule a little along x
  const bend = (f: SDF): SDF => {
    const g: SDF = (x, y, z) => f(x, y - 0.6 * x * x, z);
    g.box = { min: [-ML - MR, -MR - 0.03, -MR], max: [ML + MR, MR + 0.03, MR] };
    return g;
  };
  const outer = capsule([-ML, 0, 0], [ML, 0, 0], MR);
  const innerSpace = capsule([-ML, 0, 0], [ML, 0, 0], MR - 0.014);
  // Cristae: plates across the inside, alternately hanging from the top and bottom walls.
  const plates: SDF[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = -ML * 0.92 + (i / (n - 1)) * ML * 1.84;
    const up = i % 2 === 0;
    plates.push(box([x + (noise(i, 0, 0) * 0.01), up ? 0.022 : -0.022, 0], [0.0045, MR * 0.62, MR * 0.78], 0.004));
  }
  const cristae = intersect(union(0.006, ...plates), innerSpace);
  const wall = shell(outer, 0.0055); // outer + inner membrane, drawn as one thick wall
  let f: SDF = union(0.004, wall, cristae);
  if (open) f = intersect(f, plane([0, 0.012, 0], [0, 1, 0]), 0.002); // keep the lower half, cut face up
  else f = union(0.0, outer); // closed: just the smooth outer membrane
  return bend(f);
}

export async function mitochondrion(open: boolean) {
  const f = mitoField(open);
  const outerC = new THREE.Color("#e0735a");
  const crista = new THREE.Color("#9c3226");
  const matrix = new THREE.Color("#f2b39c");
  return meshSDF(f, {
    min: [-ML - MR - 0.02, -MR - 0.06, -MR - 0.02],
    max: [ML + MR + 0.02, MR + 0.06, MR + 0.02],
    cell: 0.0045,
    tris: open ? 4400 : 1000,
    error: 0.006,
    color: (p, n) => {
      // outer skin vs. the inside: distance from the axis (in the bent frame)
      const yb = p[1] - 0.6 * p[0] * p[0];
      const r = Math.hypot(yb, p[2]);
      if (!open || r > MR - 0.006) return outerC.clone().multiplyScalar(0.92 + 0.08 * (noise(p[0] * 30, p[1] * 30, p[2] * 30) * 0.5 + 0.5));
      // cut face of the wall vs. cristae folds
      return n[1] > 0.8 && r > MR - 0.02 ? matrix.clone() : crista.clone().lerp(matrix, 0.25 * (noise(p[0] * 40, yb * 40, p[2] * 40) * 0.5 + 0.5));
    },
  });
}

// ------------------------------------------------------------------- golgi
export async function golgi() {
  const parts: SDF[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const R = 0.22 - i * 0.015; // cisterna radius
    const y = i * 0.046;
    const curve = 0.55; // bowl radius of curvature
    // A thin curved disc: shell of a large sphere, clipped to a radius, with a swollen rim.
    const sphereC: Vec3 = [0, y + curve, 0];
    const disc = intersect(shell(sphere(sphereC, curve), 0.0085), capsule([0, y - 0.2, 0], [0, y + 0.2, 0], R), 0.006);
    disc.box = { min: [-R - 0.02, y - 0.06, -R - 0.02], max: [R + 0.02, y + 0.06, R + 0.02] };
    const rimY = y + curve - Math.sqrt(curve * curve - R * R);
    const rim = torus([0, rimY, 0], R - 0.004, 0.017, "y");
    let c: SDF = union(0.012, disc, rim);
    // Fenestrae: a few holes through each cisterna
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + i;
      const rr = R * 0.6;
      c = subtract(c, capsule([Math.cos(a) * rr, y - 0.1, Math.sin(a) * rr], [Math.cos(a) * rr, y + 0.1, Math.sin(a) * rr], 0.018), 0.006);
    }
    parts.push(c);
  }
  // Vesicles budding from the rims (still attached by a neck) and free ones nearby
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.4;
    const i = k % n;
    const R = 0.22 - i * 0.015 + 0.035;
    const y = i * 0.046 + 0.55 - Math.sqrt(0.55 * 0.55 - (R - 0.035) ** 2);
    parts.push(union(0.012, sphere([Math.cos(a) * R, y, Math.sin(a) * R], 0.024), capsule([Math.cos(a) * (R - 0.03), y, Math.sin(a) * (R - 0.03)], [Math.cos(a) * R, y, Math.sin(a) * R], 0.009)));
  }
  const f = union(0.003, ...parts);
  const base = new THREE.Color("#e47a8c"), deep = new THREE.Color("#b84a63");
  return meshSDF(f, {
    min: [-0.3, -0.08, -0.3],
    max: [0.3, 0.42, 0.3],
    cell: 0.0042,
    tris: 9000,
    error: 0.006,
    color: (p) => base.clone().lerp(deep, Math.min(1, Math.max(0, p[1] / 0.3)) * 0.6),
  });
}

// ---------------------------------------------------------------- rough ER
export async function roughER(nuc: Vec3, nucR: number) {
  const sheets: SDF[] = [];
  const window = (p: Vec3) => {
    const dx = p[0] - nuc[0], dy = p[1] - nuc[1], dz = p[2] - nuc[2];
    const r = Math.hypot(dx, dy, dz);
    const phi = Math.atan2(dz, dx) / Math.PI; // -1..1
    const theta = Math.acos(Math.max(-1, Math.min(1, dy / (r || 1)))) / Math.PI; // 0..1
    return { r, phi, theta };
  };
  for (let s = 0; s < 4; s++) {
    const R0 = nucR + 0.085 + s * 0.06;
    const ph0 = -0.62 + s * 0.04, ph1 = 0.16 - s * 0.03;
    const f: SDF = (x, y, z) => {
      const { r, phi, theta } = window([x, y, z]);
      const ruffle = Math.sin(phi * 70 + s * 1.7) * 0.012 + Math.cos(theta * 55 + s * 2.1) * 0.01 + noise(x * 5, y * 5, z * 5) * 0.012;
      const d = Math.abs(r - (R0 + ruffle)) - 0.011;
      // angular window, converted to rough distances
      const dp = Math.max(ph0 - phi, phi - ph1) * Math.PI * r;
      const dt = Math.max(0.27 - theta, theta - 0.87) * Math.PI * r;
      return Math.max(d, dp, dt);
    };
    const RR = R0 + 0.05;
    f.box = { min: [nuc[0] - RR, nuc[1] - RR, nuc[2] - RR], max: [nuc[0] + RR, nuc[1] + RR, nuc[2] + RR] };
    sheets.push(f);
  }
  // Short bridges between neighbouring sheets: the ER is one continuous membrane
  const bridges: SDF[] = [];
  for (let k = 0; k < 10; k++) {
    const phi = (-0.5 + k * 0.065) * Math.PI, th = (0.35 + (k % 4) * 0.12) * Math.PI;
    const dir: Vec3 = [Math.sin(th) * Math.cos(phi), Math.cos(th), Math.sin(th) * Math.sin(phi)];
    const r0 = nucR + 0.085, r1 = nucR + 0.085 + 0.18;
    bridges.push(capsule([nuc[0] + dir[0] * r0, nuc[1] + dir[1] * r0, nuc[2] + dir[2] * r0], [nuc[0] + dir[0] * r1, nuc[1] + dir[1] * r1, nuc[2] + dir[2] * r1], 0.014));
  }
  const f = union(0.012, ...sheets, ...bridges);
  const RR = nucR + 0.085 + 0.24;
  const g = await meshSDF(f, {
    min: [nuc[0] - RR, nuc[1] - RR, nuc[2] - RR],
    max: [nuc[0] + RR, nuc[1] + RR, nuc[2] + RR],
    cell: 0.0075,
    tris: 12000,
    error: 0.006,
    color: (p) => new THREE.Color("#e6b84a").multiplyScalar(0.9 + 0.1 * (noise(p[0] * 20, p[1] * 20, p[2] * 20) * 0.5 + 0.5)),
  });
  // Ribosomes: dots on the outer faces of the sheets
  const dots: THREE.BufferGeometry[] = [];
  const rnd = (() => { let s = 99; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const P = g.getAttribute("position"), N = g.getAttribute("normal");
  const count = P.count;
  for (let k = 0; k < 420; k++) {
    const i = Math.floor(rnd() * count);
    const nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
    // only on surfaces facing away from the nucleus
    const ox = P.getX(i) - nuc[0], oy = P.getY(i) - nuc[1], oz = P.getZ(i) - nuc[2];
    if (nx * ox + ny * oy + nz * oz < 0) continue;
    const d = new THREE.IcosahedronGeometry(0.011, 0);
    d.translate(P.getX(i) + nx * 0.009, P.getY(i) + ny * 0.009, P.getZ(i) + nz * 0.009);
    dots.push(d);
  }
  return { sheets: g, ribosomes: mergeGeometries(dots)! };
}

// ----------------------------------------------------------- small bodies
/** Peroxisome: a round body with a crystalline core that shows through. */
export async function peroxisome() {
  const f = union(0.0, sphere([0, 0, 0], 0.048));
  const shellC = new THREE.Color("#7cc36e");
  return meshSDF(f, { min: [-0.06, -0.06, -0.06], max: [0.06, 0.06, 0.06], cell: 0.003, tris: 300, error: 0.03, color: () => shellC });
}

export async function peroxisomeCore() {
  return meshSDF(box([0, 0, 0], [0.018, 0.018, 0.018], 0.003, [0.5, 0.6, 0.2]), { min: [-0.04, -0.04, -0.04], max: [0.04, 0.04, 0.04], cell: 0.002, tris: 120, error: 0.03, color: () => new THREE.Color("#2f6e2b") });
}

/** A vesicle fusing with the membrane (exocytosis): an omega shape opening outward. */
export async function fusingVesicle() {
  const v = sphere([0, -0.03, 0], 0.035);
  const f = subtract(shell(v, 0.006), capsule([0, 0, 0], [0, 0.05, 0], 0.016), 0.006);
  return meshSDF(f, { min: [-0.05, -0.08, -0.05], max: [0.05, 0.03, 0.05], cell: 0.0025, tris: 500, error: 0.02, color: () => new THREE.Color("#f0a3ae") });
}

export { ellipsoid };
