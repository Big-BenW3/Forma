/**
 * Signed-distance-field modelling for organic shapes.
 *
 * Long bones, a skull, a brain or a mitochondrion are not boxes and tubes; they
 * are smooth forms that blend into each other and have holes carved into them.
 * Describing such a form as a distance function is the most compact way to get
 * that right: primitives are blended with a smooth minimum (like clay pressed
 * together), cavities are smooth-subtracted (like carving), and the surface is
 * extracted afterwards as a mesh.
 *
 *   const skull = union(6e-3, braincase, cheek, ...);    // blend
 *   const carved = subtract(skull, orbit, 3e-3);         // carve
 *   const geo = await meshSDF(carved, { min, max, cell: 1.2e-3, tris: 30000 });
 *
 * Meshing is "surface nets" (one vertex per surface cell, placed at the mean of
 * the cell's edge crossings, then projected onto the surface), which gives even,
 * well-shaped triangles. Only blocks near the surface are evaluated at full
 * resolution, so a fine grid stays fast. The mesh is then simplified with
 * meshoptimizer to a triangle budget, keeping the silhouette and the creases.
 *
 * Distances here are "bounds": ellipsoids and smooth blends are not exact
 * Euclidean distances, so the near-surface test keeps a safety margin.
 */
import * as THREE from "three";
import { MeshoptSimplifier } from "meshoptimizer";

export type Vec3 = [number, number, number];
export interface SDF {
  (x: number, y: number, z: number): number;
  /** Optional conservative bounding box; lets unions skip this term when far away. */
  box?: { min: Vec3; max: Vec3 };
}

// ------------------------------------------------------------------ helpers
const len3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Polynomial smooth minimum; k is the blend radius in model units. */
export function smin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

function withBox(f: SDF, min: Vec3, max: Vec3): SDF {
  f.box = { min, max };
  return f;
}
const boxDist = (b: { min: Vec3; max: Vec3 }, x: number, y: number, z: number) => {
  const dx = Math.max(b.min[0] - x, 0, x - b.max[0]);
  const dy = Math.max(b.min[1] - y, 0, y - b.max[1]);
  const dz = Math.max(b.min[2] - z, 0, z - b.max[2]);
  return len3(dx, dy, dz);
};

// --------------------------------------------------------------- primitives
export function sphere(c: Vec3, r: number): SDF {
  return withBox((x, y, z) => len3(x - c[0], y - c[1], z - c[2]) - r, [c[0] - r, c[1] - r, c[2] - r], [c[0] + r, c[1] + r, c[2] + r]);
}

/** Ellipsoid (bound, good near the surface). Optional rotation as Euler XYZ radians. */
export function ellipsoid(c: Vec3, r: Vec3, rot?: Vec3): SDF {
  const m = rot ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)).invert() : null;
  const e = m ? m.elements : null;
  const R = Math.max(...r);
  return withBox(
    (x, y, z) => {
      let px = x - c[0], py = y - c[1], pz = z - c[2];
      if (e) {
        const qx = e[0] * px + e[4] * py + e[8] * pz;
        const qy = e[1] * px + e[5] * py + e[9] * pz;
        const qz = e[2] * px + e[6] * py + e[10] * pz;
        px = qx; py = qy; pz = qz;
      }
      const k0 = len3(px / r[0], py / r[1], pz / r[2]);
      const k1 = len3(px / (r[0] * r[0]), py / (r[1] * r[1]), pz / (r[2] * r[2]));
      return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
    },
    [c[0] - R, c[1] - R, c[2] - R],
    [c[0] + R, c[1] + R, c[2] + R],
  );
}

/** Capsule / round cone from a (radius ra) to b (radius rb). */
export function capsule(a: Vec3, b: Vec3, ra: number, rb = ra): SDF {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const l2 = bx * bx + by * by + bz * bz;
  const R = Math.max(ra, rb);
  return withBox(
    (x, y, z) => {
      const px = x - a[0], py = y - a[1], pz = z - a[2];
      const h = l2 === 0 ? 0 : clamp((px * bx + py * by + pz * bz) / l2, 0, 1);
      return len3(px - bx * h, py - by * h, pz - bz * h) - (ra + (rb - ra) * h);
    },
    [Math.min(a[0], b[0]) - R, Math.min(a[1], b[1]) - R, Math.min(a[2], b[2]) - R],
    [Math.max(a[0], b[0]) + R, Math.max(a[1], b[1]) + R, Math.max(a[2], b[2]) + R],
  );
}

/** A smooth tube through points with a radius profile r(t), t in 0..1 along the path. */
export function path(pts: Vec3[], r: number | ((t: number) => number), k = 0): SDF {
  const rf = typeof r === "number" ? () => r : r;
  const segs: SDF[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) segs.push(capsule(pts[i], pts[i + 1], rf(i / n), rf((i + 1) / n)));
  return union(k, ...segs);
}

/** Catmull-Rom resample so a few control points make a smooth path. */
export function spline(ctrl: Vec3[], samples = 24): Vec3[] {
  const c = new THREE.CatmullRomCurve3(ctrl.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  return c.getPoints(samples).map((p) => [p.x, p.y, p.z] as Vec3);
}

/** Rounded box centred at c with half-extents h, corner radius r, optional rotation. */
export function box(c: Vec3, h: Vec3, r = 0, rot?: Vec3): SDF {
  const m = rot ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)).invert() : null;
  const e = m ? m.elements : null;
  const R = len3(...h) + r;
  return withBox(
    (x, y, z) => {
      let px = x - c[0], py = y - c[1], pz = z - c[2];
      if (e) {
        const qx = e[0] * px + e[4] * py + e[8] * pz;
        const qy = e[1] * px + e[5] * py + e[9] * pz;
        const qz = e[2] * px + e[6] * py + e[10] * pz;
        px = qx; py = qy; pz = qz;
      }
      const qx = Math.abs(px) - h[0] + r, qy = Math.abs(py) - h[1] + r, qz = Math.abs(pz) - h[2] + r;
      return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
    },
    [c[0] - R, c[1] - R, c[2] - R],
    [c[0] + R, c[1] + R, c[2] + R],
  );
}

/** Torus in the plane perpendicular to `axis` ("x" | "y" | "z"). */
export function torus(c: Vec3, R: number, r: number, axis: "x" | "y" | "z" = "y"): SDF {
  const E = R + r;
  return withBox(
    (x, y, z) => {
      const px = x - c[0], py = y - c[1], pz = z - c[2];
      const [u, v, w] = axis === "y" ? [px, pz, py] : axis === "x" ? [py, pz, px] : [px, py, pz];
      return len3(Math.sqrt(u * u + v * v) - R, w, 0) - r;
    },
    [c[0] - E, c[1] - E, c[2] - E],
    [c[0] + E, c[1] + E, c[2] + E],
  );
}

/** Half-space: negative on the side the normal points AWAY from (keeps dot(p - o, n) < 0). */
export function plane(o: Vec3, n: Vec3): SDF {
  const l = len3(...n);
  const nx = n[0] / l, ny = n[1] / l, nz = n[2] / l;
  return (x, y, z) => (x - o[0]) * nx + (y - o[1]) * ny + (z - o[2]) * nz;
}

// --------------------------------------------------------------- operations
/** Smooth union; terms with a bounding box are skipped when they cannot affect the result. */
export function union(k: number, ...fs: SDF[]): SDF {
  let bmin: Vec3 | null = [Infinity, Infinity, Infinity];
  const bmax: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const f of fs) {
    if (!f.box) { bmin = null; break; }
    for (let i = 0; i < 3; i++) { bmin[i] = Math.min(bmin[i], f.box.min[i] - k); bmax[i] = Math.max(bmax[i], f.box.max[i] + k); }
  }
  const g: SDF = (x, y, z) => {
    let d = Infinity;
    for (const f of fs) {
      if (f.box && d !== Infinity && boxDist(f.box, x, y, z) > d + k) continue;
      d = d === Infinity ? f(x, y, z) : smin(d, f(x, y, z), k);
    }
    return d;
  };
  if (bmin) g.box = { min: bmin, max: bmax };
  return g;
}

/** Smooth subtraction of `b` (carves b out of a). */
export function subtract(a: SDF, b: SDF, k = 0): SDF {
  const g: SDF = (x, y, z) => {
    const da = a(x, y, z);
    if (b.box && boxDist(b.box, x, y, z) > Math.abs(da) + k) return da;
    return smax(da, -b(x, y, z), k);
  };
  g.box = a.box;
  return g;
}

export function intersect(a: SDF, b: SDF, k = 0): SDF {
  const g: SDF = (x, y, z) => smax(a(x, y, z), b(x, y, z), k);
  g.box = a.box;
  return g;
}

/** Thin shell of thickness t around the surface of f (for membranes, cortex). */
export function shell(f: SDF, t: number): SDF {
  const g: SDF = (x, y, z) => Math.abs(f(x, y, z)) - t;
  g.box = f.box;
  return g;
}

/** Adds surface relief: d + amp * noise(p * freq). Keeps the box (grown by amp). */
export function relief(f: SDF, noise: (x: number, y: number, z: number) => number, amp: number, freq: number): SDF {
  const g: SDF = (x, y, z) => {
    const d = f(x, y, z);
    if (Math.abs(d) > amp * 4) return d;
    return d + amp * noise(x * freq, y * freq, z * freq);
  };
  if (f.box) g.box = { min: f.box.min.map((v) => v - amp) as Vec3, max: f.box.max.map((v) => v + amp) as Vec3 };
  return g;
}

/** Mirror in x: the shape authored on +x appears on both sides. */
export function mirrorX(f: SDF): SDF {
  const g: SDF = (x, y, z) => f(Math.abs(x), y, z);
  if (f.box) {
    const m = Math.max(Math.abs(f.box.min[0]), Math.abs(f.box.max[0]));
    g.box = { min: [-m, f.box.min[1], f.box.min[2]], max: [m, f.box.max[1], f.box.max[2]] };
  }
  return g;
}

/** Apply a point transform before evaluating (bend, twist, warp). Box is dropped unless given. */
export function warp(f: SDF, fn: (p: Vec3) => Vec3, box?: { min: Vec3; max: Vec3 }): SDF {
  const g: SDF = (x, y, z) => {
    const q = fn([x, y, z]);
    return f(q[0], q[1], q[2]);
  };
  if (box) g.box = box;
  return g;
}

// ------------------------------------------------------------------ meshing
export interface MeshOpts {
  min: Vec3;
  max: Vec3;
  /** Grid cell size in model units */
  cell: number;
  /** Target triangle count after simplification (omit to keep the full mesh) */
  tris?: number;
  /** Max simplification error, relative to mesh extent (default 0.004) */
  error?: number;
  /** Per-vertex colour from position and normal */
  color?: (p: Vec3, n: Vec3) => [number, number, number] | THREE.Color;
}

let simplifierReady: Promise<void> | null = null;

/** Extracts the zero surface of f as an indexed BufferGeometry with normals (and colours). */
export async function meshSDF(f: SDF, o: MeshOpts): Promise<THREE.BufferGeometry> {
  const h = o.cell;
  const nx = Math.ceil((o.max[0] - o.min[0]) / h) + 1;
  const ny = Math.ceil((o.max[1] - o.min[1]) / h) + 1;
  const nz = Math.ceil((o.max[2] - o.min[2]) / h) + 1;
  if (nx * ny * nz > 60e6) throw new Error(`sdf grid too large: ${nx}x${ny}x${nz}`);
  const val = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const X = (i: number) => o.min[0] + i * h, Y = (j: number) => o.min[1] + j * h, Z = (k: number) => o.min[2] + k * h;

  // 1. Values: coarse blocks first; refine only blocks that can contain surface.
  const B = 6;
  const reach = B * h * 0.87 * 1.8 + h * 2;
  for (let bk = 0; bk < nz; bk += B)
    for (let bj = 0; bj < ny; bj += B)
      for (let bi = 0; bi < nx; bi += B) {
        const ie = Math.min(bi + B, nx - 1), je = Math.min(bj + B, ny - 1), ke = Math.min(bk + B, nz - 1);
        const cx = X((bi + ie) / 2), cy = Y((bj + je) / 2), cz = Z((bk + ke) / 2);
        const dc = f(cx, cy, cz);
        const near = Math.abs(dc) < reach;
        for (let k = bk; k <= ke; k++)
          for (let j = bj; j <= je; j++)
            for (let i = bi; i <= ie; i++) val[at(i, j, k)] = near ? f(X(i), Y(j), Z(k)) : dc;
      }

  // 2. One vertex per cell that straddles the surface.
  const cellIdx = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cat = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = val[at(i + corner[c][0], j + corner[c][1], k + corner[c][2])];
          cv[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          const va = cv[a], vb = cv[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          sx += corner[a][0] + (corner[b][0] - corner[a][0]) * t;
          sy += corner[a][1] + (corner[b][1] - corner[a][1]) * t;
          sz += corner[a][2] + (corner[b][2] - corner[a][2]) * t;
          n++;
        }
        cellIdx[cat(i, j, k)] = pos.length / 3;
        pos.push(X(i) + (sx / n) * h, Y(j) + (sy / n) * h, Z(k) + (sz / n) * h);
      }

  // 3. A quad for every grid edge that crosses the surface.
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, c, b, a, d, c);
    else idx.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = val[at(i, j, k)] < 0;
        if (v0 !== val[at(i + 1, j, k)] < 0 && i < nx - 1)
          quad(cellIdx[cat(i, j - 1, k - 1)], cellIdx[cat(i, j, k - 1)], cellIdx[cat(i, j, k)], cellIdx[cat(i, j - 1, k)], !v0);
        if (v0 !== val[at(i, j + 1, k)] < 0 && j < ny - 1)
          quad(cellIdx[cat(i - 1, j, k - 1)], cellIdx[cat(i - 1, j, k)], cellIdx[cat(i, j, k)], cellIdx[cat(i, j, k - 1)], !v0);
        if (v0 !== val[at(i, j, k + 1)] < 0 && k < nz - 1)
          quad(cellIdx[cat(i - 1, j - 1, k)], cellIdx[cat(i, j - 1, k)], cellIdx[cat(i, j, k)], cellIdx[cat(i - 1, j, k)], !v0);
      }

  // 4. Project vertices onto the surface (two Newton steps) and take normals from the gradient.
  const nv = pos.length / 3;
  const P = new Float32Array(pos);
  const N = new Float32Array(nv * 3);
  const e = h * 0.25;
  const grad = (x: number, y: number, z: number): Vec3 => {
    const gx = f(x + e, y, z) - f(x - e, y, z);
    const gy = f(x, y + e, z) - f(x, y - e, z);
    const gz = f(x, y, z + e) - f(x, y, z - e);
    const l = len3(gx, gy, gz) || 1;
    return [gx / l, gy / l, gz / l];
  };
  for (let v = 0; v < nv; v++) {
    let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    for (let s = 0; s < 2; s++) {
      const d = f(x, y, z);
      const g = grad(x, y, z);
      const step = clamp(d, -h * 0.5, h * 0.5);
      x -= g[0] * step; y -= g[1] * step; z -= g[2] * step;
    }
    P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    const g = grad(x, y, z);
    N[v * 3] = g[0]; N[v * 3 + 1] = g[1]; N[v * 3 + 2] = g[2];
  }

  // 5. Simplify to the triangle budget.
  let index = new Uint32Array(idx);
  if (o.tris && index.length / 3 > o.tris) {
    simplifierReady ??= MeshoptSimplifier.ready;
    await simplifierReady;
    // The simplifier stops early once its error limit is reached, so the budget is
    // not guaranteed by one pass. Loosen the limit until the budget is met (a few
    // passes at most); the budget is a hard limit, the error is a preference.
    let err = o.error ?? 0.004;
    for (let pass = 0; pass < 6; pass++) {
      const [out] = MeshoptSimplifier.simplify(index, P, 3, o.tris * 3, err, ["LockBorder"]);
      if (out.length / 3 <= o.tris || pass === 5) {
        index = new Uint32Array(out);
        break;
      }
      err *= 2.5;
    }
  }
  // Compact: keep only referenced vertices.
  const remap = new Int32Array(nv).fill(-1);
  let count = 0;
  for (let t = 0; t < index.length; t++) if (remap[index[t]] < 0) remap[index[t]] = count++;
  const P2 = new Float32Array(count * 3), N2 = new Float32Array(count * 3);
  for (let v = 0; v < nv; v++) {
    const r = remap[v];
    if (r < 0) continue;
    P2.set(P.subarray(v * 3, v * 3 + 3), r * 3);
    N2.set(N.subarray(v * 3, v * 3 + 3), r * 3);
  }
  for (let t = 0; t < index.length; t++) index[t] = remap[index[t]];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P2, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(N2, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  if (o.color) {
    const C = new Float32Array(count * 3);
    const tmp = new THREE.Color();
    for (let v = 0; v < count; v++) {
      const c = o.color([P2[v * 3], P2[v * 3 + 1], P2[v * 3 + 2]], [N2[v * 3], N2[v * 3 + 1], N2[v * 3 + 2]]);
      if (c instanceof THREE.Color) tmp.copy(c);
      else tmp.setRGB(c[0], c[1], c[2]);
      C[v * 3] = tmp.r; C[v * 3 + 1] = tmp.g; C[v * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(C, 3));
  }
  return geo;
}

/**
 * Splits one mesh into named pieces by a per-triangle label (evaluated at the
 * triangle centroid). Used to cut one continuous surface (a skull, a cortex)
 * into separately selectable parts that still fit together perfectly.
 */
export function splitByLabel(geo: THREE.BufferGeometry, label: (p: Vec3) => string): Record<string, THREE.BufferGeometry> {
  const P = geo.getAttribute("position");
  const I = geo.getIndex()!;
  const buckets: Record<string, number[]> = {};
  for (let t = 0; t < I.count; t += 3) {
    const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2);
    const cx = (P.getX(a) + P.getX(b) + P.getX(c)) / 3;
    const cy = (P.getY(a) + P.getY(b) + P.getY(c)) / 3;
    const cz = (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3;
    (buckets[label([cx, cy, cz])] ??= []).push(a, b, c);
  }
  const out: Record<string, THREE.BufferGeometry> = {};
  for (const [k, tri] of Object.entries(buckets)) {
    const remap = new Map<number, number>();
    const attrs = Object.keys(geo.attributes);
    const data: Record<string, number[]> = Object.fromEntries(attrs.map((a) => [a, []]));
    const ni: number[] = [];
    for (const v of tri) {
      let r = remap.get(v);
      if (r === undefined) {
        r = remap.size;
        remap.set(v, r);
        for (const a of attrs) {
          const at = geo.getAttribute(a);
          for (let c = 0; c < at.itemSize; c++) data[a].push(at.array[v * at.itemSize + c] as number);
        }
      }
      ni.push(r);
    }
    const g = new THREE.BufferGeometry();
    for (const a of attrs) g.setAttribute(a, new THREE.Float32BufferAttribute(data[a], geo.getAttribute(a).itemSize));
    g.setIndex(ni);
    out[k] = g;
  }
  return out;
}
