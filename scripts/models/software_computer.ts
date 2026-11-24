/**
 * Scene: software_computer  (Software Engineering, lesson 1: what makes up a computer)
 *
 * A computer drawn as four stacked layers, lowest first:
 *   hardware (board, CPU, RAM, storage, GPU, network)
 *   firmware (the chip that starts the machine)
 *   operating system (kernel, drivers, file system)
 *   applications (browser, editor, terminal)
 *
 * The stack is separated vertically so every layer can be seen at once. The Peel
 * control in the app removes layers from the top (applications first) to reveal
 * what each one stands on. Colours are per layer, so the layer a part belongs to
 * can be read at a glance.
 *
 * Units are decimetres. The board is 3.2 x 2.4.
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { group, mat, merge, mesh, roundedBox, tint, xf } from "./lib/geo";
import * as textures from "./lib/textures";

const BW = 3.2, BD = 2.4;
const Y = { hw: 0, fw: 0.85, os: 1.7, app: 2.55 };

const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) =>
  tint(xf(new THREE.BoxGeometry(w, h, d), { p: [x, y + h / 2, z] }), color);
const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, color: string) =>
  tint(xf(roundedBox(w, h, d, r, 3), { p: [x, y + h / 2, z] }), color);
/** A cylinder lying along z, centred at (x, y, z). */
const cylZ = (r: number, len: number, x: number, y: number, z: number, color: string) =>
  tint(new THREE.CylinderGeometry(r, r, len, 12).rotateX(Math.PI / 2).translate(x, y, z), color);
const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, seg = 20) =>
  tint(xf(new THREE.CylinderGeometry(r, r, h, seg), { p: [x, y + h / 2, z] }), color);

export async function buildComputer() {
  const B = new SceneBuild({ sceneId: "software_computer", view: [0.75, 0.42, 1.0], fit: 3.4, partFitScale: 1.0, fov: 30 });
  B.group("hardware", "Hardware", "#2f9a6a");
  B.group("firmware", "Firmware", "#e0a23a");
  B.group("os", "Operating system", "#4f73d8");
  B.group("apps", "Applications", "#e4532b");
  // Outermost first: peeling removes applications, then the OS, then firmware.
  B.layer("apps", "Applications", true);
  B.layer("os", "Operating system", true);
  B.layer("firmware", "Firmware", true);
  B.layer("hardware", "Hardware");

  const white = mat({ color: "#ffffff", rough: 0.55 });
  const metal = mat({ color: "#ffffff", rough: 0.3, metal: 0.7 });
  const slabMat = (opacity: number) => mat({ color: "#ffffff", rough: 0.6, opacity });

  const slab = (id: string, y: number, color: string, layer: string) => {
    const m = mesh(tint(xf(roundedBox(BW, 0.07, BD, 0.03, 3), { p: [0, y, 0] }), color), slabMat(layer === "hardware" ? 1 : 0.62), id + "_geo");
    return B.part(group("x", m), { id, name: id, layer, decor: true });
  };

  // ============================ hardware ============================
  // A full-size (ATX-like) motherboard. The board's top surface is a generated
  // texture (traces, vias, silkscreen, mounting holes) laid out to match the parts
  // placed on it below, so the copper buses really run from the socket to the
  // memory slots and the PCIe slot.
  const hwY = Y.hw + 0.035;
  {
    // ---- the board itself, with its texture
    const outlines: Array<[number, number, number, number]> = [
      [-0.92, -0.67, -0.08, 0.17], // socket
      [0.52, -0.8, 0.94, 0.2], // memory slots
      [-0.2, 0.55, 1.1, 0.7], // PCIe x16
      [-0.2, 0.26, 0.15, 0.38], // PCIe x1
      [0.9, 0.15, 1.3, 0.52], // chipset
      [-1.48, 0.72, -0.5, 0.98], // M.2
      [1.34, -0.48, 1.5, 0.08], // 24-pin
      [1.36, 0.35, 1.52, 0.98], // SATA
      [-1.48, -1.15, -1.18, -0.95], // EPS
      [-1.5, 0.15, -1.1, 0.45], // audio
    ];
    const buses: Array<Array<[number, number]>> = [
      [[-0.1, -0.3], [0.3, -0.3], [0.55, -0.3]], // socket -> memory
      [[-0.5, 0.15], [-0.5, 0.45], [0.2, 0.6]], // socket -> PCIe
      [[1.1, 0.33], [0.6, 0.33], [0.3, 0.45]], // chipset uplink
      [[1.28, 0.45], [1.36, 0.6]], // chipset -> SATA
      [[1.0, 0.52], [1.0, 1.05], [-0.3, 1.05], [-0.6, 0.95]], // chipset -> M.2
      [[-1.0, -0.9], [-1.0, -0.4]], // VRM phases
      [[1.15, -0.2], [1.34, -0.2]], // ATX power in
      [[-0.9, 0.3], [-1.1, 0.3]], // audio
    ];
    const holes: Array<[number, number]> = [[-1.48, -1.08], [1.48, -1.08], [-1.48, 1.08], [1.48, 1.08], [-0.5, 1.08], [0.35, -1.08], [-0.5, -1.08]];
    const boardMap = await textures.pcb({ w: BW, d: BD, outlines, buses, holes });
    const board = roundedBox(BW, 0.07, BD, 0.02, 2);
    const pp = board.getAttribute("position"), uv = board.getAttribute("uv");
    for (let i = 0; i < pp.count; i++) uv.setXY(i, (pp.getX(i) + BW / 2) / BW, 1 - (pp.getZ(i) + BD / 2) / BD);
    board.translate(0, Y.hw, 0);
    const boardMesh = mesh(tint(board, "#ffffff"), mat({ color: "#ffffff", rough: 0.45, map: boardMap }), "board_pcb");

    const parts: THREE.BufferGeometry[] = [];
    // Standoff screws in the mounting holes
    for (const [x, z] of holes) parts.push(cyl(0.035, 0.012, x, hwY, z, "#c9ccd1", 14));
    // Small surface-mount parts scattered between the big ones (resistors, capacitors)
    let sd = 11;
    const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const free = (x: number, z: number) => !outlines.some(([x0, z0, x1, z1]) => x > x0 - 0.05 && x < x1 + 0.05 && z > z0 - 0.05 && z < z1 + 0.05) && Math.hypot(x + 0.5, z + 0.25) > 0.65;
    for (let i = 0, n = 0; i < 2000 && n < 170; i++) {
      const x = (rnd() - 0.5) * (BW - 0.2), z = (rnd() - 0.5) * (BD - 0.2);
      if (!free(x, z)) continue;
      const big = rnd() < 0.15;
      const r = rnd() < 0.5;
      parts.push(box(big ? 0.06 : 0.03, 0.012, big ? 0.05 : 0.015, r ? x : x, hwY, z, big ? "#20242a" : rnd() < 0.5 ? "#b48b55" : "#2e3237"));
      n++;
    }
    // A few small chips (super I/O, clock, controllers)
    for (const [x, z, w] of [[0.15, -0.95, 0.16], [-0.1, 0.1, 0.12], [1.2, 0.95, 0.14], [-1.3, 0.3, 0.12], [0.3, 1.0, 0.13]] as Array<[number, number, number]>) {
      parts.push(box(w, 0.02, w, x, hwY, z, "#1b1e23"));
      parts.push(box(w * 0.3, 0.003, w * 0.3, x - w * 0.25, hwY + 0.02, z - w * 0.25, "#3b4048"));
    }
    // Audio: codec chip, gold-ish audio capacitors
    parts.push(box(0.12, 0.02, 0.12, -1.3, hwY, 0.25, "#1b1e23"));
    for (let i = 0; i < 6; i++) parts.push(cyl(0.022, 0.06, -1.45 + (i % 3) * 0.06, hwY, 0.36 + Math.floor(i / 3) * 0.06, "#c9a54a", 12));
    // Headers: front panel, USB, fans
    const header = (x: number, z: number, cols: number, rows: number, color = "#1b1d22") => {
      parts.push(box(cols * 0.025 + 0.01, 0.02, rows * 0.025 + 0.01, x, hwY, z, color));
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) parts.push(box(0.006, 0.06, 0.006, x - (cols - 1) * 0.0125 + c * 0.025, hwY + 0.02, z - (rows - 1) * 0.0125 + r * 0.025, "#d9b24c"));
    };
    header(1.05, 1.1, 5, 2);
    header(0.75, 1.1, 5, 2, "#2a3c66");
    for (const [x, z] of [[-1.42, -0.55], [0.32, -1.1], [1.25, 1.0]] as Array<[number, number]>) {
      parts.push(box(0.1, 0.05, 0.045, x, hwY, z, "#f1efe8"));
      for (let k = 0; k < 4; k++) parts.push(box(0.006, 0.05, 0.006, x - 0.036 + k * 0.024, hwY + 0.005, z, "#d9b24c"));
    }
    // PCIe x1 slot
    parts.push(box(0.32, 0.06, 0.07, -0.02, hwY, 0.32, "#1b1d22"));
    // M.2 slot connector and standoff (the SSD sits in it)
    parts.push(box(0.05, 0.035, 0.2, -0.5, hwY, 0.85, "#1b1d22"), cyl(0.02, 0.03, -1.45, hwY, 0.85, "#c9ccd1", 10));
    // SATA ports: four L-shaped connectors on the right edge
    for (let i = 0; i < 4; i++) {
      parts.push(box(0.14, 0.09, 0.11, 1.44, hwY, 0.45 + i * 0.14, "#1b1d22"));
      parts.push(box(0.02, 0.05, 0.07, 1.5, hwY + 0.02, 0.45 + i * 0.14, "#2f3238"));
    }
    // CMOS battery in its holder
    parts.push(cyl(0.12, 0.015, -0.32, hwY, 0.42, "#1b1d22", 28), cyl(0.1, 0.03, -0.32, hwY + 0.012, 0.42, "#d4d8dc", 28), box(0.04, 0.05, 0.03, -0.32, hwY, 0.31, "#c9ccd1"));
    B.root.add(B.part(group("x", boardMesh, mesh(merge(parts), white, "board_geo")), { id: "hw_motherboard", name: "Motherboard", group: "hardware", layer: "hardware", anchor: [-1.25, hwY + 0.02, 0.6], view: [0.5, 1.1, 1.0], fit: 2.4 }));
  }
  // CPU: the socket and its retention frame, the chip, and a cooler (heat pipes,
  // fins, a fan) on top
  {
    const cx = -0.5, cz = -0.25;
    const p: THREE.BufferGeometry[] = [box(0.82, 0.03, 0.82, cx, hwY, cz, "#2a2e34")];
    // retention frame and lever
    for (const [dx, dz, w, d] of [[0, -0.4, 0.82, 0.04], [0, 0.4, 0.82, 0.04], [-0.4, 0, 0.04, 0.82], [0.4, 0, 0.04, 0.82]] as Array<[number, number, number, number]>) p.push(box(w, 0.05, d, cx + dx, hwY + 0.02, cz + dz, "#b8bdc3"));
    p.push(cylZ(0.012, 0.8, cx + 0.47, hwY + 0.05, cz, "#b8bdc3")); // socket lever
    p.push(box(0.6, 0.04, 0.6, cx, hwY + 0.04, cz, "#c9ccd1")); // the CPU's lid
    // cooler: base plate, copper heat pipes, fin stack, fan
    p.push(box(0.5, 0.05, 0.5, cx, hwY + 0.08, cz, "#b98a52"));
    for (let i = 0; i < 4; i++) {
      const x = cx - 0.18 + i * 0.12;
      p.push(cyl(0.022, 0.42, x, hwY + 0.1, cz - 0.24, "#c07a45", 10), cyl(0.022, 0.42, x, hwY + 0.1, cz + 0.24, "#c07a45", 10));
    }
    for (let i = 0; i < 18; i++) p.push(box(0.68, 0.01, 0.66, cx, hwY + 0.16 + i * 0.019, cz, i % 2 ? "#c3c8ce" : "#b5bac1"));
    p.push(box(0.7, 0.02, 0.7, cx, hwY + 0.505, cz, "#2b2f35")); // fan frame
    p.push(cyl(0.3, 0.03, cx, hwY + 0.525, cz, "#16181c", 32));
    for (let b = 0; b < 9; b++) {
      const g = box(0.24, 0.012, 0.075, 0.13, hwY + 0.555, 0, "#3d4450");
      g.applyMatrix4(new THREE.Matrix4().makeRotationY((b / 9) * Math.PI * 2)).translate(cx, 0, cz);
      p.push(g);
    }
    p.push(cyl(0.07, 0.02, cx, hwY + 0.565, cz, "#e4532b", 20)); // hub sticker
    B.root.add(B.part(group("x", mesh(merge(p), metal, "cpu_geo")), { id: "hw_cpu", name: "CPU", group: "hardware", layer: "hardware", anchor: [-0.5, hwY + 0.6, -0.25], view: [0.6, 0.9, 1.0], fit: 2.2 }));
  }
  // VRM: the power stages around the socket, chokes under finned heatsinks
  {
    const p: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) p.push(box(0.09, 0.06, 0.09, -0.95 + i * 0.12, hwY, -0.82, "#3a3f47"));
    for (let i = 0; i < 6; i++) p.push(box(0.09, 0.06, 0.09, -1.12, hwY, -0.68 + i * 0.12, "#3a3f47"));
    for (let i = 0; i < 10; i++) p.push(cyl(0.028, 0.08, -1.0 + i * 0.1, hwY, -0.72, i % 2 ? "#6c4ea0" : "#b8bec6", 12));
    // heatsinks: base blocks with fins
    const fins = (x0: number, z0: number, w: number, d: number, along: "x" | "z") => {
      p.push(box(w, 0.05, d, x0, hwY + 0.06, z0, "#7f878f"));
      const n = Math.round((along === "x" ? w : d) / 0.04);
      for (let k = 0; k < n; k++) {
        const t = -0.5 + (k + 0.5) / n;
        p.push(along === "x" ? box(0.015, 0.14, d, x0 + t * w, hwY + 0.11, z0, "#9aa2aa") : box(w, 0.14, 0.015, x0, hwY + 0.11, z0 + t * d, "#9aa2aa"));
      }
    };
    fins(-0.52, -0.86, 1.0, 0.18, "x");
    fins(-1.14, -0.36, 0.18, 0.7, "z");
    // 8-pin CPU power (EPS) connector in the corner
    p.push(box(0.2, 0.12, 0.1, -1.33, hwY, -1.05, "#1b1d22"));
    for (let k = 0; k < 4; k++) p.push(box(0.035, 0.005, 0.035, -1.39 + k * 0.042, hwY + 0.12, -1.05, "#30343a"));
    B.root.add(B.part(group("x", mesh(merge(p), metal, "vrm_geo")), { id: "hw_vrm", name: "Voltage regulators (VRM)", group: "hardware", layer: "hardware", anchor: [-1.14, hwY + 0.25, -0.3], view: [-0.3, 1.0, 0.8], fit: 2.0 }));
  }
  // Chipset under its heatsink
  {
    const CX = 1.1, CZ = 0.335;
    const p: THREE.BufferGeometry[] = [box(0.22, 0.03, 0.22, CX, hwY, CZ, "#1b1e23"), box(0.36, 0.05, 0.34, CX, hwY + 0.03, CZ, "#3a3f47")];
    for (let k = 0; k < 8; k++) p.push(box(0.36, 0.06, 0.016, CX, hwY + 0.08, CZ - 0.16 + k * 0.046, "#59616b"));
    p.push(box(0.16, 0.012, 0.05, CX, hwY + 0.145, CZ, "#e4532b"));
    B.root.add(B.part(group("x", mesh(merge(p), metal, "chipset_geo")), { id: "hw_chipset", name: "Chipset", group: "hardware", layer: "hardware", anchor: [1.1, hwY + 0.16, 0.335], view: [0.6, 1.0, 1.0], fit: 1.8 }));
  }
  // Power connector: the 24-pin ATX socket on the right edge
  {
    const p: THREE.BufferGeometry[] = [box(0.12, 0.12, 0.52, 1.42, hwY, -0.2, "#1b1d22")];
    for (let r = 0; r < 12; r++) for (let c = 0; c < 2; c++) p.push(box(0.035, 0.005, 0.03, 1.4 + c * 0.045 - 0.02, hwY + 0.12, -0.44 + r * 0.04, "#30343a"));
    p.push(box(0.03, 0.04, 0.08, 1.49, hwY + 0.05, -0.2, "#1b1d22")); // latch
    B.root.add(B.part(group("x", mesh(merge(p), white, "atx_geo")), { id: "hw_power", name: "Power connector", group: "hardware", layer: "hardware", anchor: [1.42, hwY + 0.13, -0.2], view: [1.0, 0.8, 0.5], fit: 1.6 }));
  }
  // RAM: four slots with latches; two modules fitted (slots A2 and B2)
  {
    const p: THREE.BufferGeometry[] = [];
    for (const x of [0.58, 0.68, 0.78, 0.88]) {
      p.push(box(0.07, 0.07, 0.98, x, hwY, -0.3, x === 0.68 || x === 0.88 ? "#1b1d22" : "#2b4f8f"));
      for (const z of [-0.81, 0.21]) p.push(box(0.05, 0.12, 0.04, x, hwY + 0.02, z, "#e6e6e3"));
    }
    for (const x of [0.68, 0.88]) {
      p.push(box(0.03, 0.32, 0.9, x, hwY + 0.06, -0.3, "#23824f"));
      p.push(box(0.034, 0.025, 0.86, x, hwY + 0.04, -0.3, "#d9b24c")); // gold contacts
      for (const side of [-1, 1]) for (let c = 0; c < 4; c++) p.push(box(0.016, 0.1, 0.14, x + side * 0.022, hwY + 0.17, -0.62 + c * 0.2, "#16181c"));
      p.push(box(0.038, 0.04, 0.9, x, hwY + 0.34, -0.3, "#2c3036")); // heat spreader top
    }
    B.root.add(B.part(group("x", mesh(merge(p), white, "ram_geo")), { id: "hw_ram", name: "RAM", group: "hardware", layer: "hardware", anchor: [0.78, hwY + 0.38, -0.3], view: [1.0, 0.6, 0.6], fit: 2.4 }));
  }
  // Storage: an M.2 SSD lying flat in its slot, held by the standoff screw
  {
    const p: THREE.BufferGeometry[] = [box(0.9, 0.02, 0.22, -1.0, hwY + 0.02, 0.85, "#2a6d52")];
    p.push(box(0.2, 0.03, 0.16, -1.28, hwY + 0.04, 0.85, "#16181c"), box(0.2, 0.03, 0.16, -1.03, hwY + 0.04, 0.85, "#16181c"), box(0.16, 0.03, 0.16, -0.78, hwY + 0.04, 0.85, "#1f2b3d"));
    p.push(box(0.04, 0.012, 0.18, -0.57, hwY + 0.025, 0.85, "#d9b24c"), cyl(0.03, 0.02, -1.45, hwY + 0.04, 0.85, "#d4d8dc", 12));
    p.push(box(0.04, 0.003, 0.06, -1.3, hwY + 0.07, 0.85, "#e9efe8")); // label
    B.root.add(B.part(group("x", mesh(merge(p), white, "ssd_geo")), { id: "hw_storage", name: "Storage (SSD)", group: "hardware", layer: "hardware", anchor: [-1.05, hwY + 0.08, 0.85], view: [0.4, 1.2, 1.0], fit: 2.0 }));
  }
  // GPU: a card in the PCIe x16 slot, shroud with two fans, backplate edge, power plug
  {
    const p: THREE.BufferGeometry[] = [box(1.3, 0.07, 0.08, 0.45, hwY, 0.62, "#1b1d22"), box(0.06, 0.08, 0.1, 1.06, hwY, 0.62, "#e6e6e3")]; // slot + latch
    p.push(rbox(1.28, 0.18, 0.46, 0.03, 0.45, hwY + 0.12, 0.88, "#23262c"));
    p.push(box(1.24, 0.012, 0.44, 0.45, hwY + 0.105, 0.88, "#3a3f47")); // PCB edge
    for (const x of [0.15, 0.72]) {
      p.push(cyl(0.19, 0.012, x, hwY + 0.3, 0.88, "#0f1114", 32));
      for (let b = 0; b < 9; b++) {
        const g2 = box(0.15, 0.012, 0.05, 0.09, hwY + 0.31, 0, "#5d6470");
        g2.applyMatrix4(new THREE.Matrix4().makeRotationY((b / 9) * Math.PI * 2)).translate(x, 0, 0.88);
        p.push(g2);
      }
      p.push(cyl(0.05, 0.01, x, hwY + 0.32, 0.88, "#e4532b", 16));
    }
    p.push(box(0.03, 0.34, 0.46, -0.21, hwY, 0.88, "#8f959c")); // bracket
    p.push(box(0.14, 0.06, 0.06, 0.95, hwY + 0.3, 0.68, "#1b1d22")); // 8-pin power plug on the card
    B.root.add(B.part(group("x", mesh(merge(p), metal, "gpu_geo")), { id: "hw_gpu", name: "GPU", group: "hardware", layer: "hardware", anchor: [0.45, hwY + 0.33, 0.88], view: [0.5, 1.2, 1.0], fit: 2.2 }));
  }
  // Rear I/O: USB ports, Ethernet with its LEDs, audio jacks, video out, under a shroud
  {
    const p: THREE.BufferGeometry[] = [rbox(1.1, 0.28, 0.24, 0.02, 0.4, hwY, -1.06, "#3a3f47")]; // shroud
    const face = -1.19;
    let x = -0.08;
    const port = (w: number, h: number, y: number, color: string, inner = "#1b1d22") => {
      p.push(box(w, h, 0.03, x, hwY + y, face, color), box(w * 0.7, h * 0.45, 0.02, x, hwY + y + h * 0.27, face - 0.01, inner));
    };
    for (let k = 0; k < 2; k++) { port(0.12, 0.07, 0.03, "#c9ccd1", "#2b5fbf"); port(0.12, 0.07, 0.13, "#c9ccd1", "#2b5fbf"); x += 0.15; }
    port(0.14, 0.12, 0.05, "#c9ccd1"); // Ethernet
    p.push(box(0.025, 0.02, 0.01, x - 0.05, hwY + 0.15, face - 0.012, "#5ec26a"), box(0.025, 0.02, 0.01, x + 0.05, hwY + 0.15, face - 0.012, "#e6b13a"));
    x += 0.17;
    port(0.16, 0.06, 0.06, "#c9ccd1"); // video out
    x += 0.17;
    for (const [i, c] of (["#6dbb5b", "#4d86d6", "#e070a8"] as const).entries()) p.push(cylZ(0.022, 0.03, x, hwY + 0.06 + i * 0.065, face, c));
    B.root.add(B.part(group("x", mesh(merge(p), metal, "net_geo")), { id: "hw_network", name: "Network and ports", group: "hardware", layer: "hardware", anchor: [0.4, hwY + 0.3, -1.06], view: [0.4, 0.6, -1.0], fit: 2.0 }));
  }

  // ============================ firmware ============================
  const fwY = Y.fw + 0.035;
  B.root.add(slab("slab_firmware", Y.fw, "#d9a02a", "firmware"));
  {
    const p: THREE.BufferGeometry[] = [box(0.8, 0.1, 0.55, 0.2, fwY, 0.1, "#1b1d22")];
    for (let i = 0; i < 6; i++) p.push(box(0.04, 0.04, 0.06, -0.15 + i * 0.1 + 0.0, fwY, 0.42, "#c9ccd1"), box(0.04, 0.04, 0.06, -0.15 + i * 0.1, fwY, -0.22, "#c9ccd1")); // pins
    p.push(box(0.5, 0.012, 0.3, 0.2, fwY + 0.1, 0.1, "#e8e4dc")); // label
    // a boot "arrow" to show it runs first
    p.push(box(0.9, 0.02, 0.07, -0.9, fwY, 0.1, "#fff3d4"), box(0.12, 0.02, 0.2, -0.38, fwY, 0.1, "#fff3d4"));
    B.root.add(B.part(group("x", mesh(merge(p), white, "uefi_geo")), { id: "fw_firmware", name: "Firmware (UEFI)", group: "firmware", layer: "firmware", anchor: [0.2, fwY + 0.15, 0.1], view: [0.5, 1.0, 1.0], fit: 2.2 }));
  }

  // ============================ operating system ============================
  const osY = Y.os + 0.035;
  B.root.add(slab("slab_os", Y.os, "#4668c9", "os"));
  {
    // Kernel: a large core block with a ring of gear-like teeth
    const p: THREE.BufferGeometry[] = [rbox(0.95, 0.28, 0.95, 0.05, 0, 0.0, 0.0, "#22346f").translate(0, osY, 0)];
    p.push(rbox(0.6, 0.06, 0.6, 0.05, 0, 0.0, 0.0, "#6f8ff0").translate(0, osY + 0.28, 0));
    B.root.add(B.part(group("x", mesh(merge(p), white, "kernel_geo")), { id: "os_kernel", name: "Kernel", group: "os", layer: "os", anchor: [0, osY + 0.4, 0], view: [0.6, 0.9, 1.0], fit: 2.2 }));
  }
  {
    // Drivers: a row of small adapter blocks along the front, each linking toward a hardware part
    const p: THREE.BufferGeometry[] = [];
    const cols = ["#8aa4f2", "#7690e6", "#6a85e0", "#5f7bd9"];
    for (let i = 0; i < 4; i++) p.push(box(0.36, 0.14, 0.3, -1.1 + i * 0.5, osY, 0.9, cols[i]), box(0.1, 0.16, 0.08, -1.1 + i * 0.5, osY, 0.72, "#dfe6fb"));
    B.root.add(B.part(group("x", mesh(merge(p), white, "drivers_geo")), { id: "os_drivers", name: "Device drivers", group: "os", layer: "os", anchor: [-0.35, osY + 0.2, 0.9], view: [0.3, 1.0, 1.0], fit: 2.2 }));
  }
  {
    // File system: a folder tree of stacked slabs
    const p: THREE.BufferGeometry[] = [box(0.5, 0.05, 0.34, 1.05, osY, -0.55, "#a8bbf5")];
    for (let i = 0; i < 3; i++) {
      p.push(box(0.3, 0.05, 0.2, 0.9, osY, -0.1 + i * 0.28, "#d3dcfa"), box(0.16, 0.03, 0.04, 1.25, osY, -0.1 + i * 0.28, "#7690e6"));
    }
    p.push(box(0.03, 0.04, 0.9, 0.72, osY, -0.1, "#4668c9"));
    B.root.add(B.part(group("x", mesh(merge(p), white, "fs_geo")), { id: "os_filesystem", name: "File system", group: "os", layer: "os", anchor: [1.0, osY + 0.12, -0.2], view: [0.6, 1.0, 1.0], fit: 2.2 }));
  }
  {
    // Scheduler: a small queue of blocks being fed to the kernel
    const p: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) p.push(box(0.18, 0.08 + (i % 2) * 0.04, 0.18, -1.35 + i * 0.22, osY, -0.2, i === 0 ? "#f5c04a" : "#c4d0f8"));
    p.push(box(0.3, 0.02, 0.05, -0.5, osY + 0.14, -0.2, "#fff"));
    B.root.add(B.part(group("x", mesh(merge(p), white, "sched_geo")), { id: "os_scheduler", name: "Scheduler", group: "os", layer: "os", anchor: [-0.9, osY + 0.14, -0.2], view: [0.2, 1.0, 1.0], fit: 2.2 }));
  }

  // ============================ applications ============================
  const appY = Y.app + 0.035;
  B.root.add(slab("slab_apps", Y.app, "#d8532f", "apps"));
  const win = (id: string, name: string, x: number, z: number, w: number, d: number, bar: string, line: string, anchorY = 0.1) => {
    const p: THREE.BufferGeometry[] = [rbox(w, 0.05, d, 0.02, x, appY, z, "#f6f1e5"), box(w, 0.055, 0.1, x, appY, z - d / 2 + 0.05, bar)];
    for (let i = 0; i < 4; i++) p.push(box(w * (0.7 - (i % 2) * 0.2), 0.058, 0.035, x - w * 0.08, appY, z - d / 2 + 0.22 + i * 0.1, line));
    B.root.add(B.part(group("x", mesh(merge(p), white, `${id}_geo`)), { id, name, group: "apps", layer: "apps", anchor: [x, appY + anchorY, z], view: [0.3, 1.1, 1.0], fit: 2.2 }));
  };
  win("app_browser", "Web browser", -0.95, -0.25, 1.1, 0.8, "#3b6fd1", "#c9d3e8");
  win("app_editor", "Code editor", 0.35, -0.2, 1.0, 0.8, "#2f9a6a", "#c9e0d3");
  win("app_terminal", "Terminal", 0.1, 0.8, 1.6, 0.6, "#2a2e34", "#7fe0a8");

  return B.write("public/models");
}

buildComputer().then((r) => console.log(JSON.stringify(r)));
