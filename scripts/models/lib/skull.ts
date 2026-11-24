/**
 * The skull, modelled as a distance field and split into its named bones.
 *
 * Authored in a LOCAL frame (metres): origin between the orbits at about the
 * level of the brow, +y up, +z toward the face, mirrored in x. `SKULL_ORIGIN`
 * places it on the skeleton.
 *
 * How it is built
 *   braincase   one large ellipsoid with an occipital bulge and flattened base
 *   face        a mass blended to the front, from which the orbits and the nasal
 *               aperture are carved; cheekbones, zygomatic arches, maxilla and
 *               mastoid processes are blended on
 *   sutures     shallow serrated grooves along the coronal, sagittal, lambdoid
 *               and squamosal lines, plus the facial sutures
 *   bones       the single surface is cut into frontal, parietal, temporal,
 *               occipital, sphenoid, zygomatic, maxilla and nasal pieces by the
 *               SAME boundary functions that cut the grooves, so every seam a
 *               student sees is a real bone boundary
 *
 * Proportions follow an average adult: length ~19 cm, breadth ~14.5 cm,
 * nasion-to-chin ~12 cm. It is a teaching model, not a scan.
 */
import * as THREE from "three";
import { makeNoise3 } from "./math";
import { box, capsule, ellipsoid, intersect, meshSDF, mirrorX, path, plane, relief, spline, splitByLabel, subtract, union, type SDF, type Vec3 } from "./sdf";

export const SKULL_ORIGIN: Vec3 = [0, 1.672, 0.002];
const noise = makeNoise3(77);

// ----------------------------------------------------------------- palette
const IVORY = new THREE.Color("#efe6cf");
const IVORY_D = new THREE.Color("#d2c3a0");
const SOCKET = new THREE.Color("#5a4e3e");
const SUTURE = new THREE.Color("#a8946e");
const TOOTH = new THREE.Color("#f7f3e6");
const TOOTH_ROOT = new THREE.Color("#e3d6b4");

// ---------------------------------------------------------- boundary lines
// Each returns a signed scalar in metres whose zero set is a suture line on the
// skull surface. The same functions cut the grooves and assign the bone labels.
const coronal = (p: Vec3) => p[2] - (0.03 - 0.22 * (p[1] - 0.02) * 0.35) + 0.0012 * Math.sin(p[0] * 900); // >0 frontal side
// Lambdoid: from lambda (top of the back of the head) down and FORWARD to the asterion behind the ear.
const lambdoid = (p: Vec3) => p[2] - (-0.072 + 0.3 * Math.max(0, 0.07 - p[1]) + 0.15 * Math.abs(p[0])) + 0.0012 * Math.sin(p[0] * 950 + p[1] * 300); // <0 occipital
const squamosal = (p: Vec3) => p[1] - (-0.012 - 0.18 * ((p[2] + 0.015) / 0.06) ** 2 * 0.06) - 0.0008 * Math.sin(p[2] * 700); // <0 temporal
const sagittal = (p: Vec3) => p[0] + 0.0012 * Math.sin(p[2] * 900);

// --------------------------------------------------------------- the form
function skullField(): { field: SDF; orbit: SDF; nose: SDF } {
  // Braincase: main vault, slightly longer behind, flattened underneath.
  const vault = union(
    0.025,
    ellipsoid([0, 0.012, -0.018], [0.071, 0.072, 0.094]),
    ellipsoid([0, -0.004, -0.062], [0.06, 0.055, 0.058]), // occipital bulge
    mirrorX(ellipsoid([0.046, -0.046, -0.018], [0.026, 0.024, 0.036])), // temporal base, where the ear and jaw joint sit
    ellipsoid([0, -0.012, 0.03], [0.064, 0.056, 0.06]), // frontal fullness
  );
  const base = plane([0, -0.058, 0], [0, -1, 0.18]);
  const cranium = intersect(vault, (x, y, z) => -base(x, y, z) * -1, 0.02);

  // Face mass: brow, orbital region, cheeks and the upper jaw.
  const face = mirrorX(
    union(
      0.012,
      capsule([0.0, -0.022, 0.079], [0.046, -0.024, 0.071], 0.0105, 0.0085), // brow ridge
      ellipsoid([0.0, -0.05, 0.063], [0.058, 0.034, 0.034]), // orbital mass
      ellipsoid([0.05, -0.061, 0.056], [0.02, 0.018, 0.019]), // zygomatic body (cheekbone)
      ellipsoid([0.0, -0.083, 0.066], [0.037, 0.03, 0.03]), // maxilla
      ellipsoid([0.0, -0.1, 0.07], [0.031, 0.012, 0.022]), // alveolar process (tooth row)
      capsule([0.056, -0.058, 0.05], [0.066, -0.056, 0.012], 0.0055, 0.0045), // zygomatic arch, front half
      capsule([0.066, -0.056, 0.012], [0.061, -0.053, -0.005], 0.0045, 0.0055), // zygomatic arch, temporal half
      ellipsoid([0.055, -0.068, -0.033], [0.0085, 0.011, 0.01]), // mastoid process
    ),
  );
  // Nasal bones: a narrow bridge between the orbits.
  const nasal = mirrorX(capsule([0.004, -0.034, 0.083], [0.006, -0.058, 0.09], 0.0055, 0.0045));
  // External occipital protuberance and the occipital condyles.
  const back = union(0.006, ellipsoid([0, -0.035, -0.108], [0.016, 0.01, 0.006]), mirrorX(ellipsoid([0.013, -0.07, -0.03], [0.005, 0.004, 0.009])));

  let s = union(0.016, cranium, face, nasal, back);

  // Temporal fossa: the hollow on each side above the zygomatic arch.
  s = subtract(s, mirrorX(ellipsoid([0.083, -0.03, 0.02], [0.02, 0.032, 0.036])), 0.02);
  // Hollow under the cheekbone (between maxilla and arch).
  s = subtract(s, mirrorX(ellipsoid([0.06, -0.082, 0.03], [0.014, 0.014, 0.02])), 0.008);

  // Orbits, angled outward like the real sockets.
  const orbit = mirrorX(union(0.004, box([0.032, -0.042, 0.092], [0.0182, 0.0158, 0.034], 0.0105, [0.08, -0.16, 0.1]), ellipsoid([0.026, -0.043, 0.062], [0.012, 0.011, 0.02])));
  s = subtract(s, orbit, 0.004);
  // Piriform (nasal) aperture: pear shaped, wider below.
  const nose = union(0.006, ellipsoid([0, -0.077, 0.092], [0.0115, 0.0145, 0.03]), ellipsoid([0, -0.062, 0.096], [0.006, 0.01, 0.022]));
  s = subtract(s, nose, 0.003);
  // Ear canal (external acoustic meatus) and the foramen magnum.
  s = subtract(s, mirrorX(capsule([0.074, -0.061, -0.014], [0.05, -0.061, -0.014], 0.0048)), 0.002);
  s = subtract(s, ellipsoid([0, -0.07, -0.032], [0.016, 0.03, 0.019]), 0.004);
  // Infraorbital and supraorbital foramina, small but they make the face read.
  s = subtract(s, mirrorX(ellipsoid([0.027, -0.064, 0.086], [0.0016, 0.0016, 0.008])), 0.001);

  // Sutures: shallow serrated grooves.
  const groove = (g: (p: Vec3) => number, w: number, depth: number, where: (p: Vec3) => boolean): SDF => {
    const inner = s;
    const out: SDF = (x, y, z) => {
      const d = inner(x, y, z);
      if (d > 0.003 || d < -0.006) return d;
      const p: Vec3 = [x, y, z];
      if (!where(p)) return d;
      const a = Math.abs(g(p));
      return a < w ? d + depth * (1 - (a / w) ** 2) : d;
    };
    out.box = inner.box;
    return out;
  };
  s = groove(coronal, 0.0016, 0.0009, (p) => p[1] > -0.03);
  s = groove(sagittal, 0.0014, 0.0009, (p) => p[1] > 0.03 && p[2] < 0.03 && p[2] > -0.09);
  s = groove(lambdoid, 0.0016, 0.0009, (p) => p[1] > -0.06 && p[2] < -0.04);
  s = groove(squamosal, 0.0012, 0.0007, (p) => Math.abs(p[0]) > 0.05 && p[2] > -0.06 && p[2] < 0.04);

  // Fine bony relief
  s = relief(s, noise, 0.00035, 140);
  return { field: s, orbit, nose };
}

/** Which bone a point on the skull surface belongs to. Uses the suture functions above. */
export function skullBone(p: Vec3): string {
  const [x, y, z] = p;
  const ax = Math.abs(x);
  // Face first (front and below the brow)
  if (z > 0.035 && y < -0.03) {
    if (ax < 0.009 && y > -0.064 && z > 0.075) return "bone_nasal";
    if (ax > 0.036 && y < -0.045 && y > -0.078) return "bone_zygomatic";
    if (y < -0.052 || (ax < 0.03 && y < -0.045)) return "bone_maxilla";
  }
  if (ax > 0.05 && z > -0.012 && z < 0.045 && y < -0.045 && y > -0.07) return "bone_zygomatic"; // the arch
  if (squamosal(p) < 0 && ax > 0.042 && z < 0.035 && z > -0.075) {
    if (z > 0.018 && y > -0.05) return "bone_sphenoid"; // greater wing in the temple
    return "bone_temporal";
  }
  if (lambdoid(p) < 0) return "bone_occipital";
  if (coronal(p) > 0) return y < -0.06 ? "bone_sphenoid" : "bone_frontal";
  if (y < -0.055) return ax < 0.03 ? "bone_occipital" : "bone_temporal";
  return "bone_parietal";
}

const toWorld = (g: THREE.BufferGeometry) => g.translate(SKULL_ORIGIN[0], SKULL_ORIGIN[1], SKULL_ORIGIN[2]);

// ------------------------------------------------------------------ teeth
/** Upper or lower tooth row as a distance field: incisors, canines, premolars, molars. */
function teethField(upper: boolean): SDF {
  const parts: SDF[] = [];
  const y0 = upper ? -0.106 : -0.112;
  const dir = upper ? -1 : 1; // crowns point toward the bite
  // half-arch: 8 teeth from the midline back
  const widths = [0.0042, 0.0034, 0.0038, 0.0035, 0.0035, 0.005, 0.0048, 0.0044];
  let s = 0.002;
  for (let i = 0; i < 8; i++) {
    const w = widths[i];
    s += w;
    const a = s / 0.028; // arch parameter
    const x = 0.028 * Math.sin(Math.min(a, 1.4)) * (i < 3 ? 1 : 1.05);
    const z = (upper ? 0.081 : 0.079) - 0.024 * (1 - Math.cos(Math.min(a, 1.4))) - Math.max(0, a - 1.2) * 0.01;
    s += w;
    const crownH = i < 3 ? 0.0055 : 0.0045;
    const molar = i >= 5;
    const crown = molar
      ? box([x, y0 + dir * crownH * 0.5, z], [w * 0.95, crownH * 0.55, 0.0048], 0.0016)
      : ellipsoid([x, y0 + dir * crownH * 0.5, z], [w * 0.95, crownH * 0.7, i < 2 ? 0.0022 : 0.0034]);
    const root = capsule([x, y0, z], [x, y0 - dir * 0.007, z - 0.0005], molar ? 0.003 : 0.0022, 0.0012);
    parts.push(union(0.0015, crown, root));
  }
  return mirrorX(union(0.0004, ...parts));
}

function toothColor(upper: boolean) {
  const y0 = upper ? -0.106 : -0.112;
  return (p: Vec3): THREE.Color => {
    const t = Math.min(1, Math.max(0, (upper ? p[1] - y0 : y0 - p[1]) / 0.004));
    return TOOTH.clone().lerp(TOOTH_ROOT, t);
  };
}

// --------------------------------------------------------------- mandible
function mandibleField(): SDF {
  // The jaw follows a U from chin to angle, then rises as the ramus.
  const body = mirrorX(
    path(
      spline([[0.0, -0.13, 0.077], [0.022, -0.128, 0.068], [0.038, -0.125, 0.042], [0.048, -0.124, 0.012], [0.052, -0.125, -0.006]], 14),
      (t) => 0.0105 - 0.002 * t,
      0.004,
    ),
  );
  // Make the body tall rather than round: an extruded profile via a second, higher row.
  const upperRow = mirrorX(path(spline([[0.0, -0.118, 0.079], [0.022, -0.117, 0.07], [0.038, -0.116, 0.044], [0.048, -0.115, 0.014], [0.052, -0.113, -0.006]], 14), 0.0075, 0.004));
  // Ramus: a thin plate rising from the angle of the jaw, leaning back.
  const ramus = mirrorX(box([0.054, -0.094, -0.002], [0.0028, 0.032, 0.0145], 0.0025, [-0.22, -0.12, 0.04]));
  const angle = mirrorX(ellipsoid([0.053, -0.124, -0.012], [0.0045, 0.008, 0.008])); // angle of the mandible
  const condyle = mirrorX(union(0.003, ellipsoid([0.056, -0.06, -0.009], [0.009, 0.0045, 0.0055], [0, -0.3, 0]), capsule([0.055, -0.074, -0.01], [0.056, -0.062, -0.009], 0.004)));
  const coronoid = mirrorX(capsule([0.053, -0.088, 0.008], [0.052, -0.069, 0.017], 0.0042, 0.0018));
  const chin = ellipsoid([0, -0.132, 0.081], [0.014, 0.008, 0.007]);
  let m = union(0.006, body, upperRow, ramus, angle, condyle, coronoid, chin);
  // Mandibular notch between coronoid and condyle
  m = subtract(m, mirrorX(ellipsoid([0.054, -0.064, 0.003], [0.007, 0.009, 0.0055])), 0.003);
  // Mental foramen
  m = subtract(m, mirrorX(ellipsoid([0.024, -0.122, 0.072], [0.0015, 0.0015, 0.008])), 0.001);
  return relief(m, noise, 0.0003, 140);
}

// --------------------------------------------------------------- building
export interface SkullGeometry {
  bones: Record<string, THREE.BufferGeometry>;
  mandible: THREE.BufferGeometry;
  teeth: THREE.BufferGeometry;
}

export async function buildSkull(o: { cell?: number; tris?: number } = {}): Promise<SkullGeometry> {
  const { field, orbit, nose } = skullField();
  const cell = o.cell ?? 0.0009;
  const boneColor = (p: Vec3, n: Vec3) => {
    const t = noise(p[0] * 60, p[1] * 60, p[2] * 60) * 0.5 + 0.5;
    const c = IVORY.clone().lerp(IVORY_D, t * 0.7);
    // Darken deep inside the orbits and nose, and along the sutures.
    // Inside a socket: darker the deeper it goes (z further back than the rim).
    if (orbit(...p) < 0.004) c.lerp(SOCKET, Math.min(1, Math.max(0, (0.09 - p[2]) / 0.03)) * 0.85);
    if (nose(...p) < 0.003) c.lerp(SOCKET, Math.min(1, Math.max(0, (0.094 - p[2]) / 0.022)) * 0.9);
    const sut = Math.min(Math.abs(coronal(p)), Math.abs(lambdoid(p)), p[1] > 0.03 ? Math.abs(sagittal(p)) : 1, Math.abs(p[0]) > 0.05 ? Math.abs(squamosal(p)) : 1);
    if (sut < 0.0012 && p[1] > -0.06) c.lerp(SUTURE, 0.55 * (1 - sut / 0.0012));
    // Underside a touch darker
    if (n[1] < -0.5) c.multiplyScalar(0.93);
    return c;
  };
  const whole = await meshSDF(field, { min: [-0.09, -0.1, -0.13], max: [0.09, 0.12, 0.115], cell, tris: o.tris ?? 34000, color: boneColor });
  const bones = splitByLabel(whole, skullBone);
  for (const g of Object.values(bones)) toWorld(g);

  const mandible = toWorld(await meshSDF(mandibleField(), { min: [-0.075, -0.145, -0.04], max: [0.075, -0.055, 0.095], cell: cell * 0.9, tris: 4200, color: (p, n) => boneColor(p, n) }));
  const up = await meshSDF(teethField(true), { min: [-0.045, -0.12, 0.02], max: [0.045, -0.09, 0.095], cell: 0.0005, tris: 1500, color: toothColor(true) });
  const lo = await meshSDF(teethField(false), { min: [-0.045, -0.125, 0.02], max: [0.045, -0.095, 0.095], cell: 0.0005, tris: 1500, color: toothColor(false) });
  const { mergeGeometries } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");
  const teeth = toWorld(mergeGeometries([up, lo])!);
  return { bones, mandible, teeth };
}
