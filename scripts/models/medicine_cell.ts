/**
 * Scene: medicine_cell  (Medicine & Surgery, lesson 1)
 *
 * An animal cell, built to be cut open. Fourteen interactive structures; the
 * mitochondria, Golgi and rough ER are distance-field models with their real
 * internal structure (lib/cellParts.ts).
 *
 * SCALE: organelles are enlarged for legibility, because at true scale a
 * mitochondrion is a speck next to the nucleus. The inspector shows each
 * structure's REAL size, so the student learns both the look and the scale.
 *
 * CUT-AWAY: structures marked `userData.cap` are closed solids. The viewer uses
 * them to draw a flat coloured cross-section where the cut plane passes through
 * (outer solids have a lower `capOrder`, so inner ones paint over them).
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { ellipsoid, group, mat, merge, mesh, tint, tube, V, xf } from "./lib/geo";
import { makeNoise3, rng } from "./lib/math";
import * as cp from "./lib/cellParts";

const rand = rng(7);
/** Paints a whole geometry one colour (vertex colours). */
const tintGeo = (g: THREE.BufferGeometry, c: string) => tint(g, c);
const noise = makeNoise3(11);

/** Even points on a sphere (Fibonacci lattice) */
function fibSphere(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = g * i;
    out.push(V(Math.cos(t) * r, y, Math.sin(t) * r));
  }
  return out;
}

/** Slightly lumpy ellipsoid: used for membranes so they do not look machined */
function lumpyEllipsoid(rx: number, ry: number, rz: number, amp: number, freq: number, seed = 0, w = 72, h = 48) {
  const g = ellipsoid(rx, ry, rz, w, h);
  const p = g.getAttribute("position");
  const v = V();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise(v.x * freq + seed, v.y * freq, v.z * freq);
    const k = 1 + n * amp;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Reverses triangle winding so the surface faces inward (used for the inner wall of a hollow shell). */
function flipped(g: THREE.BufferGeometry) {
  const out = g.index ? g.clone() : g.toNonIndexed();
  const idx = out.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const b = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, b);
  }
  const n = out.getAttribute("normal");
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return out;
}

/** Quaternion that rotates +Z onto `dir` */
const zTo = (dir: THREE.Vector3) => new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir.clone().normalize());

export async function buildCell() {
  const B = new SceneBuild({ sceneId: "medicine_cell", view: [0.38, 0.32, 0.9], fit: 2.5 });

  B.group("envelope", "Boundary", "#e0a595");
  B.group("genetic", "Control centre", "#6d63c9");
  B.group("energy", "Energy", "#d9553f");
  B.group("synthesis", "Making and moving proteins", "#d9a22e");
  B.group("waste", "Recycling", "#8a4fa6");
  B.group("structure", "Shape and transport", "#2f8d80");

  const RX = 1.35, RY = 1.05, RZ = 1.15;
  const NUC = V(-0.15, 0.08, 0.0);
  const NUC_R = 0.42;

  // ---------------------------------------------------------------- membrane
  // Outer shell. A lumpy translucent ellipsoid with protein channels studded in.
  {
    const shell = lumpyEllipsoid(RX, RY, RZ, 0.03, 1.6);
    const studs: THREE.BufferGeometry[] = [shell];
    // Embedded proteins: short capsules poking through the lipid layer
    for (const d of fibSphere(120)) {
      const pos = d.clone().multiply(V(RX, RY, RZ)).multiplyScalar(1.005);
      const c = new THREE.CapsuleGeometry(0.016, 0.03, 3, 8);
      c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d));
      c.translate(pos.x, pos.y, pos.z);
      studs.push(c);
    }
    const m = mesh(merge(studs), mat({ color: "#f2c5b6", rough: 0.35, opacity: 0.3 }), "membrane_geo");
    // The membrane is a thin wall, so its cut face must be a RING, not a disc.
    // A closed ellipsoid would cap the whole section. Instead an invisible hollow
    // proxy (outer wall + inward-facing inner wall) carries the cap: the stencil
    // count is non-zero only inside the wall, so only the ring is painted.
    // Same lump parameters as the visible shell so the ring sits exactly on it.
    const wall = mesh(
      merge([lumpyEllipsoid(RX, RY, RZ, 0.03, 1.6, 0, 48, 32), flipped(lumpyEllipsoid(RX * 0.955, RY * 0.955, RZ * 0.955, 0.03, 1.6, 0, 48, 32))]),
      mat({ color: "#e7a493", opacity: 0 }),
      "membrane_wall_proxy",
    );
    wall.userData.proxy = true;
    wall.userData.cap = "#e7a493";
    wall.userData.capOrder = 1;
    B.root.add(B.part(group("x", m, wall), { id: "organelle_cell_membrane", name: "Cell membrane", group: "envelope", shell: true, view: [0.3, 0.2, 1], fit: 2.8 }));
  }

  // --------------------------------------------------------------- cytoplasm
  {
    const jelly = mesh(lumpyEllipsoid(RX * 0.965, RY * 0.965, RZ * 0.965, 0.02, 1.4, 5), mat({ color: "#bfe1e6", rough: 0.25, opacity: 0.16 }), "cytoplasm_geo");
    jelly.userData.cap = "#8fbfca";
    jelly.userData.capOrder = 2;
    // See-through cap: the cytoplasm fills the whole section, so an opaque cap would hide every organelle behind the cut.
    jelly.userData.capOpacity = 0.2;
    B.root.add(B.part(group("x", jelly), { id: "organelle_cytoplasm", name: "Cytoplasm", group: "envelope", shell: true, anchor: [-0.95, -0.45, 0.62], view: [0.2, 0.25, 1], fit: 2.8 }));
  }

  // ----------------------------------------------------------------- nucleus
  {
    const env = mesh(ellipsoid(NUC_R, NUC_R, NUC_R, 56, 40), mat({ color: "#8f86e0", rough: 0.4, opacity: 0.55 }), "nuc_envelope");
    env.userData.cap = "#bdb6f0";
    env.userData.capOrder = 3;
    // Nuclear pores: small rings poking through the envelope
    const pores: THREE.BufferGeometry[] = [];
    for (const d of fibSphere(70)) {
      const t = new THREE.TorusGeometry(0.03, 0.0085, 6, 14);
      t.applyQuaternion(zTo(d));
      const p = d.clone().multiplyScalar(NUC_R * 1.004);
      t.translate(p.x, p.y, p.z);
      pores.push(t);
    }
    const poreM = mesh(merge(pores), mat({ color: "#4f46a8", rough: 0.5 }), "nuc_pores");
    // Chromatin: a tangle of fibre loops inside
    const fibres: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const pts: THREE.Vector3[] = [];
      let c = V((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4);
      for (let k = 0; k < 9; k++) {
        pts.push(c.clone());
        c = c.add(V((rand() - 0.5) * 0.22, (rand() - 0.5) * 0.22, (rand() - 0.5) * 0.22));
        if (c.length() > NUC_R * 0.82) c.multiplyScalar((NUC_R * 0.82) / c.length());
      }
      fibres.push(tube(pts, 0.0085, { radial: 5, segments: 30 }));
    }
    const chrom = mesh(merge(fibres), mat({ color: "#463d96", rough: 0.6 }), "nuc_chromatin");
    const g = group("x", env, poreM, chrom);
    g.position.copy(NUC);
    B.root.add(B.part(g, { id: "organelle_nucleus", name: "Nucleus", group: "genetic", view: [0.3, 0.25, 1], fit: 2.2 }));

    const nucleolus = mesh(ellipsoid(0.115, 0.115, 0.115, 32, 22), mat({ color: "#3d3484", rough: 0.55 }), "nucleolus_geo");
    nucleolus.userData.cap = "#4a4096";
    nucleolus.userData.capOrder = 4;
    const ng = group("x", nucleolus);
    ng.position.copy(NUC).add(V(0.07, 0.05, 0.12));
    B.root.add(B.part(ng, { id: "organelle_nucleolus", name: "Nucleolus", group: "genetic", view: [0.25, 0.2, 1], fit: 1.7 }));
  }

  // ------------------------------------------------------------- rough ER
  // Ruffled sheets wrapping the back-right of the nucleus, joined by bridges (the
  // ER is one continuous membrane, continuous with the nuclear envelope), with
  // ribosomes studding the outer faces. See lib/cellParts.ts.
  {
    const er = await cp.roughER([NUC.x, NUC.y, NUC.z], NUC_R);
    const sheetM = mesh(er.sheets, mat({ color: "#ffffff", rough: 0.5 }), "rer_sheets");
    sheetM.userData.cap = "#f2d37f";
    sheetM.userData.capOrder = 5;
    const dotM = mesh(er.ribosomes, mat({ color: "#3a5f78", rough: 0.6 }), "rer_ribosomes");
    B.root.add(B.part(group("x", sheetM, dotM), { id: "organelle_rough_er", name: "Rough endoplasmic reticulum", group: "synthesis", view: [0.35, 0.2, 1], fit: 2.1 }));
  }

  // ----------------------------------------------------------- smooth ER
  {
    const tubes: THREE.BufferGeometry[] = [];
    const start = NUC.clone().add(V(0.5, -0.3, 0.18));
    for (let i = 0; i < 9; i++) {
      const pts: THREE.Vector3[] = [];
      let c = start.clone().add(V((rand() - 0.5) * 0.12, (rand() - 0.5) * 0.12, (rand() - 0.5) * 0.12));
      let dir = V(0.7, -0.35, 0.1).add(V((rand() - 0.5) * 0.7, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.7)).normalize();
      for (let k = 0; k < 8; k++) {
        pts.push(c.clone());
        dir = dir.add(V((rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9)).normalize();
        c = c.addScaledVector(dir, 0.1);
        // keep inside the cell
        const e = (c.x / (RX * 0.9)) ** 2 + (c.y / (RY * 0.9)) ** 2 + (c.z / (RZ * 0.9)) ** 2;
        if (e > 1) c.multiplyScalar(1 / Math.sqrt(e));
      }
      tubes.push(tube(pts, 0.021, { radial: 7, segments: 36 }));
    }
    B.root.add(B.part(group("x", mesh(merge(tubes), mat({ color: "#e8a25a", rough: 0.45 }), "ser_geo")), { id: "organelle_smooth_er", name: "Smooth endoplasmic reticulum", group: "synthesis", view: [0.5, 0.2, 1], fit: 2.3 }));
  }

  // ------------------------------------------------------------- Golgi
  {
    const gm = mesh(await cp.golgi(), mat({ color: "#ffffff", rough: 0.4 }), "golgi_stack");
    gm.userData.cap = "#f1a9b6";
    gm.userData.capOrder = 5;
    const g = group("x", gm);
    g.position.set(0.58, -0.14, 0.45);
    g.rotation.set(0.5, 0.3, -0.55);
    B.root.add(B.part(g, { id: "organelle_golgi_apparatus", name: "Golgi apparatus", group: "synthesis", view: [0.4, 0.3, 1], fit: 2.0 }));
  }

  // ----------------------------------------------------- mitochondria (x10)
  // Three are shown sliced open lengthwise so the cristae (the folded inner
  // membrane where ATP is made) can be seen; the rest are whole.
  {
    type Place = { p: [number, number, number]; r: [number, number, number]; s?: number };
    const open: Place[] = [
      { p: [0.78, -0.5, -0.3], r: [0.55, 0.6, 0.35] },
      { p: [-0.86, -0.34, 0.46], r: [0.6, 0.2, -0.5] },
      { p: [0.12, -0.6, 0.66], r: [0.75, -0.4, 0.1], s: 0.95 },
    ];
    const closed: Place[] = [
      { p: [0.3, 0.64, -0.55], r: [0, -0.3, 0.9] },
      { p: [-0.9, 0.5, -0.4], r: [0.2, 0.5, 0.3] },
      { p: [0.98, 0.1, -0.2], r: [0.1, 0.2, 1.3], s: 0.9 },
      { p: [-0.5, -0.7, -0.35], r: [0.3, 1.2, 0.2] },
      { p: [0.62, 0.56, 0.32], r: [0.4, 0.8, -0.3], s: 0.85 },
      { p: [-0.5, 0.64, 0.55], r: [0.1, -0.7, 0.2], s: 0.9 },
      { p: [1.0, -0.25, 0.38], r: [0.2, -0.5, 0.6], s: 0.8 },
    ];
    const geo = merge([cp.placeCopies(await cp.mitochondrion(true), open), cp.placeCopies(await cp.mitochondrion(false), closed)]);
    const mm = mesh(geo, mat({ color: "#ffffff", rough: 0.45 }), "mito_geo");
    mm.userData.cap = "#e8826a";
    mm.userData.capOrder = 5;
    B.root.add(B.part(group("x", mm), { id: "organelle_mitochondrion", name: "Mitochondrion", group: "energy", anchor: [0.78, -0.5, -0.3], view: [0.2, 0.5, 1], fit: 2.0 }));
  }

  // ------------------------------------------------------- peroxisomes
  {
    const places = ([[-0.35, -0.55, 0.45], [0.42, 0.3, -0.7], [-0.95, 0.05, 0.42], [0.25, 0.78, 0.2], [-0.3, 0.55, -0.75], [0.9, -0.48, 0.1]] as Array<[number, number, number]>).map((p, i) => ({ p, r: [i, i * 0.7, 0] as [number, number, number], s: 0.85 + (i % 3) * 0.12 }));
    const shellM = mesh(cp.placeCopies(await cp.peroxisome(), places), mat({ color: "#ffffff", rough: 0.35, opacity: 0.55 }), "perox_shell");
    shellM.userData.cap = "#a8dc9b";
    shellM.userData.capOrder = 5;
    const coreM = mesh(cp.placeCopies(await cp.peroxisomeCore(), places), mat({ color: "#ffffff", rough: 0.5 }), "perox_core");
    B.root.add(B.part(group("x", shellM, coreM), { id: "organelle_peroxisome", name: "Peroxisomes", group: "waste", anchor: [-0.35, -0.55, 0.45], view: [0.1, 0.4, 1], fit: 3.0 }));
  }

  // ------------------------------------------------------------ vesicles
  // Transport vesicles between the ER, the Golgi and the membrane, and two caught
  // in the act of fusing with the membrane to release their contents (exocytosis).
  {
    const free: Array<{ p: [number, number, number]; r: [number, number, number]; s: number }> = [];
    const spots: Array<[number, number, number]> = [[0.42, 0.06, 0.48], [0.5, -0.32, 0.62], [0.8, -0.05, 0.6], [0.72, 0.2, 0.55], [0.9, -0.3, 0.55], [0.35, -0.3, 0.75], [1.05, 0.0, 0.42], [0.62, -0.42, 0.75], [0.2, 0.15, 0.62], [0.95, 0.25, 0.3]];
    spots.forEach((p, i) => free.push({ p, r: [0, 0, 0], s: 0.022 + (i % 3) * 0.006 }));
    const ball = new THREE.IcosahedronGeometry(1, 2);
    ball.deleteAttribute("uv");
    const balls = merge(free.map((f) => { const b = ball.clone(); b.scale(f.s, f.s, f.s); b.translate(...f.p); return b; }));
    tintGeo(balls, "#f0a3ae");
    // Fusing vesicles: placed on the membrane, local +y along the outward normal
    const onMembrane = (d: THREE.Vector3) => {
      const n = V(d.x / (RX * RX), d.y / (RY * RY), d.z / (RZ * RZ)).normalize();
      const k = 1 / Math.sqrt((d.x / RX) ** 2 + (d.y / RY) ** 2 + (d.z / RZ) ** 2);
      const p = d.clone().multiplyScalar(k * 0.985);
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
      const e = new THREE.Euler().setFromQuaternion(q);
      return { p: [p.x, p.y, p.z] as [number, number, number], r: [e.x, e.y, e.z] as [number, number, number] };
    };
    const fusing = cp.placeCopies(await cp.fusingVesicle(), [onMembrane(V(0.9, -0.1, 0.75).normalize()), onMembrane(V(0.6, -0.5, 0.8).normalize())]);
    const vm = mesh(merge([balls, fusing]), mat({ color: "#ffffff", rough: 0.4 }), "vesicles_geo");
    B.root.add(B.part(group("x", vm), { id: "organelle_vesicle", name: "Vesicles", group: "synthesis", anchor: [0.8, -0.05, 0.6], view: [0.4, 0.2, 1], fit: 2.6 }));
  }

  // --------------------------------------------------- free ribosomes
  {
    const dots: THREE.BufferGeometry[] = [];
    let placed = 0;
    while (placed < 150) {
      const p = V((rand() * 2 - 1) * RX * 0.88, (rand() * 2 - 1) * RY * 0.88, (rand() * 2 - 1) * RZ * 0.88);
      const e = (p.x / (RX * 0.9)) ** 2 + (p.y / (RY * 0.9)) ** 2 + (p.z / (RZ * 0.9)) ** 2;
      if (e > 1 || p.distanceTo(NUC) < NUC_R + 0.22) continue;
      const s = new THREE.SphereGeometry(0.0135, 6, 5);
      s.translate(p.x, p.y, p.z);
      dots.push(s);
      placed++;
    }
    B.root.add(B.part(group("x", mesh(merge(dots), mat({ color: "#2f6f8f", rough: 0.55 }), "ribosome_geo")), { id: "organelle_ribosome", name: "Ribosomes", group: "synthesis", anchor: [0.55, 0.38, 0.55], view: [0.2, 0.3, 1], fit: 3.4 }));
  }

  // --------------------------------------------------------- lysosomes
  {
    const spheres: THREE.BufferGeometry[] = [];
    for (const [x, y, z] of [[-0.42, -0.66, -0.3], [0.2, -0.72, 0.32], [-0.62, 0.66, 0.22], [0.58, 0.52, 0.12], [-0.2, -0.5, 0.7], [0.88, 0.45, -0.3], [-1.0, -0.3, -0.2]]) {
      const g = new THREE.IcosahedronGeometry(0.056, 2);
      const p = g.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const v = V(p.getX(i), p.getY(i), p.getZ(i));
        const k = 1 + noise(v.x * 40 + x * 9, v.y * 40, v.z * 40) * 0.05;
        p.setXYZ(i, v.x * k, v.y * k, v.z * k);
      }
      g.computeVertexNormals();
      g.translate(x, y, z);
      spheres.push(g);
    }
    const m = mesh(merge(spheres), mat({ color: "#9a58b8", rough: 0.35 }), "lysosome_geo");
    m.userData.cap = "#b88bd0";
    m.userData.capOrder = 5;
    B.root.add(B.part(group("x", m), { id: "organelle_lysosome", name: "Lysosome", group: "waste", anchor: [0.2, -0.72, 0.32], view: [0.1, 0.5, 1], fit: 3.0 }));
  }

  // --------------------------------------------------------- centrosome
  {
    const parts: THREE.BufferGeometry[] = [];
    // Each centriole = 9 microtubule triplets arranged in a ring
    const centriole = () => {
      const bits: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const c = new THREE.CylinderGeometry(0.0085, 0.0085, 0.15, 6);
        c.translate(Math.cos(a) * 0.034, 0, Math.sin(a) * 0.034);
        bits.push(c);
      }
      return merge(bits);
    };
    const c1 = centriole();
    const c2 = centriole();
    c2.rotateZ(Math.PI / 2);
    c2.translate(0.03, -0.09, 0);
    parts.push(c1, c2);
    const cloud = mesh(ellipsoid(0.12, 0.12, 0.12, 20, 14), mat({ color: "#6fc4b6", rough: 0.4, opacity: 0.22 }), "centro_cloud");
    const core = mesh(merge(parts), mat({ color: "#1f7a6d", rough: 0.45 }), "centrioles");
    const g = group("x", cloud, core);
    g.position.set(-0.78, 0.0, -0.05);
    B.root.add(B.part(g, { id: "organelle_centrosome", name: "Centrosome", group: "structure", view: [0.3, 0.3, 1], fit: 2.0 }));
  }

  // ------------------------------------------------------ cytoskeleton
  {
    const fibres: THREE.BufferGeometry[] = [];
    const origin = V(-0.78, 0.0, -0.05);
    for (const d of fibSphere(34)) {
      const end = d.clone().multiply(V(RX * 0.93, RY * 0.93, RZ * 0.93));
      const mid = origin.clone().lerp(end, 0.5).add(V((rand() - 0.5) * 0.25, (rand() - 0.5) * 0.25, (rand() - 0.5) * 0.25));
      fibres.push(tube([origin.clone(), mid, end], 0.0075, { radial: 5, segments: 18 }));
    }
    B.root.add(B.part(group("x", mesh(merge(fibres), mat({ color: "#566a8e", rough: 0.5 }), "cytoskeleton_geo")), { id: "organelle_cytoskeleton", name: "Cytoskeleton", group: "structure", anchor: [-1.05, 0.55, 0.2], view: [0.0, 0.3, 1], fit: 3.4 }));
  }

  void tint; void xf; // helpers kept imported for sibling scenes
  return B.write("public/models");
}

if (require.main === module) buildCell().then((r) => console.log(JSON.stringify(r)));
