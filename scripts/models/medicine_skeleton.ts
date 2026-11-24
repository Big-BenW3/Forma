/**
 * Scene: medicine_skeleton  (Medicine & Surgery, lesson 2)
 *
 * A standing adult built in four peelable layers, outermost first:
 *   skin (glass) -> muscle -> connective tissue -> bone
 *
 * Interactive parts: the three tissue layers and 15 bones. Bones that exist as
 * a left/right pair are ONE part (one id, both sides), so selecting a femur
 * highlights both and the card describes "the femur", which is how anatomy is
 * taught. Hands and feet are present as non-interactive detail.
 *
 * SCALE AND COORDINATES: 1 unit = 1 metre. Y up, the figure faces +Z, feet on
 * y = 0, height 1.78 m. Everything is authored for the +X side and mirrored.
 *
 * FIDELITY: proportions follow standard anatomical landmarks (joint heights,
 * spine curvature, rib count and sizing, vertebra types) so the structures read
 * correctly and sit where they should relative to each other. The surfaces are
 * stylised procedural forms, not scans: a student can learn names, positions
 * and relationships here, not surface micro-detail.
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { displace, ellipsoid, group, lathe, mat, merge, mesh, mirrorX, paint, roundedBox, tint, tube, V, xf } from "./lib/geo";
import { makeNoise3 } from "./lib/math";
import { buildSkull } from "./lib/skull";
import * as bones from "./lib/bones";
import { meshBilateral } from "./lib/bones";
import * as sdf from "./lib/sdf";

const noise = makeNoise3(21);
const P = (x: number, y: number, z: number) => V(x, y, z);

// ------------------------------------------------------------------ palette
const BONE_A = "#efe7d3";
const BONE_B = "#cfc2a2";
const CARTILAGE = "#9fc2d4";
const LIGAMENT = "#e6e2d3";
const TENDON = "#f3efe4"; // pearly white, a shade brighter than ligament
const MUSCLE_A = "#b3443b";
const MUSCLE_B = "#8f2f2b";
const SKIN = "#e2b79d";

// --------------------------------------------------------------- generic bits
/** Adds a bilateral partner: the +X geometry plus its mirror image. */
const both = (g: THREE.BufferGeometry[]) => [...g, ...g.map(mirrorX)];

/** Bone surface: mottled ivory with a little relief. */
function bone(g: THREE.BufferGeometry, amp = 0.0008) {
  displace(g, noise, amp, 55);
  return paint(g, BONE_A, BONE_B, noise, [38, 38, 38]);
}

/** A rounded knob (condyle, tubercle, epicondyle), as bone. */
function knob(x: number, y: number, z: number, rx: number, ry = rx, rz = rx, w = 14, h = 9) {
  return bone(xf(ellipsoid(rx, ry, rz, w, h), { p: [x, y, z] }), 0.0005);
}

// ------------------------------------------------------------- spine geometry
// Antero-posterior position (z) of the vertebral bodies versus height: cervical
// lordosis, thoracic kyphosis, lumbar lordosis.
const SPINE_CURVE: Array<[number, number]> = [
  [1.56, -0.004], [1.5, -0.018], [1.44, -0.036], [1.36, -0.062], [1.28, -0.072],
  [1.2, -0.062], [1.12, -0.04], [1.05, -0.018], [0.98, -0.008], [0.945, -0.012],
];
function spineZ(y: number) {
  for (let i = 0; i < SPINE_CURVE.length - 1; i++) {
    const [y0, z0] = SPINE_CURVE[i];
    const [y1, z1] = SPINE_CURVE[i + 1];
    if (y <= y0 && y >= y1) {
      const t = (y0 - y) / (y0 - y1);
      return z0 + (z1 - z0) * (t * t * (3 - 2 * t));
    }
  }
  return SPINE_CURVE[SPINE_CURVE.length - 1][1];
}

// Vertebra centre heights: 7 cervical, 12 thoracic, 5 lumbar (top to bottom).
const CERV_Y = Array.from({ length: 7 }, (_, i) => 1.559 - i * 0.0165);
const THOR_Y = Array.from({ length: 12 }, (_, i) => 1.435 - i * 0.0275);
const LUMB_Y = Array.from({ length: 5 }, (_, i) => 1.095 - i * 0.034);

interface Vert {
  kind: "C" | "T" | "L";
  n: number;
  y: number;
  w: number; // body half-width
  d: number; // body half-depth
  h: number; // body height
}
const VERTS: Vert[] = [
  ...CERV_Y.map((y, i): Vert => ({ kind: "C", n: i + 1, y, w: 0.0125 + 0.0008 * i, d: 0.0105 + 0.0005 * i, h: 0.012 + 0.0005 * i })),
  ...THOR_Y.map((y, i): Vert => ({ kind: "T", n: i + 1, y, w: 0.0155 + 0.0011 * i, d: 0.0135 + 0.0006 * i, h: 0.0185 + 0.0006 * i })),
  ...LUMB_Y.map((y, i): Vert => ({ kind: "L", n: i + 1, y, w: 0.026 + 0.0012 * i, d: 0.0195 + 0.0005 * i, h: 0.027 + 0.0007 * i })),
];

/** One vertebra: body, pedicles, neural-arch ring, transverse and spinous processes. */
function vertebra(v: Vert) {
  const z = spineZ(v.y);
  const out: THREE.BufferGeometry[] = [];
  const atlas = v.kind === "C" && v.n === 1;

  // Body: a squashed cylinder with a slight waist, absent on the atlas (C1).
  if (!atlas) {
    const h2 = v.h / 2;
    const prof: Array<[number, number]> = [[0, -h2], [0.78, -h2], [0.96, -h2 + 0.18 * v.h], [0.9, 0], [0.96, h2 - 0.18 * v.h], [0.78, h2], [0, h2]];
    const body = lathe(prof, 16);
    // The lathe profile has unit radius, so scale to the half-width (x) and half-depth (z).
    body.scale(v.w, 1, v.d);
    xf(body, { p: [0, v.y, z] });
    out.push(bone(body, 0.0004));
  } else {
    // Atlas: anterior arch only
    out.push(bone(tube([P(-0.012, v.y, z + 0.008), P(0, v.y, z + 0.012), P(0.012, v.y, z + 0.008)], 0.0035, { radial: 8, segments: 8 }), 0.0002));
  }

  // Neural arch: a ring behind the body, around the spinal canal.
  const rc = v.kind === "C" ? 0.0105 : v.kind === "T" ? 0.0095 : 0.0125;
  const zr = z - v.d - rc * 0.55;
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ring.push(P(Math.cos(a) * rc * (atlas ? 1.5 : 1), v.y, zr + Math.sin(a) * rc * 0.9));
  }
  out.push(bone(tube(ring, 0.0032, { closedCurve: true, radial: 6, segments: 14 }), 0.0002));

  if (!atlas) {
    // Pedicles join the body to the arch on each side
    for (const s of [-1, 1]) out.push(bone(tube([P(s * v.w * 0.7, v.y, z - v.d * 0.7), P(s * rc * 0.95, v.y, zr + rc * 0.4)], 0.0033, { radial: 5, segments: 2 }), 0.0001));
  }

  // Transverse processes
  const tl = v.kind === "C" ? 0.017 : v.kind === "T" ? 0.027 : 0.034;
  for (const s of [-1, 1]) out.push(bone(tube([P(s * rc, v.y, zr), P(s * (rc + tl * 0.6), v.y + (v.kind === "T" ? 0.002 : 0), zr - 0.003), P(s * (rc + tl), v.y, zr - 0.005)], 0.0034, { radial: 5, segments: 3 }), 0.0001));

  // Spinous process: long and downward in the thorax, blunt in the lumbar spine
  const sl = v.kind === "C" ? 0.014 : v.kind === "T" ? 0.034 : 0.022;
  const drop = v.kind === "T" ? 0.8 : v.kind === "C" ? 0.2 : 0.05;
  out.push(bone(tube([P(0, v.y, zr - rc * 0.8), P(0, v.y - sl * drop * 0.5, zr - rc * 0.8 - sl * 0.55), P(0, v.y - sl * drop, zr - rc * 0.8 - sl)], (t: number) => 0.0046 - 0.0016 * t, { radial: 5, segments: 3 }), 0.0001));

  // Axis (C2): the dens, a small peg that rises into the atlas ring
  if (v.kind === "C" && v.n === 2) out.push(bone(tube([P(0, v.y + 0.004, z), P(0, v.y + 0.017, z + 0.002)], (t) => 0.0055 * (1 - 0.35 * t), { radial: 8, segments: 4 }), 0.0001));

  // Articular facets: tiny knobs where neighbours meet
  for (const s of [-1, 1]) out.push(knob(s * (rc + 0.003), v.y + v.h * 0.55, zr + 0.002, 0.0038, 0.0045, 0.0038, 6, 4));
  return out;
}

// --------------------------------------------------------------------- ribs
const RIB_A = [0.05, 0.078, 0.098, 0.111, 0.12, 0.127, 0.13, 0.13, 0.126, 0.118, 0.104, 0.088];
const RIB_B = [0.072, 0.092, 0.112, 0.124, 0.133, 0.141, 0.146, 0.147, 0.142, 0.13, 0.11, 0.088];
const STERNUM_Y = [1.448, 1.425, 1.396, 1.366, 1.336, 1.306, 1.277]; // where ribs 1-7 meet the sternum
const STERNUM_Z = 0.082;

function rib(i: number) {
  const yT = THOR_Y[i];
  const zV = spineZ(yT) - THOR_Y.length * 0; // body centre of the vertebra it articulates with
  const zb = zV - VERTS[7 + i].d; // back of the body
  const a = RIB_A[i];
  const b = RIB_B[i];
  const drop = 0.045 + 0.0115 * (i + 1) * (i < 10 ? 1 : 0.6);
  const pts = [
    P(0.012, yT + 0.002, zb + 0.004), // head, at the body
    P(0.03, yT + 0.006, zb - 0.014), // neck/tubercle, at the transverse process
    P(0.055 + a * 0.2, yT - 0.006, zb - 0.012 - 0.004 * i * 0.2), // angle
    P(a * 0.97, yT - drop * 0.3, zb + b * 0.32),
    P(a * 0.84, yT - drop * 0.66, zb + b * 0.7),
    P(a * 0.52, yT - drop * 0.94, zb + b * 0.93),
  ];
  const end = pts[pts.length - 1];
  const r = 0.0042 + (i < 8 ? 0.0004 : 0);
  // A rib is a flat band (about 3x wider than thick), wide up-and-down; floating ribs 11-12 are narrower.
  const flat = { dir: [0, 1, 0] as [number, number, number], wide: i < 10 ? 1.75 : 1.3, thin: 0.7 };
  const bonePart = bone(tube(i >= 10 ? pts.slice(0, 5) : pts, (t) => r * (1.05 - 0.2 * t), { radial: 7, segments: 28, flat }), 0.0003);
  // Costal cartilage: ribs 1-7 reach the sternum; 8-10 join the rib above (the costal margin)
  let cart: THREE.BufferGeometry | null = null;
  if (i < 7) {
    const s = P(0.016, STERNUM_Y[i], STERNUM_Z);
    cart = tube([end, end.clone().lerp(s, 0.5).add(P(0, 0.012 * (i + 1) * 0.35, 0.004)), s], 0.0046, { radial: 7, segments: 10, flat: { dir: [0, 1, 0], wide: 1.5, thin: 0.8 } });
  } else if (i < 10) {
    const up = P(a * 0.42 - 0.03 * (i - 7), end.y + 0.035 + 0.003 * i, end.z + 0.002);
    cart = tube([end, up], 0.0042, { radial: 7, segments: 6, flat: { dir: [0, 0, 1], wide: 1.5, thin: 0.8 } });
  }
  return { bonePart, cart };
}

// ------------------------------------------------------------------- skull
// The braincase and face are ONE lofted form (cross-sections from the crown down
// to the upper jaw), so the forehead, temples, cheeks and maxilla flow together
// as they do on a real skull instead of reading as separate blobs. Features
// (orbits, nose, teeth, sutures) are then placed ON that surface.
export async function buildSkeleton() {
  const B = new SceneBuild({ sceneId: "medicine_skeleton", view: [0.2, 0.12, 1], fit: 4.7, partFitScale: 1.9, fov: 30 });
  B.group("tissue", "Tissue layers", "#d98b6a");
  B.group("connective", "Connective tissue", "#5f9db8");
  B.group("skull", "Skull", "#c4574a");
  B.group("axial", "Spine and thorax", "#6d63c9");
  B.group("upper", "Upper limb", "#2f8d80");
  B.group("lower", "Lower limb", "#d9a22e");
  // Outermost first. Skin is glass, so it does not hide what is behind it; muscle does.
  B.layer("skin", "Skin", false);
  B.layer("muscle", "Muscle", true);
  B.layer("connective", "Connective tissue", false);
  B.layer("bone", "Bone", false);

  const boneMat = mat({ color: "#ffffff", rough: 0.62 });
  const boneMatDouble = mat({ color: "#ffffff", rough: 0.62, double: true });
  const glossyMat = mat({ color: "#ffffff", rough: 0.32 });
  const addBone = (g: THREE.BufferGeometry, id: string, name: string, group: string, o: { anchor: [number, number, number]; view?: [number, number, number]; fit?: number; double?: boolean; raw?: boolean; glossy?: boolean }) =>
    B.root.add(
      B.part(group_(mesh(g, o.glossy ? glossyMat : o.double ? boneMatDouble : boneMat, id + "_geo")), {
        id, name, group, layer: "bone", anchor: o.anchor, view: o.view ?? [0.3, 0.1, 1], fit: o.fit ?? 2.4,
      }),
    );
  const group_ = (m: THREE.Object3D) => group("x", m);

  // ================================================================ SKULL
  // One continuous skull surface cut into its named bones (see lib/skull.ts).
  {
    const sk = await buildSkull({ tris: 21000 });
    const facing: [number, number, number] = [0.45, 0.1, 1];
    const meta: Record<string, { name: string; anchor: [number, number, number]; view: [number, number, number] }> = {
      bone_frontal: { name: "Frontal bone", anchor: [0.03, 1.72, 0.07], view: facing },
      bone_parietal: { name: "Parietal bones", anchor: [0.055, 1.74, -0.03], view: [0.8, 0.5, 0.3] },
      bone_temporal: { name: "Temporal bones", anchor: [0.071, 1.63, -0.02], view: [1, 0.05, 0.1] },
      bone_occipital: { name: "Occipital bone", anchor: [0.03, 1.66, -0.105], view: [0.4, 0.2, -1] },
      bone_sphenoid: { name: "Sphenoid bone", anchor: [0.066, 1.655, 0.035], view: [1, 0.1, 0.5] },
      bone_zygomatic: { name: "Zygomatic bones", anchor: [0.055, 1.613, 0.06], view: [0.8, 0.05, 1] },
      bone_maxilla: { name: "Maxilla", anchor: [0.02, 1.59, 0.083], view: [0.3, 0, 1] },
      bone_nasal: { name: "Nasal bones", anchor: [0.004, 1.63, 0.092], view: [0.5, 0.1, 1] },
    };
    for (const [id, g] of Object.entries(sk.bones)) {
      const m = meta[id];
      if (!m) throw new Error("unexpected skull piece " + id);
      addBone(g, id, m.name, "skull", { anchor: m.anchor, view: m.view, fit: id === "bone_nasal" ? 1.2 : 1.7, raw: true });
    }
    addBone(sk.mandible, "bone_mandible", "Mandible", "skull", { anchor: [0.045, 1.547, 0.05], view: [0.8, -0.1, 1], fit: 1.8, raw: true });
    addBone(sk.teeth, "bone_teeth", "Teeth", "skull", { anchor: [0.018, 1.566, 0.086], view: [0.3, 0, 1], fit: 1.4, raw: true, glossy: true });
  }

  // ================================================================ SPINE
  {
    const region = (kind: Vert["kind"]) => merge(VERTS.filter((v) => v.kind === kind).flatMap((v) => vertebra(v)));
    addBone(region("C"), "bone_cervical", "Cervical vertebrae", "axial", { anchor: [0.012, 1.51, -0.03], view: [1, 0.1, 0.4], fit: 1.8 });
    addBone(region("T"), "bone_thoracic", "Thoracic vertebrae", "axial", { anchor: [0.012, 1.28, -0.105], view: [0.9, 0.05, -0.6], fit: 2.0 });
    addBone(region("L"), "bone_lumbar", "Lumbar vertebrae", "axial", { anchor: [0.03, 1.03, -0.035], view: [1, 0.05, 0.3], fit: 1.8 });
    addBone(await meshBilateral(bones.sacrum(), { cell: 0.0009, tris: 2400, mirror: false }), "bone_sacrum", "Sacrum", "axial", { anchor: [0.02, 0.9, -0.04], view: [0.5, 0.1, -1], fit: 1.6, raw: true });
    addBone(await meshBilateral(bones.coccyx(), { cell: 0.0006, tris: 500, mirror: false }), "bone_coccyx", "Coccyx", "axial", { anchor: [0, 0.782, -0.082], view: [0.6, -0.2, -1], fit: 1.2, raw: true });
  }

  // ================================================================ RIBS + STERNUM
  const cartilageGeos: THREE.BufferGeometry[] = [];
  {
    const ribs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      const r = rib(i);
      ribs.push(r.bonePart, mirrorX(r.bonePart));
      if (r.cart) cartilageGeos.push(tint(r.cart, CARTILAGE), tint(mirrorX(r.cart), CARTILAGE));
    }
    addBone(merge(ribs), "bone_ribs", "Ribs", "axial", { anchor: [0.128, 1.27, 0.0], view: [0.8, 0.1, 1], fit: 2.2 });
    addBone(await meshBilateral(bones.sternum(STERNUM_Z), { cell: 0.0008, tris: 1300, mirror: false }), "bone_sternum", "Sternum", "axial", { anchor: [0, 1.35, STERNUM_Z + 0.012], view: [0.2, 0.1, 1], fit: 2.0, raw: true });
  }

  // ================================================================ ARM, SHOULDER, HAND
  const bil = async (f: ReturnType<typeof bones.femur>, cell: number, tris: number) => meshBilateral(f, { cell, tris });
  addBone(await bil(bones.clavicle(), 0.0009, 1800), "bone_clavicle", "Clavicle", "upper", { anchor: [0.1, 1.463, 0.024], view: [0.2, 0.5, 1], fit: 2.0, raw: true });
  addBone(await bil(bones.scapula(), 0.0009, 3800), "bone_scapula", "Scapula", "upper", { anchor: [0.115, 1.36, -0.118], view: [0.3, 0.1, -1], fit: 2.2, raw: true });
  addBone(await bil(bones.humerus(), 0.0011, 4200), "bone_humerus", "Humerus", "upper", { anchor: [0.205, 1.25, 0.012], view: [0.4, 0.1, 1], fit: 2.2, raw: true });
  addBone(await bil(bones.ulna(), 0.0009, 2400), "bone_ulna", "Ulna", "upper", { anchor: [0.234, 0.99, -0.02], view: [0.4, 0.1, 1], fit: 2.0, raw: true });
  addBone(await bil(bones.radius(), 0.0009, 2400), "bone_radius", "Radius", "upper", { anchor: [0.254, 0.98, 0.02], view: [0.4, 0.1, 1], fit: 2.0, raw: true });
  addBone(await bil(bones.carpals(), 0.0005, 1800), "bone_carpals", "Carpals (wrist bones)", "upper", { anchor: [0.26, 0.842, 0.016], view: [0.2, 0.05, 1], fit: 1.0, raw: true });
  addBone(await bil(bones.metacarpals(), 0.0005, 2000), "bone_metacarpals", "Metacarpals", "upper", { anchor: [0.258, 0.8, 0.014], view: [0.2, 0.05, 1], fit: 1.2, raw: true });
  addBone(await bil(bones.handPhalanges(), 0.0004, 3000), "bone_hand_phalanges", "Phalanges of the hand", "upper", { anchor: [0.256, 0.735, 0.02], view: [0.2, 0.05, 1], fit: 1.3, raw: true });

  // ================================================================ PELVIS, LEG, FOOT
  addBone(await bil(bones.hipBone(), 0.0012, 7400), "bone_pelvis", "Hip bones", "lower", { anchor: [0.125, 0.99, 0.06], view: [0.5, 0.15, 1], fit: 2.3, raw: true, double: true });
  const HIPC = P(...bones.HIP_C);
  addBone(await bil(bones.femur(), 0.0012, 5200), "bone_femur", "Femur", "lower", { anchor: [0.108, 0.72, 0.024], view: [0.5, 0.1, 1], fit: 2.2, raw: true });
  addBone(await bil(bones.patella(), 0.0008, 700), "bone_patella", "Patella", "lower", { anchor: [0.092, 0.512, 0.052], view: [0.3, 0.1, 1], fit: 1.6, raw: true });
  addBone(await bil(bones.tibia(), 0.0012, 4200), "bone_tibia", "Tibia", "lower", { anchor: [0.09, 0.3, 0.02], view: [0.5, 0.1, 1], fit: 2.1, raw: true });
  addBone(await bil(bones.fibula(), 0.001, 1800), "bone_fibula", "Fibula", "lower", { anchor: [0.118, 0.3, -0.012], view: [0.6, 0.1, 1], fit: 2.1, raw: true });
  addBone(await bil(bones.tarsals(), 0.0007, 2600), "bone_tarsals", "Tarsals (ankle bones)", "lower", { anchor: [0.09, 0.06, -0.01], view: [1, 0.4, 0.4], fit: 1.2, raw: true });
  addBone(await bil(bones.metatarsals(), 0.0006, 1900), "bone_metatarsals", "Metatarsals", "lower", { anchor: [0.095, 0.03, 0.085], view: [0.6, 0.8, 0.7], fit: 1.2, raw: true });
  addBone(await bil(bones.footPhalanges(), 0.0005, 2000), "bone_foot_phalanges", "Phalanges of the foot", "lower", { anchor: [0.09, 0.016, 0.135], view: [0.5, 0.6, 1], fit: 1.1, raw: true });
  const KNEE = P(0.092, 0.497, 0.0);
  void KNEE;

  // ================================================================ CONNECTIVE TISSUE
  // Four named parts, one per kind of connective tissue a student is taught, so each one has its own
  // card, colour and callout instead of one generic "connective tissue" blob:
  //   discs (between vertebrae), cartilage (ribs-to-sternum, joint caps, menisci, shoulder labrum),
  //   ligaments (bone to bone) and tendons (muscle to bone).
  {
    const connMat = mat({ color: "#ffffff", rough: 0.45 });
    const addConn = (geos: THREE.BufferGeometry[], id: string, name: string, o: { anchor: [number, number, number]; view: [number, number, number]; fit: number }) =>
      B.root.add(B.part(group("x", mesh(merge(geos), connMat, id + "_geo")), { id, name, group: "connective", layer: "connective", ...o }));

    // ---- Intervertebral discs
    const discs: THREE.BufferGeometry[] = [];
    let lumbarDisc: [number, number, number] = [0, 1.05, -0.04];
    for (let i = 0; i < VERTS.length - 1; i++) {
      const a = VERTS[i], b = VERTS[i + 1];
      const y0 = a.y - (a.kind === "C" && a.n === 1 ? 0 : a.h / 2);
      const y1 = b.y + b.h / 2;
      const th = Math.max(0.003, y0 - y1);
      const w = (a.w + b.w) / 2 * 1.02, d = (a.d + b.d) / 2 * 1.02;
      const disc = lathe([[0, -th / 2], [1, -th / 2], [1.06, 0], [1, th / 2], [0, th / 2]], 20);
      disc.scale(w, 1, d);
      const zc = (spineZ(a.y) + spineZ(b.y)) / 2;
      xf(disc, { p: [0, (y0 + y1) / 2, zc] });
      discs.push(tint(disc, "#8fb0c4"));
      if (a.kind === "L" && a.n === 3) lumbarDisc = [0, (y0 + y1) / 2, zc + d];
    }
    addConn(discs, "tissue_discs", "Intervertebral discs", { anchor: lumbarDisc, view: [1, 0.1, 0.35], fit: 1.8 });

    // ---- Cartilage: costal cartilage, joint caps, menisci and the shoulder labrum
    const cap = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => tint(xf(ellipsoid(rx, ry, rz, 18, 12), { p: [x, y, z] }), CARTILAGE);
    const cart: THREE.BufferGeometry[] = [...cartilageGeos];
    const cside: THREE.BufferGeometry[] = [];
    cside.push(cap(HIPC.x - 0.0035, HIPC.y + 0.004, HIPC.z, 0.0258, 0.0258, 0.0258)); // femoral head
    cside.push(cap(0.072, 0.502, -0.003, 0.0178, 0.0272, 0.031)); // femoral condyles
    cside.push(cap(0.113, 0.502, -0.003, 0.0178, 0.0272, 0.031));
    cside.push(cap(0.176, 1.402, -0.01, 0.0232, 0.0232, 0.0232)); // humeral head
    for (const x of [0.072, 0.112]) {
      // Menisci: C-shaped pads between femur and tibia
      const m = new THREE.TorusGeometry(0.019, 0.0058, 8, 20, Math.PI * 1.35);
      xf(m, { p: [x, 0.488, -0.002], r: [Math.PI / 2, 0, x < 0.09 ? Math.PI * 0.82 : -Math.PI * 0.15] });
      cside.push(tint(m, "#a8bdc9"));
    }
    cside.push(tint(tube([P(0.17, 1.43, -0.036), P(0.175, 1.447, -0.034), P(0.18, 1.448, -0.034)], 0.0035, { radial: 6, segments: 5 }), "#a8bdc9")); // shoulder labrum
    cart.push(...both(cside));
    addConn(cart, "tissue_cartilage", "Cartilage", { anchor: [0.06, 1.36, 0.087], view: [0.35, 0.1, 1], fit: 2.0 });

    // ---- Ligaments: bone to bone
    const lig: THREE.BufferGeometry[] = [];
    const lside: THREE.BufferGeometry[] = [];
    // Knee: cruciates cross inside the joint; collaterals run down the sides
    lside.push(tint(tube([P(0.082, 0.49, 0.012), P(0.092, 0.505, -0.005), P(0.1, 0.515, -0.016)], 0.0035, { radial: 6, segments: 6 }), LIGAMENT));
    lside.push(tint(tube([P(0.102, 0.49, 0.012), P(0.094, 0.505, -0.002), P(0.084, 0.515, -0.012)], 0.0035, { radial: 6, segments: 6 }), LIGAMENT));
    lside.push(tint(tube([P(0.058, 0.512, 0.0), P(0.056, 0.49, 0.003), P(0.06, 0.44, 0.006)], 0.0042, { radial: 6, segments: 6 }), LIGAMENT));
    lside.push(tint(tube([P(0.127, 0.512, -0.004), P(0.128, 0.49, -0.006), P(0.126, 0.46, -0.011)], 0.0042, { radial: 6, segments: 6 }), LIGAMENT));
    lig.push(...both(lside));
    // Sacroiliac ligaments: short, strong bands that bind the sacrum to the hip bones
    for (const sgn of [-1, 1]) lig.push(tint(tube([P(sgn * 0.036, 0.975, -0.062), P(sgn * 0.05, 0.965, -0.07), P(sgn * 0.06, 0.94, -0.058)], 0.005, { radial: 6, segments: 6 }), LIGAMENT));
    addConn(lig, "tissue_ligaments", "Ligaments", { anchor: [0.128, 0.49, -0.006], view: [0.9, 0.1, 0.5], fit: 1.7 });

    // ---- Tendons: muscle to bone (patellar and quadriceps, Achilles, biceps, wrist) and the linea alba
    const ten: THREE.BufferGeometry[] = [];
    const tside: THREE.BufferGeometry[] = [];
    tside.push(tint(tube([P(0.092, 0.495, 0.047), P(0.092, 0.474, 0.042), P(0.092, 0.456, 0.036)], 0.0075, { radial: 8, segments: 6 }), TENDON)); // patellar tendon
    tside.push(tint(tube([P(0.095, 0.575, 0.05), P(0.093, 0.545, 0.05), P(0.092, 0.527, 0.05)], 0.008, { radial: 8, segments: 6 }), TENDON)); // quadriceps tendon
    tside.push(tint(tube([P(0.083, 0.2, -0.037), P(0.084, 0.13, -0.042), P(0.086, 0.06, -0.047)], (t) => 0.0098 - 0.0028 * t, { radial: 9, segments: 12 }), TENDON)); // Achilles tendon
    tside.push(tint(tube([P(0.222, 1.118, 0.02), P(0.232, 1.098, 0.016), P(0.238, 1.085, 0.012)], 0.0045, { radial: 6, segments: 6 }), TENDON)); // biceps tendon
    for (let k = 0; k < 4; k++) tside.push(tint(tube([P(0.232 + k * 0.007, 0.93, 0.024), P(0.236 + k * 0.008, 0.88, 0.024), P(0.24 + k * 0.0085, 0.845, 0.022)], 0.0021, { radial: 5, segments: 6 }), TENDON)); // forearm tendons
    ten.push(...both(tside));
    ten.push(tint(tube([P(0, 1.255, 0.103), P(0, 1.12, 0.108), P(0, 0.99, 0.104)], 0.0028, { radial: 5, segments: 12 }), TENDON)); // linea alba
    addConn(ten, "tissue_tendons", "Tendons", { anchor: [0.092, 0.474, 0.047], view: [0.4, 0.1, 1], fit: 2.0 });
  }

  // ================================================================ MUSCLE
  {
    const mu: THREE.BufferGeometry[] = [];
    /** A muscle belly: spindle-shaped tube from origin to insertion. */
    const belly = (o: THREE.Vector3, i: THREE.Vector3, rMax: number, opt: { peak?: number; flat?: [number, number, number]; bow?: THREE.Vector3; end?: number; seg?: number } = {}) => {
      const peak = opt.peak ?? 0.45;
      const end = opt.end ?? 0.0055;
      const mid = o.clone().lerp(i, peak).add(opt.bow ?? P(0, 0, 0));
      const g = tube([o, mid, i], (t) => {
        const u = t < peak ? t / peak : (1 - t) / (1 - peak);
        return end + (rMax - end) * Math.pow(Math.sin((u * Math.PI) / 2), 0.7);
      }, { radial: 10, segments: Math.round((opt.seg ?? 16) * 0.8) });
      if (opt.flat) {
        const c = o.clone().lerp(i, 0.5);
        xf(g, { p: [-c.x, -c.y, -c.z] });
        g.scale(...opt.flat);
        xf(g, { p: [c.x, c.y, c.z] });
      }
      displace(g, noise, 0.0012, 60);
      return paint(g, MUSCLE_A, MUSCLE_B, noise, [90, 7, 90]);
    };
    const side: THREE.BufferGeometry[] = [];
    // ---- shoulder and arm
    side.push(belly(P(0.15, 1.455, 0.02), P(0.212, 1.3, 0.004), 0.027, { peak: 0.3, bow: P(0.012, 0, 0.012) })); // deltoid, front
    side.push(belly(P(0.178, 1.456, -0.02), P(0.214, 1.3, 0.0), 0.03, { peak: 0.3, bow: P(0.016, 0, 0) })); // deltoid, side
    side.push(belly(P(0.15, 1.44, -0.07), P(0.214, 1.3, -0.014), 0.026, { peak: 0.3, bow: P(0.006, 0, -0.014) })); // deltoid, back
    side.push(belly(P(0.2, 1.37, 0.012), P(0.226, 1.13, 0.024), 0.0235, { peak: 0.42, bow: P(0.002, 0, 0.012) })); // biceps
    side.push(belly(P(0.196, 1.36, -0.022), P(0.218, 1.12, -0.03), 0.0265, { peak: 0.4, bow: P(0.0, 0, -0.012) })); // triceps
    side.push(belly(P(0.226, 1.1, 0.012), P(0.256, 0.9, 0.018), 0.0215, { peak: 0.2, bow: P(0.005, 0, 0.006) })); // forearm flexors
    side.push(belly(P(0.236, 1.1, -0.014), P(0.252, 0.9, -0.012), 0.0185, { peak: 0.22 })); // forearm extensors
    // ---- chest, abdomen, back (flattened against the torso)
    for (let k = 0; k < 6; k++) {
      const t = k / 5;
      side.push(belly(P(0.018 + t * 0.004, 1.43 - t * 0.12, 0.092), P(0.185, 1.37 - t * 0.02, 0.048), 0.0105, { peak: 0.5, flat: [1, 1, 0.55], bow: P(0, 0, 0.012) })); // pectoralis fan
    }
    // Rectus abdominis: stacked rounded "packs" divided by tendinous intersections
    for (let r = 0; r < 4; r++) {
      const pk = roundedBox(0.05, 0.048, 0.018, 0.008, 3);
      xf(pk, { p: [0.032, 1.225 - r * 0.057, 0.099 + (r === 3 ? -0.004 : 0)] });
      displace(pk, noise, 0.0008, 60);
      side.push(paint(pk, MUSCLE_A, MUSCLE_B, noise, [90, 7, 90]));
    }
    side.push(belly(P(0.07, 1.245, 0.092), P(0.145, 1.07, 0.072), 0.02, { peak: 0.5, flat: [1, 1, 0.45], bow: P(0.01, 0, 0.012) })); // external oblique
    for (let k = 0; k < 4; k++) side.push(belly(P(0.14 - k * 0.003, 1.335 - k * 0.032, 0.05), P(0.125 - k * 0.003, 1.3 - k * 0.032, 0.015), 0.0075, { peak: 0.5, flat: [1, 1, 0.8] })); // serratus
    side.push(belly(P(0.01, 1.52, -0.055), P(0.17, 1.455, -0.04), 0.014, { peak: 0.5, flat: [1, 0.7, 0.55], bow: P(0, 0.01, -0.01) })); // trapezius upper
    side.push(belly(P(0.008, 1.38, -0.075), P(0.125, 1.405, -0.094), 0.0155, { peak: 0.5, flat: [1, 1, 0.5] })); // trapezius mid
    side.push(belly(P(0.006, 1.2, -0.07), P(0.1, 1.38, -0.096), 0.016, { peak: 0.5, flat: [1, 1, 0.5] })); // trapezius lower
    for (let k = 0; k < 3; k++) side.push(belly(P(0.02 + k * 0.01, 1.07 + k * 0.045, -0.08), P(0.16, 1.28 - k * 0.02, -0.04), 0.0125, { peak: 0.5, flat: [1, 1, 0.5], bow: P(0.01, 0, -0.012) })); // latissimus
    side.push(belly(P(0.05, 1.62, -0.03), P(0.02, 1.462, 0.058), 0.0115, { peak: 0.5, bow: P(0.01, 0, 0.012) })); // sternocleidomastoid
    // ---- hip and thigh
    side.push(knobMuscle(0.082, 0.985, -0.098, 0.062, 0.052, 0.033)); // gluteus maximus
    side.push(knobMuscle(0.138, 1.0, -0.055, 0.04, 0.04, 0.028)); // gluteus medius
    side.push(belly(P(0.108, 0.9, 0.05), P(0.092, 0.54, 0.05), 0.0285, { peak: 0.4, bow: P(0, 0, 0.006) })); // rectus femoris
    side.push(belly(P(0.142, 0.88, 0.02), P(0.118, 0.545, 0.04), 0.033, { peak: 0.38, bow: P(0.01, 0, 0.0) })); // vastus lateralis
    side.push(belly(P(0.075, 0.74, 0.036), P(0.074, 0.53, 0.05), 0.027, { peak: 0.72 })); // vastus medialis
    side.push(belly(P(0.118, 0.88, -0.05), P(0.118, 0.5, -0.026), 0.0255, { peak: 0.38, bow: P(0.004, 0, -0.012) })); // biceps femoris
    side.push(belly(P(0.08, 0.88, -0.046), P(0.074, 0.5, -0.02), 0.0235, { peak: 0.36, bow: P(-0.003, 0, -0.01) })); // semitendinosus
    side.push(belly(P(0.04, 0.85, 0.016), P(0.07, 0.6, 0.0), 0.03, { peak: 0.35 })); // adductors
    // ---- lower leg
    side.push(belly(P(0.076, 0.49, -0.03), P(0.082, 0.19, -0.034), 0.0335, { peak: 0.22, bow: P(-0.002, 0, -0.01) })); // gastrocnemius, medial head
    side.push(belly(P(0.108, 0.49, -0.03), P(0.088, 0.19, -0.034), 0.031, { peak: 0.22, bow: P(0.004, 0, -0.01) })); // gastrocnemius, lateral head
    side.push(belly(P(0.108, 0.46, 0.028), P(0.084, 0.14, 0.03), 0.0175, { peak: 0.2, bow: P(0.004, 0, 0.004) })); // tibialis anterior
    side.push(belly(P(0.122, 0.45, 0.006), P(0.108, 0.12, -0.002), 0.014, { peak: 0.25, bow: P(0.008, 0, 0) })); // peroneals
    mu.push(...both(side));
    B.root.add(B.part(group("x", mesh(merge(mu), mat({ color: "#ffffff", rough: 0.55 }), "muscle_geo")), { id: "tissue_muscle", name: "Muscle", group: "tissue", layer: "muscle", shell: true, anchor: [0.092, 0.72, 0.056], view: [0.4, 0.1, 1], fit: 2.2 }));
  }

  // ================================================================ SKIN
  {
    const L = (c: [number, number, number], rx: number, rz: number) => ({ c, rx, rz });
    // The skin is ONE continuous surface: elliptical cross-section profiles
    // (head, neck, torso, limbs) as distance fields, smoothly blended.
    // A single shell has no overlapping translucent pieces, so it reads as a body,
    // not as a stack of see-through blocks.
    type Sec = { c: [number, number, number]; rx: number; rz: number };
    const loftF = (secs: Sec[]): sdf.SDF => {
      const S = [...secs].sort((p, q) => q.c[1] - p.c[1]); // top to bottom
      const top = S[0].c[1], bot = S[S.length - 1].c[1];
      const f: sdf.SDF = (x, y, z) => {
        const yc = Math.min(top, Math.max(bot, y));
        let i = 0;
        while (i < S.length - 2 && S[i + 1].c[1] > yc) i++;
        const A = S[i], Bq = S[i + 1];
        const t = (A.c[1] - yc) / (A.c[1] - Bq.c[1] || 1);
        const k = t * t * (3 - 2 * t);
        const cx = A.c[0] + (Bq.c[0] - A.c[0]) * k, cz = A.c[2] + (Bq.c[2] - A.c[2]) * k;
        const rx = A.rx + (Bq.rx - A.rx) * k, rz = A.rz + (Bq.rz - A.rz) * k;
        const e = (Math.hypot((x - cx) / rx, (z - cz) / rz) - 1) * Math.min(rx, rz);
        const dy = Math.max(y - top, bot - y);
        return dy > 0 ? Math.hypot(Math.max(e, 0), dy) : e;
      };
      const R = Math.max(...S.map((q) => Math.max(q.rx, q.rz)));
      const xs = S.map((q) => q.c[0]), zs = S.map((q) => q.c[2]);
      f.box = { min: [Math.min(...xs) - R, bot, Math.min(...zs) - R], max: [Math.max(...xs) + R, top, Math.max(...zs) + R] };
      // Round both ends with an ellipsoid cap, so a limb ends in a dome, not a flat lid.
      const cap = (q: Sec) => sdf.ellipsoid(q.c, [q.rx, Math.min(q.rx, q.rz), q.rz]);
      return sdf.union(0.01, f, cap(S[0]), cap(S[S.length - 1]));
    };
    const neckF = loftF([L([0, 1.6, 0.0], 0.054, 0.058), L([0, 1.53, -0.004], 0.052, 0.056), L([0, 1.47, -0.006], 0.07, 0.07)]);
    const torsoF = loftF([
      L([0, 1.51, -0.006], 0.07, 0.062), L([0, 1.49, -0.008], 0.108, 0.074), L([0, 1.47, -0.01], 0.146, 0.088), L([0, 1.445, -0.01], 0.172, 0.102), L([0, 1.41, -0.006], 0.168, 0.116),
      L([0, 1.35, -0.002], 0.156, 0.122), L([0, 1.28, 0.002], 0.146, 0.118), L([0, 1.2, 0.004], 0.136, 0.112), L([0, 1.12, 0.004], 0.131, 0.107), L([0, 1.04, 0.0], 0.14, 0.11),
      L([0, 0.97, -0.01], 0.157, 0.118), L([0, 0.91, -0.014], 0.16, 0.118), L([0, 0.85, -0.012], 0.15, 0.108), L([0, 0.8, -0.01], 0.12, 0.09),
    ]);
    const armF = loftF([
      L([0.19, 1.46, -0.004], 0.058, 0.06), L([0.204, 1.36, 0.0], 0.05, 0.05), L([0.214, 1.25, 0.002], 0.047, 0.047), L([0.222, 1.14, 0.004], 0.04, 0.042),
      L([0.232, 1.04, 0.006], 0.044, 0.044), L([0.246, 0.94, 0.008], 0.034, 0.036), L([0.256, 0.875, 0.01], 0.027, 0.03),
    ]);
    const legF = loftF([
      L([0.09, 0.94, 0.0], 0.072, 0.098), L([0.092, 0.88, 0.004], 0.088, 0.1), L([0.098, 0.8, 0.01], 0.088, 0.092), L([0.098, 0.72, 0.012], 0.08, 0.086), L([0.095, 0.62, 0.012], 0.072, 0.075),
      L([0.092, 0.52, 0.006], 0.062, 0.068), L([0.09, 0.42, -0.004], 0.058, 0.066), L([0.088, 0.32, -0.012], 0.05, 0.06), L([0.086, 0.2, -0.012], 0.038, 0.046),
      L([0.085, 0.1, -0.008], 0.03, 0.036), L([0.085, 0.06, -0.006], 0.032, 0.036),
    ]);
    const head = sdf.union(0.02, sdf.ellipsoid([0, 1.665, 0.0], [0.088, 0.118, 0.103]), sdf.ellipsoid([0, 1.572, 0.062], [0.034, 0.03, 0.04]), sdf.ellipsoid([0, 1.625, 0.106], [0.0165, 0.026, 0.02]));
    const ears = sdf.mirrorX(sdf.ellipsoid([0.086, 1.655, -0.01], [0.012, 0.026, 0.017]));
    const hands = sdf.mirrorX(sdf.union(0.01, sdf.ellipsoid([0.258, 0.82, 0.014], [0.032, 0.058, 0.02]), sdf.capsule([0.258, 0.79, 0.016], [0.264, 0.72, 0.02], 0.018, 0.012)));
    const feet = sdf.mirrorX(sdf.ellipsoid([0.09, 0.034, 0.038], [0.036, 0.034, 0.1]));
    // Trunk, head and legs blend generously; the arms only touch the trunk at the
    // shoulder, so they get a tight blend and keep the gap at the armpit.
    const trunk = sdf.union(0.025, torsoF, neckF, head, sdf.mirrorX(legF), feet);
    const arms = sdf.union(0.01, sdf.mirrorX(armF), hands);
    const body = sdf.union(0.004, trunk, arms);
    const skinBody = sdf.union(0.006, body, ears);
    const skinC = new THREE.Color(SKIN), skinD = new THREE.Color("#d6a88c");
    const m = await sdf.meshSDF(skinBody, {
      min: [-0.32, 0.0, -0.16], max: [0.32, 1.8, 0.16], cell: 0.0055, tris: 9000, error: 0.003,
      color: (p) => skinC.clone().lerp(skinD, noise(p[0] * 8, p[1] * 8, p[2] * 8) * 0.5 + 0.5),
    });
    B.root.add(B.part(group("x", mesh(m, mat({ color: "#ffffff", rough: 0.6, opacity: 0.3 }), "skin_geo")), { id: "tissue_skin", name: "Skin", group: "tissue", layer: "skin", shell: true, anchor: [0.17, 1.2, 0.1], view: [0.5, 0.1, 1], fit: 2.8 }));
  }

  return B.write("public/models");
}

/** Muscle mass as a flattened, lumpy ellipsoid (gluteals). */
function knobMuscle(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  const g = xf(ellipsoid(rx, ry, rz, 20, 14), { p: [x, y, z] });
  displace(g, noise, 0.0015, 40);
  return paint(g, MUSCLE_A, MUSCLE_B, noise, [90, 7, 90]);
}

if (require.main === module) buildSkeleton().then((r) => console.log(JSON.stringify(r)));
