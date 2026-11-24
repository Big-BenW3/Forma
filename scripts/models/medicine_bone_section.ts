/**
 * Scene: medicine_bone_section  (Medicine & Surgery, lesson 2, opened from a long bone)
 *
 * A long bone cut open to show its layers, outside to inside:
 *   periosteum -> compact bone -> spongy bone (+ red marrow) / medullary cavity (yellow marrow)
 * with articular cartilage capping each end.
 *
 * Two views of the same structure sit side by side:
 *   - the bone itself, cut lengthwise (the near half is removed),
 *   - a loose slice of the shaft cut crosswise, tipped toward the viewer.
 * Each interactive part owns meshes in BOTH, so selecting "Compact bone"
 * highlights it in the long section and the cross-section at once.
 *
 * Built as a revolve (lathe) of a wall-thickness profile, then cut at the z = 0
 * plane with flat cut faces. SCALE: 1 unit is not a real length here; the
 * inspector cards carry the real sizes (a femur is about 45 cm).
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { displace, ellipsoid, group, lathe, mat, merge, mesh, paint, tint, tube, V, xf } from "./lib/geo";
import { makeNoise3, rng, smoothstep } from "./lib/math";

const noise = makeNoise3(33);
const rand = rng(5);
const P = (x: number, y: number, z: number) => V(x, y, z);

// ------------------------------------------------------------- bone profile
const HALF = 0.62; // half length of the bone
const SHAFT_R = 0.115;
const EPI_R = 0.215;
const WALL = 0.043; // compact bone thickness in the shaft
const SHELL = 0.013; // compact bone thickness at the ends

/** Outer radius at height y (symmetric about y = 0). */
function outerR(yy: number) {
  const y = Math.abs(yy);
  if (y <= 0.3) return SHAFT_R;
  if (y <= 0.44) return SHAFT_R + (EPI_R - SHAFT_R) * smoothstep(0.3, 0.44, y);
  if (y <= 0.52) return EPI_R;
  const t = Math.min(1, (y - 0.52) / (HALF - 0.52));
  return EPI_R * Math.sqrt(Math.max(0, 1 - t * t));
}
/** Inner radius of the compact bone: thick wall on the shaft, thin shell on the ends. */
function innerR(yy: number) {
  const y = Math.abs(yy);
  const shaft = SHAFT_R - WALL;
  if (y <= 0.31) return shaft;
  const end = Math.max(0.0, outerR(y) - SHELL);
  return shaft + (end - shaft) * smoothstep(0.31, 0.44, y);
}


const ys = (n: number, a: number, b: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

// The near half (z > 0) is removed: keep phi in [pi/2, 3pi/2] (z = r * cos(phi) <= 0).
const PHI0 = Math.PI / 2;
const PHI_LEN = Math.PI;

/** Half-revolve of a closed (r, y) loop, plus flat cut faces on the z = 0 plane. */
function halfSolid(loop: Array<[number, number]>, color: string, opts: { seg?: number; relief?: number; cutColor?: string; cutZ?: number } = {}) {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.LatheGeometry(loop.map(([r, y]) => new THREE.Vector2(r, y)), opts.seg ?? 28, PHI0, PHI_LEN);
  if (opts.relief) displace(body, noise, opts.relief, 18);
  parts.push(paint(body, color, "#bcae8d", noise, [14, 14, 14]));
  parts.push(...cutFaces(loop, opts.cutColor ?? color, opts.cutZ ?? 0.0004));
  return parts;
}

/** The flat faces left where the near half is cut away (one on each side of the axis). */
function cutFaces(loop: Array<[number, number]>, color: string, z: number) {
  const out: THREE.BufferGeometry[] = [];
  for (const sgn of [1, -1]) {
    const shape = new THREE.Shape(loop.map(([r, y]) => new THREE.Vector2(sgn * r, y)));
    const g = new THREE.ShapeGeometry(shape);
    // ShapeGeometry faces +z: toward the viewer, exactly the cut plane. Nudge it forward a hair to avoid z-fighting.
    xf(g, { p: [0, 0, z] });
    out.push(tint(g, color));
  }
  return out;
}

/** Closed wall loop between two radius functions over a y-range (compact bone, periosteum). */
function wallLoop(inner: (y: number) => number, outer: (y: number) => number, y0: number, y1: number, n = 40): Array<[number, number]> {
  const up = ys(n, y0, y1);
  const outerPts = up.map((y): [number, number] => [outer(y), y]);
  const innerPts = [...up].reverse().map((y): [number, number] => [inner(y), y]);
  return [...outerPts, ...innerPts, outerPts[0]];
}

export async function buildBoneSection() {
  const B = new SceneBuild({ sceneId: "medicine_bone_section", view: [0.3, 0.12, 1], fit: 4.4, fov: 30 });
  B.group("outer", "Outer layers", "#c98a7a");
  B.group("hard", "Hard bone", "#b8a97f");
  B.group("marrow", "Marrow", "#d9a22e");
  const m = mat({ color: "#ffffff", rough: 0.6 });
  const mGloss = mat({ color: "#ffffff", rough: 0.25 });

  // Slice placement: a short ring of the shaft, tipped toward the viewer
  const SLICE_AT = P(0.66, 0.0, 0.0);
  const SLICE_H = 0.07;
  const tip = (g: THREE.BufferGeometry) => {
    xf(g, { r: [-0.85, 0, 0] });
    xf(g, { p: [SLICE_AT.x, SLICE_AT.y, SLICE_AT.z] });
    return g;
  };
  /** A full ring/disc of the shaft between two radii, for the loose slice. */
  const sliceRing = (ri: number, ro: number, color: string, h = SLICE_H) => {
    const loop: Array<[number, number]> = ri <= 0 ? [[0, -h / 2], [ro, -h / 2], [ro, h / 2], [0, h / 2]] : [[ri, -h / 2], [ro, -h / 2], [ro, h / 2], [ri, h / 2], [ri, -h / 2]];
    return tip(tint(lathe(loop, 48), color));
  };

  // ============================================================ periosteum
  {
    const parts: THREE.BufferGeometry[] = [];
    const lp = wallLoop((y) => outerR(y) + 0.0005, (y) => outerR(y) + 0.0075, -0.34, 0.34, 30);
    parts.push(...halfSolid(lp, "#d99a8c", { seg: 32 }));
    // Blood vessels that run in the membrane: thin red lines on the outer surface
    for (let k = 0; k < 9; k++) {
      const phi = PHI0 + 0.25 + (k / 8) * (PHI_LEN - 0.5);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 14; i++) {
        const y = -0.33 + (0.66 * i) / 14;
        const wob = Math.sin(i * 1.7 + k * 2.3) * 0.18;
        const r = outerR(y) + 0.0095;
        pts.push(P(r * Math.sin(phi + wob * 0.2), y, r * Math.cos(phi + wob * 0.2)));
      }
      parts.push(tint(tube(pts, 0.0021, { radial: 5, segments: 24 }), "#9e2b2b"));
    }
    // Cross-section slice: the thin outer ring
    parts.push(sliceRing(SHAFT_R + 0.0005, SHAFT_R + 0.0075, "#d99a8c"));
    B.root.add(B.part(group("x", mesh(merge(parts), m, "periosteum_geo")), { id: "bone_periosteum", name: "Periosteum", group: "outer", anchor: [-SHAFT_R - 0.008, 0.22, -0.02], view: [-0.6, 0.1, 1], fit: 2.2 }));
  }

  // ============================================================ compact bone
  {
    const parts: THREE.BufferGeometry[] = [];
    parts.push(...halfSolid(wallLoop(innerR, outerR, -HALF + 0.0005, HALF - 0.0005, 70), "#e3d6b8", { seg: 36, relief: 0.0012, cutColor: "#efe3c8" }));
    // Slice: the thick ring, with the tiny canals (osteons) and growth rings visible on its face
    parts.push(sliceRing(SHAFT_R - WALL, SHAFT_R, "#eadfc4"));
    for (const rr of [0.083, 0.098, 0.109]) {
      const g = tint(lathe([[rr - 0.0011, 0], [rr + 0.0011, 0], [rr + 0.0011, 0.0006], [rr - 0.0011, 0.0006], [rr - 0.0011, 0]], 60), "#cdbf9d");
      xf(g, { p: [0, SLICE_H / 2 + 0.0005, 0] });
      parts.push(tip(g));
    }
    for (let i = 0; i < 46; i++) {
      const a = rand() * Math.PI * 2;
      const rr = SHAFT_R - WALL + 0.006 + rand() * (WALL - 0.012);
      const g = tint(xf(ellipsoid(0.0034, 0.0014, 0.0034, 8, 6), { p: [Math.cos(a) * rr, SLICE_H / 2 + 0.0008, Math.sin(a) * rr] }), "#9c8a66");
      parts.push(tip(g));
    }
    B.root.add(B.part(group("x", mesh(merge(parts), m, "compact_geo")), { id: "bone_compact", name: "Compact bone", group: "hard", anchor: [SHAFT_R - WALL / 2, 0.12, 0.002], view: [0.2, 0.1, 1], fit: 2.0 }));
  }

  // ============================================================ spongy bone + red marrow
  {
    // Red marrow fills the hollow ends: a half-revolve bounded by the inner wall and the axis
    const fill = (sign: 1 | -1) => {
      const y0 = 0.322;
      const dome = [[0.0, 0.34], [0.03, 0.335], [0.055, 0.326], [0.072, 0.31]] as Array<[number, number]>;
      const up = ys(26, 0.31, HALF - SHELL - 0.001).map((y): [number, number] => [innerR(y) - 0.0004, y]);
      const topAxis: Array<[number, number]> = [[0, HALF - SHELL - 0.001]];
      const loop: Array<[number, number]> = [...dome.slice().reverse().reverse(), ...up, ...topAxis];
      void y0;
      return loop.map(([r, y]): [number, number] => [r, sign * y]);
    };
    const redParts: THREE.BufferGeometry[] = [];
    const lattice: THREE.BufferGeometry[] = [];
    for (const sign of [1, -1] as const) {
      const loop = fill(sign);
      // Lathe needs a consistent direction; reverse the lower end so normals face out
      const lp = sign === 1 ? loop : loop.slice().reverse();
      // Recessed 5 cm behind the cut plane so the spongy-bone struts stand out in front of the marrow.
      redParts.push(...halfSolid(lp, "#a93236", { seg: 30, cutColor: "#b53c3f", cutZ: -0.05 }));

      // Spongy bone: a lattice of thin struts (trabeculae) joining jittered grid points inside the end
      const pts: THREE.Vector3[] = [];
      const step = 0.046;
      for (let y = 0.34; y < HALF - SHELL - 0.012; y += step)
        for (let x = -EPI_R; x <= EPI_R; x += step)
          for (let z = -EPI_R; z <= 0.0; z += step) {
            const p = P(x + (rand() - 0.5) * step * 0.7, y + (rand() - 0.5) * step * 0.7, z + (rand() - 0.5) * step * 0.7);
            p.z = Math.min(p.z, 0.0);
            const rho = Math.hypot(p.x, p.z);
            if (rho < innerR(p.y) - 0.012 && p.y < HALF - SHELL - 0.012) pts.push(p);
          }
      const link = (a: THREE.Vector3, b: THREE.Vector3) => {
        const mid = a.clone().lerp(b, 0.5);
        // Trabeculae curve along the lines of load: a slight pull toward the vertical
        mid.y += (rand() - 0.5) * 0.012;
        mid.x += (rand() - 0.5) * 0.01;
        const r = 0.0052 + rand() * 0.0032;
        lattice.push(tint(tube([sign === 1 ? a.clone() : a.clone().setY(-a.y), sign === 1 ? mid : mid.clone().setY(-mid.y), sign === 1 ? b.clone() : b.clone().setY(-b.y)], r, { radial: 4, segments: 2 }), "#f1e6cb"));
      };
      for (let i = 0; i < pts.length; i++) {
        let n = 0;
        for (let j = i + 1; j < pts.length && n < 3; j++) {
          const d = pts[i].distanceTo(pts[j]);
          if (d > 0.025 && d < 0.082) {
            link(pts[i], pts[j]);
            n++;
          }
        }
      }
    }
    // Slice: the spongy/marrow side is not in a shaft slice; red marrow lines the inner wall
    B.root.add(B.part(group("x", mesh(merge(redParts), m, "red_marrow_geo")), { id: "bone_red_marrow", name: "Red bone marrow", group: "marrow", anchor: [0.1, 0.46, -0.06], view: [0.3, 0.2, 1], fit: 2.4 }));
    B.root.add(B.part(group("x", mesh(merge(lattice), m, "spongy_geo")), { id: "bone_spongy", name: "Spongy bone", group: "hard", anchor: [-0.1, 0.45, -0.02], view: [0.1, 0.2, 1], fit: 2.1 }));
  }

  // ============================================================ medullary cavity (yellow marrow)
  {
    const parts: THREE.BufferGeometry[] = [];
    const R = SHAFT_R - WALL - 0.0004;
    // A capsule-like loop: rounded ends where the cavity meets the spongy bone
    const prof: Array<[number, number]> = [[0, -0.34]];
    for (let i = 1; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2);
      prof.push([R * Math.sin(a), -0.31 - 0.03 * Math.cos(a)]);
    }
    prof.push([R, 0.31]);
    for (let i = 1; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2);
      prof.push([R * Math.cos(a), 0.31 + 0.03 * Math.sin(a)]);
    }
    prof.push([0, 0.34]);
    parts.push(...halfSolid(prof, "#e6bf4c", { seg: 28, cutColor: "#f0cd66" }));
    // Slice: the marrow disc filling the cavity
    parts.push(sliceRing(0, R, "#efca5d"));
    B.root.add(B.part(group("x", mesh(merge(parts), m, "medullary_geo")), { id: "bone_medullary_cavity", name: "Medullary cavity", group: "marrow", anchor: [0.0, -0.05, 0.004], view: [0.2, 0.1, 1], fit: 2.0 }));
  }

  // ============================================================ articular cartilage
  {
    const parts: THREE.BufferGeometry[] = [];
    for (const sign of [1, -1] as const) {
      const a = EPI_R, b = HALF - 0.52, t = 0.017;
      const outer: Array<[number, number]> = [];
      const inner: Array<[number, number]> = [];
      for (let i = 0; i <= 14; i++) {
        const q = (i / 14) * (Math.PI / 2);
        outer.push([(a + t) * Math.cos(q), 0.52 + (b + t) * Math.sin(q)]);
        inner.push([a * Math.cos(q), 0.52 + b * Math.sin(q)]);
      }
      // Loop: up the outside, back down the inside (flip for the lower end)
      const loop = [...outer, ...inner.slice().reverse(), outer[0]].map(([r, y]): [number, number] => [r, sign * y]);
      parts.push(...halfSolid(sign === 1 ? loop : loop.slice().reverse(), "#a8d4e6", { seg: 30, cutColor: "#c4e4f0" }));
    }
    B.root.add(B.part(group("x", mesh(merge(parts), mGloss, "cartilage_geo")), { id: "bone_articular_cartilage", name: "Articular cartilage", group: "outer", anchor: [0.0, HALF + 0.015, -0.02], view: [0.3, 0.6, 1], fit: 2.0 }));
  }

  void displace;
  return B.write("public/models");
}

if (require.main === module) buildBoneSection().then((r) => console.log(JSON.stringify(r)));
