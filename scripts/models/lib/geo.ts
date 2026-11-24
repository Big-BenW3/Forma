/**
 * Geometry and material helpers for the procedural model scripts.
 *
 * Models are authored as an ordinary three.js scene graph (Groups and Meshes),
 * then converted to glTF by export.ts. Authoring in three means we get its
 * geometry primitives, bounding boxes and matrix maths for free.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export interface MatOpts {
  color: string | number;
  rough?: number;
  metal?: number;
  emissive?: string | number;
  emissiveIntensity?: number;
  /** 0..1; below 1 turns on alpha blending */
  opacity?: number;
  double?: boolean;
  /** Pre-encoded texture (webp/png) baked into the base colour */
  map?: { buffer: Buffer; mime: "image/webp" | "image/png" };
}

/** Materials are cached by their options so identical looks share one glTF material. */
const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(o: MatOpts): THREE.MeshStandardMaterial {
  const key = JSON.stringify({ ...o, map: o.map ? o.map.buffer.length + o.map.mime : null });
  const hit = matCache.get(key);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(o.color),
    roughness: o.rough ?? 0.7,
    metalness: o.metal ?? 0,
    emissive: new THREE.Color(o.emissive ?? 0x000000),
    emissiveIntensity: o.emissiveIntensity ?? 1,
    opacity: o.opacity ?? 1,
    transparent: (o.opacity ?? 1) < 1,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (o.map) m.userData.map = o.map;
  m.name = `m${matCache.size}`;
  matCache.set(key, m);
  return m;
}

// ---------------------------------------------------------------------------
// Scene-graph conveniences
// ---------------------------------------------------------------------------

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material, name?: string) {
  const m = new THREE.Mesh(geo, material);
  if (name) m.name = name;
  return m;
}

export function group(name: string, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  for (const c of children) g.add(c);
  return g;
}

/** Position (and optional Euler rotation in radians) in one call. Returns the object. */
export function place<T extends THREE.Object3D>(
  o: T,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): T {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
}

/** Bakes a transform into a geometry (so merged geometry keeps its place). */
export function xf(
  geo: THREE.BufferGeometry,
  t: { p?: [number, number, number]; r?: [number, number, number]; s?: [number, number, number] | number },
) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.r ?? [0, 0, 0])));
  const s = typeof t.s === "number" ? ([t.s, t.s, t.s] as const) : (t.s ?? [1, 1, 1]);
  m.compose(new THREE.Vector3(...(t.p ?? [0, 0, 0])), q, new THREE.Vector3(...s));
  geo.applyMatrix4(m);
  return geo;
}

/** Ensures position + normal + uv exist and the geometry is indexed, so geometries can merge. */
export function normalize(geo: THREE.BufferGeometry) {
  let g = geo;
  if (!g.index) {
    // Non-indexed -> indexed with a trivial index; merge does not require welding.
    const n = g.getAttribute("position").count;
    g = g.clone();
    g.setIndex(Array.from({ length: n }, (_, i) => i));
  }
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  if (!g.getAttribute("uv")) {
    g.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2),
    );
  }
  // Only keep attributes the glTF exporter uses, so merges never fail on stray ones.
  for (const k of Object.keys(g.attributes)) {
    if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
  }
  return g;
}

/** Merges many geometries into one (one draw call). Falls back gracefully on an empty list. */
export function merge(geos: THREE.BufferGeometry[]) {
  const list = geos.map(normalize);
  const withColor = list.some((g) => g.getAttribute("color"));
  if (withColor) {
    for (const g of list) {
      if (!g.getAttribute("color")) {
        const n = g.getAttribute("position").count;
        const c = new Float32Array(n * 3).fill(1);
        g.setAttribute("color", new THREE.BufferAttribute(c, 3));
      }
    }
  }
  const out = mergeGeometries(list, false);
  if (!out) throw new Error("merge failed: incompatible geometry attributes");
  return out;
}

/** Paints every vertex of a geometry one colour (glTF COLOR_0) */
export function tint(geo: THREE.BufferGeometry, color: string | number) {
  const c = new THREE.Color(color);
  const n = geo.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

// ---------------------------------------------------------------------------
// Shape builders
// ---------------------------------------------------------------------------

export function ellipsoid(rx: number, ry: number, rz: number, w = 40, h = 28) {
  const g = new THREE.SphereGeometry(1, w, h);
  g.scale(rx, ry, rz);
  return g;
}

/** Lathe from a [radius, y] profile; the profile should run bottom to top. */
export function lathe(profile: Array<[number, number]>, segments = 32) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

/**
 * A closed, variable-radius tube along a smooth curve.
 * `radius` may be a number or a function of t in [0, 1] along the curve.
 * Ends are capped with fans so the solid is watertight (required for the
 * stencil cross-section caps in the viewer).
 */
export function tube(
  points: THREE.Vector3[],
  radius: number | ((t: number) => number),
  opts: {
    segments?: number;
    radial?: number;
    closedCurve?: boolean;
    tension?: number;
    capped?: boolean;
    /**
     * Flat-band section instead of a round one (a rib, a ligament): `wide` x radius across `dir`
     * (projected square to the path), `thin` x radius across the other way.
     */
    flat?: { dir: [number, number, number]; wide: number; thin: number };
  } = {},
) {
  const segments = opts.segments ?? Math.max(8, points.length * 6);
  const radial = opts.radial ?? 10;
  const capped = opts.capped ?? true;
  const curve = new THREE.CatmullRomCurve3(points, opts.closedCurve ?? false, "catmullrom", opts.tension ?? 0.5);
  const frames = curve.computeFrenetFrames(segments, opts.closedCurve ?? false);
  const rFn = typeof radius === "number" ? () => radius : radius;

  const pos: number[] = [];
  const idx: number[] = [];
  const rings = segments + 1;
  for (let i = 0; i < rings; i++) {
    const t = i / segments;
    const c = curve.getPointAt(Math.min(t, 1));
    let n = frames.normals[i];
    let b = frames.binormals[i];
    const r = rFn(t);
    let kx = 1, ky = 1;
    if (opts.flat) {
      // Wide axis = the requested direction made square to the path; thin axis = path x wide.
      const tan = curve.getTangentAt(Math.min(t, 1));
      const d = new THREE.Vector3(...opts.flat.dir);
      const w = d.sub(tan.clone().multiplyScalar(d.dot(tan)));
      if (w.lengthSq() > 1e-8) {
        n = w.normalize();
        b = new THREE.Vector3().crossVectors(tan, n).normalize();
        kx = opts.flat.wide;
        ky = opts.flat.thin;
      }
    }
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cx = Math.cos(a) * r * kx;
      const cy = Math.sin(a) * r * ky;
      pos.push(c.x + n.x * cx + b.x * cy, c.y + n.y * cx + b.y * cy, c.z + n.z * cx + b.z * cy);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b2 = i * radial + ((j + 1) % radial);
      const c2 = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      idx.push(a, b2, c2, b2, d, c2);
    }
  }
  if (capped && !opts.closedCurve) {
    for (const end of [0, segments]) {
      const c = curve.getPointAt(end / segments);
      const ci = pos.length / 3;
      pos.push(c.x, c.y, c.z);
      for (let j = 0; j < radial; j++) {
        const a = end * radial + j;
        const b2 = end * radial + ((j + 1) % radial);
        if (end === 0) idx.push(ci, b2, a);
        else idx.push(ci, a, b2);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A sagging cable between two points (catenary-like), used for jumper wires. */
export function cablePoints(a: THREE.Vector3, b: THREE.Vector3, sag: number, n = 12) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t);
    // parabola that is 0 at the ends and `sag` at the middle, bowing upward
    p.y += sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return pts;
}

/** A wedge-free rounded box built by scaling a segmented cube's corners (soft-edged slab). */
export function roundedBox(w: number, h: number, d: number, r: number, seg = 4) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const p = g.getAttribute("position");
  const v = new THREE.Vector3();
  const half = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const inner = new THREE.Vector3(
      Math.max(-half.x, Math.min(half.x, v.x)),
      Math.max(-half.y, Math.min(half.y, v.y)),
      Math.max(-half.z, Math.min(half.z, v.z)),
    );
    const dir = v.clone().sub(inner);
    if (dir.lengthSq() > 1e-12) dir.normalize().multiplyScalar(r);
    p.setXYZ(i, inner.x + dir.x, inner.y + dir.y, inner.z + dir.z);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Added for anatomy scenes
// ---------------------------------------------------------------------------

/** Mirrors a geometry across the YZ plane (x -> -x) and restores outward winding. */
export function mirrorX(geo: THREE.BufferGeometry) {
  const g = normalize(geo).clone();
  const p = g.getAttribute("position");
  const n = g.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    p.setX(i, -p.getX(i));
    n.setX(i, -n.getX(i));
  }
  const idx = g.index!;
  // A mirror reverses triangle orientation; swap two indices per triangle to flip it back.
  for (let i = 0; i < idx.count; i += 3) {
    const b = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, b);
  }
  return g;
}

/** Pushes every vertex along its normal by noise * amp: a cheap way to make organic surfaces irregular. */
export function displace(geo: THREE.BufferGeometry, noise: (x: number, y: number, z: number) => number, amp: number, freq: number) {
  if (!geo.getAttribute("normal")) geo.computeVertexNormals();
  const p = geo.getAttribute("position");
  const n = geo.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    const d = noise(p.getX(i) * freq, p.getY(i) * freq, p.getZ(i) * freq) * amp;
    p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Lofts a closed solid through elliptical cross-sections (each lying in the XZ
 * plane) stacked along the list. Used for torsos, limbs and necks where a
 * circular tube is too limiting. Ends are capped, so the result is watertight.
 */
export function loft(sections: Array<{ c: [number, number, number]; rx: number; rz: number }>, radial = 24) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (const s of sections) {
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      pos.push(s.c[0] + Math.cos(a) * s.rx, s.c[1], s.c[2] + Math.sin(a) * s.rz);
    }
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      // Sections run top to bottom or bottom to top; orientation is fixed below.
      idx.push(a, c, b, b, c, d);
    }
  }
  for (const end of [0, sections.length - 1]) {
    const s = sections[end];
    const ci = pos.length / 3;
    pos.push(s.c[0], s.c[1], s.c[2]);
    for (let j = 0; j < radial; j++) {
      const a = end * radial + j;
      const b = end * radial + ((j + 1) % radial);
      idx.push(ci, b, a);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // Make the winding outward regardless of the order the sections were given in.
  const first = sections[0].c[1];
  const last = sections[sections.length - 1].c[1];
  if (first > last) {
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  return g;
}

/** Per-vertex colour that drifts between two tones with noise (bone mottling, muscle streaks). */
export function paint(
  geo: THREE.BufferGeometry,
  a: string | number,
  b: string | number,
  noise: (x: number, y: number, z: number) => number,
  freq: [number, number, number] = [30, 30, 30],
) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  const p = geo.getAttribute("position");
  const out = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, noise(p.getX(i) * freq[0], p.getY(i) * freq[1], p.getZ(i) * freq[2]) * 0.5 + 0.5));
    c.copy(ca).lerp(cb, t);
    out[i * 3] = c.r;
    out[i * 3 + 1] = c.g;
    out[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(out, 3));
  return geo;
}
