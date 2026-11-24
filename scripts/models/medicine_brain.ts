/**
 * Scene: medicine_brain  (Medicine & Surgery, lesson 3)
 *
 * The human brain with a folded cortex, split into the regions a student learns
 * first, plus the structures a cut reveals.
 *
 * Interactive parts (20):
 *   frontal / parietal / temporal / occipital lobes, cerebellum; midbrain, pons,
 *   medulla, spinal cord; corpus callosum, lateral ventricles, thalamus,
 *   hypothalamus, pituitary, optic nerves and chiasm, olfactory bulbs,
 *   hippocampus, amygdala, basal ganglia, pineal gland.
 * Everything except the cortex is a distance-field model (lib/brainParts.ts).
 *
 * HOW THE CORTEX IS MADE
 *   1. An evenly triangulated sphere is shaped into a cerebrum (wide, tapered at
 *      both poles, flat underneath, bulging temporal lobes).
 *   2. Every vertex is pushed along its normal by a "groove" field: the zero
 *      level set of 3D noise gives a winding network of sulci, and the central
 *      and lateral sulci are cut in as deliberate, deeper fissures.
 *   3. Triangles are sorted into lobes by where they lie relative to those two
 *      sulci and the occipital boundary, so the lobe edges follow the folds.
 *
 * SCALE: units are decimetres (brain length is about 1.67). The inspector cards
 * carry the real sizes.
 *
 * CUT-AWAY: a parasagittal cut (plane x = +0.07, near the midline, removing the
 * side nearest the viewer). Closed solids carry coloured caps: cortex grey ->
 * white matter -> corpus callosum / ventricles / brainstem / cerebellum.
 */
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SceneBuild } from "./lib/export";
import { group, mat, merge, mesh, mirrorX, tint, tube, V } from "./lib/geo";
import { makeNoise3, smoothstep } from "./lib/math";
import * as bp from "./lib/brainParts";

const noise = makeNoise3(41);
const noiseB = makeNoise3(77);
const P = (x: number, y: number, z: number) => V(x, y, z);
const sstep = smoothstep;

// ------------------------------------------------------------ cerebrum shape
const LEN = 0.86; // half length (z)
/** Maps a unit direction to the smooth, un-folded outline of the cerebrum. */
function cerebrumShape(d: THREE.Vector3, scale = 1): THREE.Vector3 {
  const z = LEN * d.z;
  const t = z / LEN; // -1 (occipital pole) .. +1 (frontal pole)
  const wf = 1 - 0.5 * sstep(0.3, 1.0, t) - 0.52 * sstep(0.4, 1.0, -t); // width taper
  const hf = 1 - 0.3 * sstep(0.5, 1.0, t) - 0.32 * sstep(0.5, 1.0, -t); // height taper
  const x = 0.68 * d.x * wf;
  let y = (d.y > 0 ? 0.5 * d.y : 0.3 * d.y) * hf;
  // Temporal lobes bulge down and out on each side
  const lateral = sstep(0.35, 0.85, Math.abs(d.x));
  if (d.y < 0) y -= 0.19 * Math.exp(-(((z - 0.12) / 0.3) ** 2)) * lateral * -d.y * 1.4;
  // Frontal lobes overhang the front of the temporal lobes
  y += 0.04 * sstep(0.45, 0.8, t) * (1 - sstep(-0.25, 0.1, d.y)); // smooth in d.y: a hard `if` here creased the surface
  // Longitudinal fissure: the groove down the midline that separates the hemispheres
  if (d.y > 0) y -= 0.075 * Math.exp(-((x / 0.028) ** 2)) * d.y;
  return P(x * scale, y * scale, z * scale);
}

// Lobe boundaries, in the un-folded shape's coordinates.
/** Central sulcus: z position as a function of height (it slants forward going down). */
const centralZ = (y: number) => -0.02 + (0.46 - y) * 0.5;
/** Lateral (Sylvian) sulcus: height as a function of z (it rises going back). */
const lateralY = (z: number) => 0.0 - 0.26 * z;
type Lobe = "frontal" | "parietal" | "temporal" | "occipital";
function lobeOf(p: THREE.Vector3): Lobe {
  const { x, y, z } = p;
  const ax = Math.abs(x);
  if (y < lateralY(z) && ax > 0.08 && z > -0.62) return "temporal";
  if (z < -0.46) return "occipital";
  if (z > centralZ(y)) return "frontal";
  return "parietal";
}

const LOBE_COLOR: Record<Lobe, string> = { frontal: "#e6b86a", parietal: "#8fc7a6", temporal: "#82a9de", occipital: "#c995cf" };

/** Keeps only the listed triangles and compacts the vertex buffers. */
function subset(src: THREE.BufferGeometry, tris: number[]) {
  const index = src.index!;
  const remap = new Map<number, number>();
  const attrs = ["position", "normal", "color"].map((n) => src.getAttribute(n));
  const out = attrs.map((a) => ({ itemSize: a.itemSize, arr: [] as number[] }));
  const idx: number[] = [];
  for (const t of tris) {
    for (let k = 0; k < 3; k++) {
      const v = index.getX(t * 3 + k);
      let n = remap.get(v);
      if (n === undefined) {
        n = remap.size;
        remap.set(v, n);
        attrs.forEach((a, i) => {
          for (let c = 0; c < a.itemSize; c++) out[i].arr.push(a.array[v * a.itemSize + c]);
        });
      }
      idx.push(n);
    }
  }
  const g = new THREE.BufferGeometry();
  ["position", "normal", "color"].forEach((n, i) => g.setAttribute(n, new THREE.Float32BufferAttribute(out[i].arr, out[i].itemSize)));
  g.setIndex(idx);
  return g;
}

/** Builds the folded cerebrum and returns one geometry per lobe. */
function buildCortex(detail = 60) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g, 1e-4);
  const pos = g.getAttribute("position");
  const n = pos.count;

  // 1. Smooth outline
  const base: THREE.Vector3[] = [];
  const dir = V();
  for (let i = 0; i < n; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    const p = cerebrumShape(dir);
    base.push(p);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  const nor = g.getAttribute("normal");

  // 2. Folds: displace along the normal by a groove field, and shade the sulci darker
  const colors = new Float32Array(n * 3);
  const lobeOfVertex: Lobe[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const p = base[i];
    // Winding sulci: narrow grooves along the zero level set of noise, in two octaves
    // Domain-warp the sample point so the folds wander like real gyri instead of a uniform mesh
    const wx = p.x + 0.09 * noiseB(p.x * 2.2, p.y * 2.2, p.z * 2.2);
    const wy = p.y + 0.09 * noiseB(p.x * 2.2 + 9, p.y * 2.2, p.z * 2.2);
    const wz = p.z + 0.09 * noiseB(p.x * 2.2, p.y * 2.2 + 5, p.z * 2.2);
    const n1 = noise(wx * 3.9, wy * 3.9, wz * 3.9);
    const n2 = noiseB(wx * 7.2 + 3, wy * 7.2, wz * 7.2);
    // Wide smooth transitions give rounded gyri crowns and V-shaped sulci
    const g1 = 1 - sstep(0.0, 0.15, Math.abs(n1));
    const g2 = (1 - sstep(0.0, 0.14, Math.abs(n2))) * 0.4;
    let groove = Math.max(g1, g2 * (1 - g1));
    // Deliberate fissures: the central sulcus and the lateral (Sylvian) sulcus
    const lat = Math.abs(p.x);
    const central = p.y > 0.04 ? Math.exp(-(((p.z - centralZ(p.y)) / 0.017) ** 2)) * sstep(0.04, 0.2, p.y) * (lat > 0.04 ? 1 : 0) : 0;
    const sylvian = Math.exp(-(((p.y - lateralY(p.z)) / 0.024) ** 2)) * sstep(0.2, 0.34, lat) * sstep(-0.5, -0.3, p.z) * (p.z < 0.5 ? 1 : 0);
    groove = Math.min(1, groove + central * 1.1 + sylvian * 1.1);
    const depth = -0.04 * groove + 0.006 * (1 - groove);
    pos.setXYZ(i, p.x + nor.getX(i) * depth, p.y + nor.getY(i) * depth, p.z + nor.getZ(i) * depth);

    const lobe = lobeOf(p);
    lobeOfVertex.push(lobe);
    c.set(LOBE_COLOR[lobe]);
    const shade = 1 - 0.62 * Math.pow(groove, 0.8);
    colors[i * 3] = c.r * shade;
    colors[i * 3 + 1] = c.g * shade;
    colors[i * 3 + 2] = c.b * shade;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();

  // 3. Sort triangles into lobes (by the lobe of their first vertex's un-folded position, majority vote)
  const idx = g.index!;
  const tris: Record<Lobe, number[]> = { frontal: [], parietal: [], temporal: [], occipital: [] };
  for (let t = 0; t < idx.count / 3; t++) {
    const votes: Record<string, number> = {};
    for (let k = 0; k < 3; k++) {
      const l = lobeOfVertex[idx.getX(t * 3 + k)];
      votes[l] = (votes[l] ?? 0) + 1;
    }
    const lobe = (Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] as Lobe) ?? "frontal";
    tris[lobe].push(t);
  }
  return {
    frontal: subset(g, tris.frontal),
    parietal: subset(g, tris.parietal),
    temporal: subset(g, tris.temporal),
    occipital: subset(g, tris.occipital),
  };
}

/** A smooth closed solid with the cerebrum's outline: carries the cut face. */
function cerebrumSolid(scale: number, detail = 14) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g, 1e-4);
  const pos = g.getAttribute("position");
  const d = V();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const p = cerebrumShape(d, scale);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  return g;
}

export async function buildBrain() {
  const B = new SceneBuild({ sceneId: "medicine_brain", view: [1.0, 0.32, 0.4], fit: 3.4, partFitScale: 1.5, fov: 30 });
  B.group("cerebrum", "Cerebrum (lobes)", "#e6b86a");
  B.group("hindbrain", "Hindbrain", "#e0906e");
  B.group("deep", "Deep structures", "#6fa8dc");
  const m = mat({ color: "#ffffff", rough: 0.55 });
  const mWet = mat({ color: "#ffffff", rough: 0.32 });
  const hidden = mat({ color: "#ffffff", opacity: 0 });

  // Cerebrum: one folded surface split into lobes, shared by both hemispheres
  const lobes = buildCortex();
  const lobeSpec: Record<Lobe, { id: string; name: string; anchor: [number, number, number]; view: [number, number, number]; fit: number; side: "left" | "right" }> = {
    frontal: { id: "brain_frontal_lobe", name: "Frontal lobe", anchor: [0.34, 0.36, 0.56], view: [1, 0.35, 0.9], fit: 2.0, side: "left" },
    parietal: { id: "brain_parietal_lobe", name: "Parietal lobe", anchor: [0.34, 0.5, -0.18], view: [1, 0.7, -0.1], fit: 2.0, side: "right" },
    temporal: { id: "brain_temporal_lobe", name: "Temporal lobe", anchor: [0.66, -0.14, 0.05], view: [1, -0.05, 0.3], fit: 2.0, side: "left" },
    occipital: { id: "brain_occipital_lobe", name: "Occipital lobe", anchor: [0.28, 0.14, -0.74], view: [0.6, 0.25, -1], fit: 2.0, side: "right" },
  };
  for (const key of ["frontal", "parietal", "temporal", "occipital"] as const) {
    const s = lobeSpec[key];
    // buildCortex() shapes a whole sphere, so each lobe already spans both hemispheres
    const kids: THREE.Object3D[] = [mesh(lobes[key], mWet, key + "_geo")];
    // The first lobe also carries the invisible solids that paint the cut faces, so
    // the caps vanish together with the cerebrum when an interior part is selected.
    if (key === "frontal") {
      const outer = mesh(cerebrumSolid(1.0), hidden, "cortex_cap_proxy");
      outer.userData.proxy = true;
      outer.userData.cap = "#b8837e"; // cortex: grey matter
      outer.userData.capOrder = 1;
      const core = mesh(cerebrumSolid(0.9), hidden, "white_matter_cap_proxy");
      core.userData.proxy = true;
      core.userData.cap = "#efdcc0"; // white matter
      core.userData.capOrder = 2;
      kids.push(outer, core);
    }
    B.root.add(B.part(group("x", ...kids), { id: s.id, name: s.name, group: "cerebrum", shell: true, anchor: s.anchor, view: s.view, fit: s.fit }));
  }

  // Cerebellum: two hemispheres and the vermis, folded into folia
  {
    const cb = mesh(await bp.cerebellum(), m, "cerebellum_geo");
    cb.userData.cap = "#d7ad98";
    cb.userData.capOrder = 3;
    B.root.add(B.part(group("x", cb), { id: "brain_cerebellum", name: "Cerebellum", group: "hindbrain", anchor: [0.3, -0.33, -0.72], view: [0.9, 0.1, -0.8], fit: 2.0 }));
  }

  // Brainstem: midbrain, pons, medulla, then the spinal cord
  const addSolid = (g: THREE.BufferGeometry, id: string, name: string, grp: string, cap: string, o: { anchor: [number, number, number]; view: [number, number, number]; fit?: number; wet?: boolean }) => {
    const me = mesh(g, o.wet ? mWet : m, id + "_geo");
    me.userData.cap = cap;
    me.userData.capOrder = 4;
    B.root.add(B.part(group("x", me), { id, name, group: grp, anchor: o.anchor, view: o.view, fit: o.fit ?? 1.6 }));
  };
  addSolid(await bp.midbrain(), "brain_midbrain", "Midbrain", "hindbrain", "#a99be0", { anchor: [0.12, -0.04, 0.15], view: [1, 0.1, 0.6] });
  addSolid(await bp.pons(), "brain_pons", "Pons", "hindbrain", "#a99be0", { anchor: [0.1, -0.27, 0.2], view: [0.8, -0.1, 1] });
  addSolid(await bp.medulla(), "brain_medulla", "Medulla oblongata", "hindbrain", "#a99be0", { anchor: [0.07, -0.47, 0.09], view: [0.8, -0.1, 1] });
  addSolid(await bp.spinalCord(), "brain_spinal_cord", "Spinal cord", "hindbrain", "#e6e2f4", { anchor: [0.06, -0.8, -0.13], view: [1, -0.2, 0.6] });

  // Deep and basal structures
  addSolid(await bp.thalamus(), "brain_thalamus", "Thalamus", "deep", "#7f9be8", { anchor: [0.12, 0.09, -0.02], view: [1, 0.3, 0.2] });
  addSolid(await bp.hypothalamus(), "brain_hypothalamus", "Hypothalamus", "deep", "#b58fe0", { anchor: [0.05, -0.1, 0.19], view: [1, -0.2, 0.8] });
  addSolid(await bp.pituitary(), "brain_pituitary", "Pituitary gland", "deep", "#e57fb8", { anchor: [0.04, -0.31, 0.22], view: [1, -0.3, 0.9], fit: 1.3 });
  addSolid(await bp.opticPathway(), "brain_optic", "Optic nerves and chiasm", "deep", "#f6efcf", { anchor: [0.12, -0.2, 0.42], view: [0.6, -1, 0.5] });
  addSolid(await bp.olfactory(), "brain_olfactory", "Olfactory bulbs", "deep", "#f6ecc8", { anchor: [0.06, -0.21, 0.6], view: [0.5, -1, 0.7], fit: 1.3 });
  addSolid(await bp.hippocampus(), "brain_hippocampus", "Hippocampus", "deep", "#e5786c", { anchor: [0.29, -0.12, -0.04], view: [1, 0.2, 0.2], wet: true });
  addSolid(await bp.amygdala(), "brain_amygdala", "Amygdala", "deep", "#ee9a52", { anchor: [0.3, -0.17, 0.24], view: [1, 0, 0.6], fit: 1.3 });
  addSolid(await bp.basalGanglia(), "brain_basal_ganglia", "Basal ganglia", "deep", "#4fb596", { anchor: [0.22, 0.05, 0.12], view: [1, 0.3, 0.5] });
  addSolid(await bp.pineal(), "brain_pineal", "Pineal gland", "deep", "#c9a63c", { anchor: [0.02, 0.01, -0.16], view: [0.6, 0.4, -1], fit: 1.2 });

  // Corpus callosum: the broad C-shaped band of fibres joining the two hemispheres
  {
    const arch = [P(0, 0.12, 0.4), P(0, 0.27, 0.34), P(0, 0.34, 0.14), P(0, 0.35, -0.12), P(0, 0.29, -0.32), P(0, 0.17, -0.44)];
    const band = tube(arch, (t) => 0.026 + 0.022 * Math.exp(-(((t - 0.0) / 0.12) ** 2)) + 0.034 * Math.exp(-(((t - 1.0) / 0.1) ** 2)), { radial: 18, segments: 40 });
    band.scale(9, 1, 1); // flatten the tube into a wide ribbon across the midline
    const cc = mesh(tint(band, "#f6f1e6"), mWet, "cc_geo");
    cc.userData.cap = "#fffefa";
    cc.userData.capOrder = 4;
    B.root.add(B.part(group("x", cc), { id: "brain_corpus_callosum", name: "Corpus callosum", group: "deep", anchor: [0.07, 0.34, 0.0], view: [1, 0.1, 0.1], fit: 2.2 }));
  }

  // Lateral ventricles: fluid-filled C-shaped chambers, one in each hemisphere
  {
    const horn = [P(0.075, 0.15, 0.36), P(0.085, 0.24, 0.2), P(0.1, 0.27, 0.0), P(0.13, 0.2, -0.2), P(0.18, 0.1, -0.34), P(0.27, -0.08, -0.28), P(0.34, -0.17, -0.1), P(0.37, -0.2, 0.1)];
    const v = tube(horn, (t) => 0.034 + 0.016 * Math.sin(t * Math.PI) - 0.008 * t, { radial: 14, segments: 48 });
    const both = merge([tint(v, "#7db3e8"), tint(mirrorX(v), "#7db3e8")]);
    const vm = mesh(both, mWet, "ventricles_geo");
    vm.userData.cap = "#4a82d8";
    vm.userData.capOrder = 4;
    B.root.add(B.part(group("x", vm), { id: "brain_ventricles", name: "Lateral ventricles", group: "deep", anchor: [0.1, 0.27, 0.0], view: [1, 0.2, 0.2], fit: 2.0 }));
  }

  return B.write("public/models");
}

if (require.main === module) buildBrain().then((r) => console.log(JSON.stringify(r)));
