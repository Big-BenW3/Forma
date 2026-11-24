/**
 * Appendicular bones and girdles as distance fields, for the skeleton scene.
 *
 * Every function returns the RIGHT-side bone (+x) in the skeleton's world frame
 * (metres, y up, figure faces +z). `meshBilateral` meshes it once and mirrors the
 * mesh, so both sides cost one meshing pass.
 *
 * Landmark positions (joint centres, epicondyles, malleoli) are the same ones the
 * muscle and ligament layers are built around, so the layers still line up.
 * Joints are left with a hair of clearance so each bone reads as its own piece.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeNoise3 } from "./math";
import { box, capsule, ellipsoid, intersect, meshSDF, path, relief, spline, sphere, subtract, union, type SDF, type Vec3 } from "./sdf";

const noise = makeNoise3(31);
const IVORY = new THREE.Color("#efe6cf");
const IVORY_D = new THREE.Color("#cdbd98");

export const boneColor = (p: Vec3, n: Vec3) => {
  const t = noise(p[0] * 55, p[1] * 55, p[2] * 55) * 0.5 + 0.5;
  const c = IVORY.clone().lerp(IVORY_D, t * 0.75);
  if (n[1] < -0.6) c.multiplyScalar(0.94);
  return c;
};

const rough = (f: SDF, amp = 0.00025) => relief(f, noise, amp, 160);

/** Mirror a geometry across x = 0 (flips winding so normals stay outward). */
export function mirrorGeo(g: THREE.BufferGeometry) {
  const m = g.clone();
  m.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
  const idx = m.getIndex()!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = m.getAttribute("normal");
  if (n) for (let i = 0; i < n.count; i++) n.setX(i, -n.getX(i));
  return m;
}

/** Mesh the right-side bone and add its mirror image. `pad` grows the field's box for the grid. */
export async function meshBilateral(f: SDF, o: { cell: number; tris: number; pad?: number; mirror?: boolean }) {
  if (!f.box) throw new Error("bone field needs a bounding box");
  const pad = (o.pad ?? 0.004) + o.cell * 2;
  const g = await meshSDF(f, {
    min: f.box.min.map((v) => v - pad) as Vec3,
    max: f.box.max.map((v) => v + pad) as Vec3,
    cell: o.cell,
    tris: o.mirror === false ? o.tris : Math.round(o.tris / 2),
    error: 0.012,
    color: boneColor,
  });
  return o.mirror === false ? g : mergeGeometries([g, mirrorGeo(g)])!;
}

// ===================================================================== ARM
export function humerus(): SDF {
  const shaft = path(spline([[0.186, 1.385, -0.002], [0.198, 1.3, 0.004], [0.212, 1.2, 0.001], [0.222, 1.135, 0.002]], 10), (t) => 0.0128 - 0.0026 * Math.sin(Math.PI * t), 0.004);
  const head = sphere([0.177, 1.402, -0.011], 0.0215);
  const greater = ellipsoid([0.199, 1.398, 0.004], [0.011, 0.014, 0.013]);
  const lesser = ellipsoid([0.188, 1.39, 0.018], [0.007, 0.009, 0.006]);
  const deltoidTub = ellipsoid([0.207, 1.3, 0.012], [0.006, 0.02, 0.005]);
  // Distal end: a flattened, wide block with the two epicondyles, then the condyles.
  const distal = ellipsoid([0.219, 1.118, 0.004], [0.022, 0.016, 0.0095]);
  const medEpi = ellipsoid([0.193, 1.115, 0.002], [0.008, 0.009, 0.008]);
  const latEpi = ellipsoid([0.243, 1.116, 0.004], [0.006, 0.009, 0.0075]);
  const trochlea = ellipsoid([0.212, 1.104, 0.006], [0.01, 0.0095, 0.011]);
  const capitulum = sphere([0.235, 1.106, 0.01], 0.0085);
  let h = union(0.006, shaft, head, greater, lesser, deltoidTub, distal, medEpi, latEpi, trochlea, capitulum);
  h = subtract(h, ellipsoid([0.188, 1.4, 0.006], [0.003, 0.012, 0.004]), 0.002); // intertubercular (bicipital) groove
  h = subtract(h, ellipsoid([0.218, 1.126, -0.011], [0.009, 0.011, 0.006]), 0.004); // olecranon fossa
  h = subtract(h, ellipsoid([0.212, 1.1, 0.008], [0.0025, 0.007, 0.008]), 0.002); // trochlear groove
  return rough(h);
}

export function ulna(): SDF {
  const shaft = path(spline([[0.215, 1.105, -0.024], [0.226, 1.03, -0.02], [0.238, 0.94, -0.014], [0.246, 0.872, -0.01]], 10), (t) => 0.0095 - 0.0052 * t, 0.003);
  const olecranon = ellipsoid([0.214, 1.121, -0.026], [0.0105, 0.016, 0.01]);
  const coronoid = ellipsoid([0.217, 1.098, -0.008], [0.008, 0.006, 0.008]);
  const head = sphere([0.247, 0.868, -0.01], 0.0062);
  const styloid = capsule([0.246, 0.866, -0.013], [0.246, 0.856, -0.014], 0.0028, 0.0015);
  let u = union(0.005, shaft, olecranon, coronoid, head, styloid);
  u = subtract(u, sphere([0.214, 1.106, -0.006], 0.0108), 0.002); // trochlear notch, cups the humerus
  return rough(u);
}

export function radius(): SDF {
  const head = union(0.002, capsule([0.238, 1.1, 0.01], [0.238, 1.092, 0.01], 0.0092));
  const neck = capsule([0.238, 1.092, 0.01], [0.24, 1.075, 0.011], 0.0055);
  const tub = ellipsoid([0.239, 1.068, 0.016], [0.004, 0.007, 0.004]);
  const shaft = path(spline([[0.24, 1.075, 0.011], [0.247, 1.02, 0.014], [0.256, 0.94, 0.014], [0.262, 0.884, 0.012]], 10), (t) => 0.0062 + 0.004 * t * t, 0.003);
  const distal = ellipsoid([0.263, 0.872, 0.012], [0.0135, 0.009, 0.009]);
  const styloid = capsule([0.273, 0.872, 0.012], [0.276, 0.861, 0.012], 0.003, 0.0015);
  let r = union(0.004, head, neck, tub, shaft, distal, styloid);
  r = subtract(r, sphere([0.238, 1.11, 0.01], 0.0085), 0.001); // fovea on the head, against the capitulum
  return rough(r);
}

export function clavicle(): SDF {
  const pts = spline([[0.02, 1.462, 0.014], [0.06, 1.465, 0.03], [0.11, 1.46, 0.016], [0.15, 1.454, -0.016], [0.185, 1.45, -0.03]], 18);
  const c = path(pts, (t) => 0.0068 - 0.0022 * Math.sin(Math.PI * t), 0.003);
  const sternalEnd = ellipsoid([0.022, 1.461, 0.013], [0.009, 0.01, 0.009]);
  const acromialEnd = ellipsoid([0.18, 1.451, -0.028], [0.012, 0.005, 0.01], [0, 0.5, 0]);
  return rough(union(0.005, c, sternalEnd, acromialEnd));
}

/** A thick triangular plate through A, B, C with rounded edges. */
function triPlate(A: Vec3, B: Vec3, C: Vec3, t: number, bow = 0): SDF {
  const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), c = new THREE.Vector3(...C);
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  const edges = [[a, b], [b, c], [c, a]] as const;
  const inward = edges.map(([p, q]) => {
    const e = new THREE.Vector3().subVectors(q, p);
    const inn = new THREE.Vector3().crossVectors(n, e).normalize();
    const third = [a, b, c].find((v) => v !== p && v !== q)!;
    if (inn.dot(new THREE.Vector3().subVectors(third, p)) < 0) inn.negate();
    return { p, inn };
  });
  const cen = a.clone().add(b).add(c).divideScalar(3);
  const R = Math.max(a.distanceTo(cen), b.distanceTo(cen), c.distanceTo(cen)) + t + Math.abs(bow);
  const v = new THREE.Vector3();
  const f: SDF = (x, y, z) => {
    v.set(x, y, z);
    let de = -Infinity;
    for (const { p, inn } of inward) de = Math.max(de, -inn.dot(v.clone().sub(p)));
    // bowed plate: offset the mid-plane by a bump that is largest at the centroid
    const dc = Math.min(1, v.distanceTo(cen) / R);
    const dp = Math.abs(n.dot(v.clone().sub(a)) - bow * (1 - dc * dc)) - t;
    return Math.max(dp, de);
  };
  f.box = { min: [cen.x - R, cen.y - R, cen.z - R], max: [cen.x + R, cen.y + R, cen.z + R] };
  return f;
}

export function scapula(): SDF {
  const sup: Vec3 = [0.082, 1.432, -0.108], inf: Vec3 = [0.108, 1.262, -0.115], lat: Vec3 = [0.166, 1.385, -0.052];
  const supLat: Vec3 = [0.155, 1.422, -0.062];
  const blade = union(0.002, triPlate(sup, inf, lat, 0.0024, 0), triPlate(sup, lat, supLat, 0.0024, 0));
  const borders = union(
    0.003,
    path([sup, inf], 0.0026), // medial border
    path([inf, [0.15, 1.36, -0.07], lat], 0.0042), // lateral border, the thick one
    path([sup, [0.12, 1.428, -0.083], supLat], 0.0022), // superior border
  );
  const spine = path(spline([[0.086, 1.392, -0.114], [0.13, 1.41, -0.088], [0.165, 1.432, -0.068], [0.186, 1.452, -0.042]], 12), (t) => 0.003 + 0.004 * Math.sin(Math.PI * t * 0.8), 0.003);
  const acromion = ellipsoid([0.188, 1.454, -0.026], [0.017, 0.0045, 0.015], [0, 0.4, 0.05]);
  const coracoid = path(spline([[0.166, 1.42, -0.046], [0.172, 1.43, -0.02], [0.18, 1.426, 0.004]], 8), (t) => 0.0045 - 0.0015 * t, 0.002);
  const glenoidNeck = ellipsoid([0.168, 1.392, -0.035], [0.008, 0.017, 0.012]);
  let s = union(0.006, blade, borders, spine, acromion, coracoid, glenoidNeck);
  s = subtract(s, ellipsoid([0.181, 1.396, -0.026], [0.006, 0.017, 0.012], [0, 0.6, 0]), 0.003); // glenoid cavity
  return rough(s, 0.0002);
}

// ===================================================================== HAND
/** One phalanx or metacarpal: wide base, waisted shaft, rounded head. */
function longSmall(a: THREE.Vector3, b: THREE.Vector3, r: number, o: { tuft?: boolean } = {}): SDF {
  const A: Vec3 = [a.x, a.y, a.z], Bp: Vec3 = [b.x, b.y, b.z];
  const mid: Vec3 = [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2];
  const parts = [capsule(A, mid, r * 1.22, r * 0.78), capsule(mid, Bp, r * 0.78, o.tuft ? r * 0.55 : r * 1.0)];
  if (!o.tuft) parts.push(sphere(Bp, r * 1.08)); // the rounded head (a knuckle)
  if (o.tuft) parts.push(ellipsoid(Bp, [r * 0.9, r * 0.6, r * 0.7]));
  return union(0.0012, ...parts);
}


export function carpals(): SDF {
  // Proximal row (lateral to medial): scaphoid, lunate, triquetrum, pisiform; distal: trapezium, trapezoid, capitate, hamate.
  const y1 = 0.849, y2 = 0.834, z = 0.009;
  const c: SDF[] = [
    ellipsoid([0.27, y1, z + 0.001], [0.0062, 0.0045, 0.0052], [0, 0, -0.5]),
    ellipsoid([0.259, y1 + 0.001, z], [0.0052, 0.0048, 0.0058]),
    ellipsoid([0.249, y1 - 0.001, z - 0.001], [0.0046, 0.0045, 0.005]),
    sphere([0.244, y1 - 0.002, z + 0.0065], 0.0035),
    ellipsoid([0.276, y2 - 0.001, z + 0.002], [0.0052, 0.0048, 0.0052]),
    ellipsoid([0.267, y2, z + 0.001], [0.0042, 0.0045, 0.0048]),
    ellipsoid([0.2575, y2, z], [0.0048, 0.0065, 0.0058]),
    ellipsoid([0.247, y2, z], [0.0052, 0.0058, 0.0055]),
  ];
  // Hook of the hamate
  c.push(capsule([0.246, y2, z + 0.004], [0.245, y2 - 0.002, z + 0.009], 0.0018));
  return rough(union(0.0003, ...c), 0.00015);
}

/** Bones of the right hand from base to tip, per ray. Ray 1 is the thumb (lateral, +x). */
function handRays() {
  const rays: Array<{ meta: [THREE.Vector3, THREE.Vector3]; phal: Array<[THREE.Vector3, THREE.Vector3]> ; r: number }> = [];
  const bases = [
    new THREE.Vector3(0.279, 0.829, 0.013),
    new THREE.Vector3(0.268, 0.826, 0.01),
    new THREE.Vector3(0.258, 0.826, 0.009),
    new THREE.Vector3(0.249, 0.827, 0.008),
    new THREE.Vector3(0.241, 0.829, 0.008),
  ];
  const metaLen = [0.043, 0.064, 0.061, 0.056, 0.051];
  const phLen = [[0.031, 0.023], [0.04, 0.024, 0.017], [0.045, 0.028, 0.018], [0.042, 0.026, 0.017], [0.033, 0.019, 0.016]];
  const radius = [0.0048, 0.0042, 0.0043, 0.0039, 0.0035];
  for (let k = 0; k < 5; k++) {
    const spread = (bases[k].x - 0.258) * 1.6;
    const dir = k === 0 ? new THREE.Vector3(0.28, -0.9, 0.32).normalize() : new THREE.Vector3(spread, -1, 0.06).normalize();
    const gap = 0.0016;
    let p = bases[k].clone();
    const end = p.clone().addScaledVector(dir, metaLen[k]);
    const meta: [THREE.Vector3, THREE.Vector3] = [p.clone(), end.clone()];
    p = end.clone().addScaledVector(dir, gap);
    const phal: Array<[THREE.Vector3, THREE.Vector3]> = [];
    // fingers curl very slightly forward, as in a relaxed hand
    let d = dir.clone();
    for (const l of phLen[k]) {
      d = d.clone().add(new THREE.Vector3(0, 0, 0.08)).normalize();
      const q = p.clone().addScaledVector(d, l);
      phal.push([p.clone(), q.clone()]);
      p = q.clone().addScaledVector(d, gap);
    }
    rays.push({ meta, phal, r: radius[k] });
  }
  return rays;
}

export function metacarpals(): SDF {
  return rough(union(0.0004, ...handRays().map((r) => longSmall(r.meta[0], r.meta[1], r.r))), 0.00012);
}

export function handPhalanges(): SDF {
  const parts: SDF[] = [];
  for (const r of handRays()) r.phal.forEach(([a, b], i) => parts.push(longSmall(a, b, r.r * (1 - 0.14 * i), { tuft: i === r.phal.length - 1 })));
  return rough(union(0.0003, ...parts), 0.0001);
}

// ===================================================================== HIP AND LEG
export const HIP_C: Vec3 = [0.088, 0.915, 0.012];

export function hipBone(): SDF {
  // Ilium: a curved fan cut from the wall of a bowl that opens forward and up.
  const C0: Vec3 = [0.03, 0.955, -0.005];
  const bowl = ellipsoid(C0, [0.112, 0.088, 0.1]);
  const wallT = 0.0032;
  const wall: SDF = (x, y, z) => Math.abs(bowl(x, y, z)) - wallT;
  wall.box = { min: [0.0, 0.9, -0.11], max: [0.15, 1.05, 0.1] };
  // Angle around the bowl seen from above: 0 = straight lateral, + toward the front.
  const ang = (x: number, z: number) => Math.atan2(z - C0[2], x - C0[0]);
  const A0 = -1.95, A1 = 0.72; // posterior (sacroiliac) end ... anterior (ASIS) end
  const crestY = (a: number) => 0.992 + 0.03 * Math.sin(((a - A0) / (A1 - A0)) * Math.PI * 0.95);
  const region: SDF = (x, y, z) => {
    const a = ang(x, z);
    const da = Math.max(A0 - a, a - A1) * 0.09; // angular cut, in rough metres
    return Math.max(y - crestY(a), 0.915 - y, da);
  };
  const ilium = intersect(wall, region, 0.003);
  ilium.box = wall.box;
  const crestPts: Vec3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = A1 - ((A1 - A0) * i) / 16;
    const y = crestY(a) - 0.002;
    // walk outward along the angle until we reach the bowl wall
    let r = 0.0;
    while (bowl(C0[0] + Math.cos(a) * r, y, C0[2] + Math.sin(a) * r) < 0 && r < 0.2) r += 0.0005;
    crestPts.push([C0[0] + Math.cos(a) * r, y, C0[2] + Math.sin(a) * r]);
  }
  const crest = path(crestPts, (t) => 0.0042 + 0.0016 * Math.sin(Math.PI * t), 0.003);
  const asis = sphere([crestPts[0][0], crestPts[0][1] - 0.004, crestPts[0][2]], 0.0065);
  const psis = sphere([crestPts[16][0], crestPts[16][1] - 0.008, crestPts[16][2]], 0.0065);
  // Body around the hip socket, the pubis and the ischium.
  const acetBody = sphere([0.105, 0.915, 0.012], 0.033);
  const supRamus = path([[0.1, 0.892, 0.034], [0.06, 0.88, 0.062], [0.014, 0.868, 0.076]], 0.0072, 0.003);
  const infRamus = path([[0.014, 0.862, 0.074], [0.03, 0.836, 0.046], [0.06, 0.82, -0.008]], 0.0062, 0.003);
  const ischium = path([[0.1, 0.89, -0.01], [0.083, 0.847, -0.022], [0.068, 0.824, -0.024]], 0.0092, 0.003);
  const tuber = ellipsoid([0.066, 0.82, -0.025], [0.012, 0.011, 0.014]);
  const ischSpine = capsule([0.085, 0.9, -0.028], [0.072, 0.895, -0.042], 0.004, 0.0015);
  const symph = box([0.008, 0.865, 0.077], [0.008, 0.011, 0.006], 0.004);
  // Joins the ilium to the acetabular body behind (greater sciatic notch is the gap below it).
  const iliumNeck = union(0.006, path([[0.112, 0.95, 0.03], [0.108, 0.925, 0.014]], 0.011), path([[0.07, 0.93, -0.06], [0.095, 0.915, -0.01]], 0.01)); // body of the ilium above the socket and the sciatic buttress
  let h = union(0.008, ilium, crest, asis, psis, acetBody, supRamus, infRamus, ischium, tuber, ischSpine, symph, iliumNeck);
  // Acetabulum: the deep cup for the femoral head, open laterally.
  h = subtract(h, sphere([0.118, 0.917, 0.012], 0.027), 0.002);
  // Obturator foramen: the large hole ringed by the pubis and ischium.
  h = subtract(h, ellipsoid([0.058, 0.853, 0.03], [0.022, 0.019, 0.03], [0.5, 0.0, 0.0]), 0.004);
  return rough(h, 0.0003);
}

export function sacrum(): SDF {
  // A curved, tapering wedge of five fused vertebrae.
  const axis: Vec3[] = spline([[0, 0.952, -0.014], [0, 0.905, -0.03], [0, 0.858, -0.05], [0, 0.812, -0.068]], 12);
  const parts: SDF[] = [];
  axis.forEach((p, i) => {
    const t = i / (axis.length - 1);
    parts.push(ellipsoid(p, [0.047 * (1 - t * 0.75), 0.012, 0.014 * (1 - 0.4 * t)]));
  });
  const alae = [ellipsoid([0.035, 0.945, -0.022], [0.024, 0.012, 0.022])];
  const crest = path(axis.map((p) => [0, p[1], p[2] - 0.014] as Vec3), 0.003, 0.002);
  let s = union(0.014, ...parts, ...alae, crest);
  // Four pairs of anterior sacral foramina
  for (let k = 0; k < 4; k++) {
    const p = axis[2 + k * 2];
    s = subtract(s, ellipsoid([0.014 * (1 - k * 0.12), p[1], p[2] + 0.012], [0.0032, 0.0032, 0.012]), 0.001);
    s = subtract(s, ellipsoid([-0.014 * (1 - k * 0.12), p[1], p[2] + 0.012], [0.0032, 0.0032, 0.012]), 0.001);
  }
  return rough(s, 0.0002);
}

export function coccyx(): SDF {
  const segs: SDF[] = [];
  const pts: Vec3[] = [[0, 0.804, -0.071], [0, 0.791, -0.077], [0, 0.78, -0.08], [0, 0.771, -0.08]];
  pts.forEach((p, i) => segs.push(ellipsoid(p, [0.0085 - i * 0.0016, 0.0048, 0.0055 - i * 0.0007])));
  return union(0.0008, ...segs);
}

export function femur(): SDF {
  const shaft = path(spline([[0.117, 0.872, -0.004], [0.11, 0.76, 0.01], [0.1, 0.62, 0.012], [0.093, 0.54, 0.002]], 12), (t) => 0.0145 - 0.002 * Math.sin(Math.PI * t), 0.006);
  const neck = capsule([0.12, 0.876, -0.002], [0.095, 0.906, 0.009], 0.012, 0.0115);
  const head = sphere([HIP_C[0], HIP_C[1] + 0.003, HIP_C[2]], 0.0235);
  const greater = ellipsoid([0.136, 0.892, -0.008], [0.015, 0.023, 0.019]);
  const lesser = ellipsoid([0.106, 0.833, -0.016], [0.0065, 0.0075, 0.0065]);
  const linea = path([[0.112, 0.8, -0.012], [0.104, 0.68, -0.006], [0.098, 0.58, -0.01]], 0.0045, 0.003); // linea aspera
  const distal = ellipsoid([0.093, 0.525, -0.002], [0.027, 0.02, 0.019]);
  const medCond = ellipsoid([0.074, 0.508, -0.006], [0.0138, 0.021, 0.024]);
  const latCond = ellipsoid([0.111, 0.508, -0.006], [0.0135, 0.021, 0.024]);
  let f = union(0.009, shaft, neck, head, greater, lesser, linea, distal, medCond, latCond);
  f = subtract(f, ellipsoid([0.0925, 0.505, -0.022], [0.0075, 0.02, 0.016]), 0.004); // intercondylar notch
  f = subtract(f, ellipsoid([0.0925, 0.522, 0.03], [0.008, 0.02, 0.006]), 0.004); // patellar groove
  f = subtract(f, sphere([HIP_C[0] - 0.02, HIP_C[1] + 0.003, HIP_C[2]], 0.003), 0.001); // fovea capitis
  return rough(f);
}

export function patella(): SDF {
  const p = union(0.004, ellipsoid([0.092, 0.516, 0.043], [0.0195, 0.019, 0.008]), ellipsoid([0.092, 0.5, 0.044], [0.011, 0.012, 0.0065]));
  return rough(subtract(p, ellipsoid([0.092, 0.512, 0.032], [0.016, 0.02, 0.004]), 0.004));
}

export function tibia(): SDF {
  const plateau = ellipsoid([0.092, 0.482, -0.002], [0.034, 0.011, 0.027]);
  const medCond = ellipsoid([0.075, 0.476, -0.003], [0.017, 0.014, 0.022]);
  const latCond = ellipsoid([0.11, 0.476, -0.005], [0.016, 0.014, 0.02]);
  const tub = ellipsoid([0.093, 0.458, 0.025], [0.007, 0.011, 0.006]);
  const shaft = path(spline([[0.092, 0.46, 0.0], [0.09, 0.32, 0.004], [0.087, 0.16, 0.001], [0.082, 0.098, 0.0]], 12), (t) => 0.0175 - 0.006 * Math.sin(Math.PI * Math.min(1, t * 1.1)), 0.006);
  const crest = path([[0.093, 0.445, 0.017], [0.09, 0.3, 0.016], [0.086, 0.15, 0.011]], 0.0035, 0.004);
  const distal = ellipsoid([0.081, 0.085, 0.001], [0.019, 0.014, 0.018]);
  const malleolus = ellipsoid([0.064, 0.074, 0.002], [0.007, 0.015, 0.011]);
  let t = union(0.008, plateau, medCond, latCond, tub, shaft, crest, distal, malleolus);
  // Shallow cups on the plateau for the femoral condyles
  t = subtract(t, ellipsoid([0.074, 0.497, -0.004], [0.013, 0.008, 0.018]), 0.003);
  t = subtract(t, ellipsoid([0.111, 0.497, -0.004], [0.012, 0.008, 0.016]), 0.003);
  return rough(t);
}

export function fibula(): SDF {
  const head = ellipsoid([0.126, 0.466, -0.013], [0.009, 0.01, 0.009]);
  const shaft = path(spline([[0.125, 0.455, -0.012], [0.118, 0.3, -0.012], [0.112, 0.15, -0.008], [0.108, 0.085, -0.006]], 10), (t) => 0.0057 - 0.001 * Math.sin(Math.PI * t), 0.003);
  const malleolus = ellipsoid([0.108, 0.068, -0.006], [0.008, 0.018, 0.011]);
  return rough(union(0.005, head, shaft, malleolus));
}

// ===================================================================== FOOT
export function tarsals(): SDF {
  const t: SDF[] = [];
  // Calcaneus: the heel bone, long and blocky with the tuberosity behind
  t.push(union(0.008, ellipsoid([0.09, 0.034, -0.035], [0.017, 0.019, 0.034]), ellipsoid([0.09, 0.03, -0.065], [0.016, 0.02, 0.014]), ellipsoid([0.1, 0.034, 0.0], [0.013, 0.013, 0.012])));
  // Talus: domed top (the trochlea) that sits in the ankle mortise
  t.push(union(0.006, ellipsoid([0.088, 0.064, -0.006], [0.017, 0.012, 0.022]), ellipsoid([0.084, 0.058, 0.02], [0.011, 0.009, 0.011])));
  // Navicular (medial), cuboid (lateral), three cuneiforms
  t.push(ellipsoid([0.078, 0.05, 0.036], [0.013, 0.01, 0.0065], [0, 0.3, 0.2]));
  t.push(box([0.109, 0.028, 0.034], [0.0095, 0.009, 0.012], 0.003, [0, -0.15, 0]));
  t.push(box([0.071, 0.037, 0.05], [0.0062, 0.011, 0.0085], 0.0025));
  t.push(box([0.083, 0.04, 0.049], [0.0052, 0.009, 0.007], 0.0022));
  t.push(box([0.094, 0.037, 0.05], [0.0056, 0.009, 0.0085], 0.0022));
  return rough(union(0.0006, ...t), 0.0002);
}

function footRays() {
  const rays: Array<{ meta: [THREE.Vector3, THREE.Vector3]; phal: Array<[THREE.Vector3, THREE.Vector3]>; r: number }> = [];
  const bases = [
    new THREE.Vector3(0.071, 0.034, 0.061),
    new THREE.Vector3(0.083, 0.036, 0.058),
    new THREE.Vector3(0.094, 0.033, 0.06),
    new THREE.Vector3(0.105, 0.028, 0.048),
    new THREE.Vector3(0.115, 0.022, 0.044),
  ];
  const tips = [new THREE.Vector3(0.069, 0.016, 0.118), new THREE.Vector3(0.083, 0.014, 0.12), new THREE.Vector3(0.096, 0.013, 0.115), new THREE.Vector3(0.108, 0.012, 0.108), new THREE.Vector3(0.12, 0.012, 0.1)];
  const phLen = [[0.03, 0.024], [0.022, 0.012, 0.01], [0.02, 0.011, 0.009], [0.018, 0.01, 0.008], [0.015, 0.008, 0.007]];
  const r = [0.0075, 0.0047, 0.0045, 0.0044, 0.0044];
  for (let k = 0; k < 5; k++) {
    const meta: [THREE.Vector3, THREE.Vector3] = [bases[k], tips[k]];
    const dir = new THREE.Vector3(0, -0.12, 1).normalize();
    let p = tips[k].clone().addScaledVector(dir, 0.0016);
    const phal: Array<[THREE.Vector3, THREE.Vector3]> = [];
    let d = dir.clone();
    for (const l of phLen[k]) {
      const q = p.clone().addScaledVector(d, l);
      phal.push([p.clone(), q.clone()]);
      p = q.clone().addScaledVector(d, 0.0014);
      d = d.clone().add(new THREE.Vector3(0, -0.15, 0)).normalize();
    }
    rays.push({ meta, phal, r: r[k] });
  }
  return rays;
}

export function metatarsals(): SDF {
  return rough(union(0.0004, ...footRays().map((r) => longSmall(r.meta[0], r.meta[1], r.r))), 0.00015);
}

export function footPhalanges(): SDF {
  const parts: SDF[] = [];
  for (const r of footRays()) r.phal.forEach(([a, b], i) => parts.push(longSmall(a, b, r.r * (1 - 0.12 * i), { tuft: i === r.phal.length - 1 })));
  return rough(union(0.0003, ...parts), 0.0001);
}

// ===================================================================== THORAX
export function sternum(z: number): SDF {
  // Manubrium: a broad, short shield; body: a narrower blade that is a little wider at the bottom than the top.
  const manubrium = box([0, 1.438, z - 0.003], [0.031, 0.02, 0.0058], 0.0085, [-0.12, 0, 0]);
  const seg = (y: number, hx: number, zz: number) => box([0, y, z + zz], [hx, 0.0265, 0.0048], 0.0045, [-0.06, 0, 0]);
  const body = union(0.008, seg(1.384, 0.0125, 0.002), seg(1.345, 0.0142, 0.004), seg(1.31, 0.0158, 0.006));
  const xiphoid = ellipsoid([0, 1.276, z + 0.008], [0.007, 0.016, 0.0035]);
  let s = union(0.006, manubrium, body, xiphoid);
  s = subtract(s, ellipsoid([0, 1.462, z - 0.004], [0.008, 0.005, 0.01]), 0.003); // jugular notch
  return rough(s, 0.0002);
}
