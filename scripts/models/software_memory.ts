/**
 * Scenes: software_memory (a RAM module) and software_dram_cell (a zoomed-in slice
 * of a DRAM chip). Software Engineering, lesson 2.
 *
 * The module is drawn standing up, front face toward the viewer: green board,
 * eight black DRAM chips, a power-management chip, a small identification chip
 * (SPD), and the gold contact edge with its key notch. The notch is off-centre so
 * the module only fits one way round, which is part of what the card explains.
 *
 * The cell scene is the "Zoom into a chip" variant: an 8 x 6 patch of the
 * memory array, each cell a transistor plus a capacitor, with the word lines
 * (rows), bit lines (columns) and the sense amplifiers that read them. Charged
 * capacitors are gold (a 1), empty ones grey (a 0).
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { group, mat, merge, mesh, tint, xf } from "./lib/geo";
import { makeNoise3 } from "./lib/math";

const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) =>
  tint(xf(new THREE.BoxGeometry(w, h, d), { p: [x, y + h / 2, z] }), color);
const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, seg = 20) =>
  tint(xf(new THREE.CylinderGeometry(r, r, h, seg), { p: [x, y + h / 2, z] }), color);

export async function buildMemory() {
  const B = new SceneBuild({ sceneId: "software_memory", view: [0.2, 0.3, 1.0], fit: 4.4, partFitScale: 1.4, fov: 30 });
  B.group("module", "Module", "#2f9a6a");
  B.group("chips", "Chips", "#3a3f47");
  B.group("connector", "Connector", "#d9a22e");
  const white = mat({ color: "#ffffff", rough: 0.5 });
  const metal = mat({ color: "#ffffff", rough: 0.32, metal: 0.15 });

  const L = 1.5, H = 0.36, T = 0.04; // module length (x), height (y), thickness (z)

  // PCB with silkscreen marks and a row of passive components
  {
    const p: THREE.BufferGeometry[] = [box(L, H, T, 0, 0, 0, "#23824f")];
    for (let i = 0; i < 16; i++) p.push(box(0.03, 0.012, 0.006, -0.68 + i * 0.09, 0.04, T / 2 + 0.003, "#e8e4dc")); // tick marks
    for (let i = 0; i < 12; i++) p.push(box(0.025, 0.012, 0.012, -0.62 + i * 0.11, 0.075, T / 2 + 0.006, "#b8bec6")); // resistors/caps
    B.root.add(B.part(group("x", mesh(merge(p), white, "pcb_geo")), { id: "mem_module", name: "Memory module", group: "module", anchor: [0.62, 0.3, T], view: [0.4, 0.2, 1.0], fit: 2.8 }));
  }
  // Eight DRAM chips on the front face
  {
    const p: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      const x = -0.55 + i * 0.145 + (i >= 4 ? 0.12 : 0);
      p.push(box(0.11, 0.17, 0.016, x, 0.12, T / 2 + 0.008 - 0.008, "#15171b"), box(0.07, 0.009, 0.017, x, 0.2, T / 2 + 0.008, "#2a2e34"));
    }
    B.root.add(B.part(group("x", mesh(merge(p), white, "dram_geo")), { id: "mem_dram_chips", name: "DRAM chips", group: "chips", anchor: [-0.1, 0.25, T], view: [0.3, 0.1, 1.0], fit: 2.2 }));
  }
  // Power-management chip and SPD identification chip
  {
    B.root.add(B.part(group("x", mesh(merge([box(0.1, 0.09, 0.016, 0.42, 0.14, T / 2, "#2a3550"), box(0.05, 0.05, 0.012, 0.42, 0.16, T / 2 + 0.014, "#7f9bd8")]), white, "pmic_geo")), { id: "mem_pmic", name: "Power management chip", group: "chips", anchor: [0.42, 0.27, T], view: [0.2, 0.2, 1.0], fit: 1.6 }));
    B.root.add(B.part(group("x", mesh(merge([box(0.06, 0.05, 0.014, 0.58, 0.14, T / 2, "#1d1f24")]), white, "spd_geo")), { id: "mem_spd", name: "SPD chip", group: "chips", anchor: [0.58, 0.22, T], view: [0.2, 0.2, 1.0], fit: 1.5 }));
  }
  // Gold contacts along the bottom edge, with the key notch gap
  {
    const p: THREE.BufferGeometry[] = [];
    const notchX = 0.3;
    for (let i = 0; i < 60; i++) {
      const x = -0.72 + i * 0.024;
      if (Math.abs(x - notchX) < 0.03) continue;
      p.push(box(0.014, 0.05, 0.002, x, 0.002, T / 2 + 0.001, "#d9b24c"), box(0.014, 0.05, 0.002, x, 0.002, -T / 2 - 0.001, "#d9b24c"));
    }
    B.root.add(B.part(group("x", mesh(merge(p), metal, "contacts_geo")), { id: "mem_contacts", name: "Gold contacts", group: "connector", anchor: [-0.4, 0.03, T], view: [0.1, -0.4, 1.0], fit: 2.0 }));
  }
  await B.write("public/models");

  // ====================== DRAM cell patch ======================
  const C = new SceneBuild({ sceneId: "software_dram_cell", view: [0.55, 0.75, 1.0], fit: 3.0, partFitScale: 1.0, fov: 30 });
  C.group("storage", "Storage", "#d9a22e");
  C.group("access", "Access", "#4f73d8");
  C.group("sense", "Sensing", "#2f9a6a");
  const nx = 8, nz = 6, pitch = 0.3;
  const noise = makeNoise3(5);
  const x0 = -((nx - 1) * pitch) / 2, z0 = -((nz - 1) * pitch) / 2;

  const base = mesh(merge([box(nx * pitch + 0.4, 0.06, nz * pitch + 0.9, 0, -0.06, 0.25, "#8d96a6")]), white, "silicon_geo");
  C.root.add(C.part(group("x", base), { id: "cell_silicon", name: "Silicon base", decor: true }));

  const caps: THREE.BufferGeometry[] = [];
  const trs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = x0 + i * pitch, z = z0 + j * pitch;
    const charged = noise(i * 1.7, j * 1.7, 3) > 0;
    caps.push(cyl(0.085, 0.34, x, 0.1, z, charged ? "#f2b632" : "#aeb6c4", 18));
    trs.push(box(0.16, 0.1, 0.16, x, 0, z, "#3a5fc4"));
  }
  C.root.add(C.part(group("x", mesh(merge(caps), white, "caps_geo")), { id: "cell_capacitor", name: "Capacitor", group: "storage", anchor: [x0 + pitch * 2, 0.45, z0 + pitch], view: [0.4, 0.6, 1.0], fit: 2.2 }));
  C.root.add(C.part(group("x", mesh(merge(trs), white, "trs_geo")), { id: "cell_transistor", name: "Access transistor", group: "access", anchor: [x0 + pitch * 4, 0.06, z0 + pitch * 3], view: [0.4, 1.0, 0.8], fit: 2.2 }));

  const wl: THREE.BufferGeometry[] = [];
  for (let j = 0; j < nz; j++) wl.push(box(nx * pitch + 0.1, 0.03, 0.04, 0, 0.045, z0 + j * pitch, "#6f8ff0"));
  C.root.add(C.part(group("x", mesh(merge(wl), white, "wl_geo")), { id: "cell_wordline", name: "Word line", group: "access", anchor: [x0 - 0.15, 0.1, z0 + pitch * 2], view: [0.8, 0.5, 1.0], fit: 2.2 }));

  const bl: THREE.BufferGeometry[] = [];
  for (let i = 0; i < nx; i++) bl.push(box(0.04, 0.03, nz * pitch + 0.5, x0 + i * pitch, -0.01, 0.12, "#e4532b"));
  C.root.add(C.part(group("x", mesh(merge(bl), white, "bl_geo")), { id: "cell_bitline", name: "Bit line", group: "sense", anchor: [x0 + pitch * 5, 0.01, z0 + pitch * 3 + 0.05], view: [0.4, 1.0, 1.0], fit: 2.2 }));

  const sa: THREE.BufferGeometry[] = [];
  for (let i = 0; i < nx; i++) sa.push(box(0.2, 0.09, 0.2, x0 + i * pitch, 0, z0 + nz * pitch + 0.2, "#1f7a54"));
  C.root.add(C.part(group("x", mesh(merge(sa), white, "sa_geo")), { id: "cell_sense_amp", name: "Sense amplifier", group: "sense", anchor: [x0 + pitch * 3, 0.1, z0 + nz * pitch + 0.2], view: [0.3, 0.9, 1.0], fit: 2.2 }));
  return C.write("public/models");
}

buildMemory().then((r) => console.log(JSON.stringify(r)));
