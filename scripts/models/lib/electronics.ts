/**
 * Electronics building blocks shared by the mechatronics scenes: an Arduino Uno,
 * a half-size breadboard, an LED, a resistor, a tactile switch and jumper wires.
 *
 * Units: 1 scene unit = 100 mm, so an Uno (68.6 x 53.3 mm) is 0.686 x 0.533.
 * The Uno's dimensions and header positions follow the published board drawing
 * to within a millimetre or so; small parts are drawn recognisably rather than
 * measured. The Uno is built from named sub-assemblies so lesson 1 can make each
 * one a clickable part while later scenes use the whole board as one part.
 *
 * Everything is flat-shaded vertex-coloured boxes and cylinders merged per
 * sub-assembly, which keeps draw calls and file size tiny.
 */
import * as THREE from "three";
import { group, mat, merge, mesh, roundedBox, tint, tube, cablePoints, xf } from "./geo";
import { labelSheet, unoSilk } from "./textures";

export const mm = (v: number) => v / 100;
const white = mat({ color: "#ffffff", rough: 0.55 });
const glossy = mat({ color: "#ffffff", rough: 0.28 });

/** Axis-aligned box whose BOTTOM face sits at y. Sizes and positions in scene units. */
export const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) =>
  tint(xf(new THREE.BoxGeometry(w, h, d), { p: [x, y + h / 2, z] }), color);

/** Vertical cylinder, bottom at y. */
export const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, seg = 20) =>
  tint(xf(new THREE.CylinderGeometry(r, r, h, seg), { p: [x, y + h / 2, z] }), color);

/** Horizontal cylinder along x, centre at (x, y, z). */
export const cylX = (r: number, len: number, x: number, y: number, z: number, color: string, seg = 16) =>
  tint(xf(new THREE.CylinderGeometry(r, r, len, seg), { p: [x, y, z], r: [0, 0, Math.PI / 2] }), color);

const part = (name: string, geos: THREE.BufferGeometry[], m: THREE.Material = white) => group(name, mesh(merge(geos), m, `${name}_geo`));

// ===========================================================================
// Arduino Uno R3
// ===========================================================================

/** Board size in mm */
const UW = 68.6;
const UH = 53.3;
const PCB_T = 1.6;
/** Photo coordinates (mm from the lower-left corner, y up the page) to scene x/z, centred on the board. */
const ux = (x: number) => mm(x - UW / 2);
const uz = (y: number) => -mm(y - UH / 2);
const TOP = mm(PCB_T);

/** Digital header pin centres in photo mm. Pin 13 is the 5th of the left block; pin 0 is the last of the right. */
const HEADER_Y = 50.8;
const D_LEFT = ["SCL", "SDA", "AREF", "GND", "13", "12", "11", "10", "9", "8"];
const D_RIGHT = ["7", "6", "5", "4", "3", "2", "1", "0"];
const P_POWER = ["NC", "IOREF", "RESET", "3V3", "5V", "GND_P1", "GND_P2", "VIN"];
const P_ANALOG = ["A0", "A1", "A2", "A3", "A4", "A5"];

export interface Uno {
  /** All sub-assemblies, un-named at the scene level so the caller names the part */
  parts: Record<"pcb" | "usb" | "barrel" | "regulator" | "mcu" | "crystal" | "usbchip" | "reset" | "digital" | "analog" | "power" | "icsp" | "ledL", THREE.Group>;
  /** Top-of-socket position of a header pin in the board's own frame, e.g. pin("13"), pin("GND"), pin("5V") */
  pin: (name: string) => THREE.Vector3;
  /** The whole board as one group */
  whole: () => THREE.Group;
}

export function buildUno(): Uno {
  const pins = new Map<string, THREE.Vector3>();
  const headerTop = TOP + mm(8.5);
  D_LEFT.forEach((n, i) => pins.set(n === "GND" ? "GND" : n, new THREE.Vector3(ux(17.0 + i * 2.54), headerTop, uz(HEADER_Y))));
  D_RIGHT.forEach((n, i) => pins.set(n, new THREE.Vector3(ux(46.2 + i * 2.54), headerTop, uz(HEADER_Y))));
  P_POWER.forEach((n, i) => pins.set(n, new THREE.Vector3(ux(29.2 + i * 2.54), headerTop, uz(2.5))));
  P_ANALOG.forEach((n, i) => pins.set(n, new THREE.Vector3(ux(51.8 + i * 2.54), headerTop, uz(2.5))));

  // ---- PCB: teal board, mounting holes, traces, SMD parts, silkscreen logo
  const pcb: THREE.BufferGeometry[] = [box(mm(UW), mm(PCB_T), mm(UH), 0, 0, 0, "#0e7f8d")];
  for (const [hx, hy] of [[14, 2.5], [15.3, 50.7], [66.1, 7.6], [66.1, 35.5]]) pcb.push(cyl(mm(1.6), 0.0008, ux(hx), TOP, uz(hy), "#0a3d44", 14));
  // Traces: thin lighter strips running from the headers toward the chip
  const trace = "#1aa0ad";
  for (let i = 0; i < 14; i++) pcb.push(box(mm(0.4), 0.0004, mm(10 + (i % 4)), ux(46.2 + (i % 8) * 2.54 + (i > 7 ? 1.3 : 0)), TOP, uz(40 - (i % 4) * 0.8), trace));
  for (let i = 0; i < 10; i++) pcb.push(box(mm(6 + i), 0.0004, mm(0.4), ux(38 + i * 1.2), TOP, uz(23 + i * 1.6), trace));
  for (let i = 0; i < 8; i++) pcb.push(box(mm(0.4), 0.0004, mm(8), ux(21 + i * 1.5), TOP, uz(24), trace));
  // SMD resistors/capacitors
  const smd = "#c2a572";
  const smds: Array<[number, number, boolean]> = [[24, 44, false], [26, 44, false], [28, 42, true], [31, 38, false], [33, 38, false], [24, 30, true], [27, 27, false], [20, 20, false], [22, 20, false], [43, 31, true], [45, 31, true], [48, 31, true], [57, 30, false], [57, 33, false], [16, 33, true], [12, 30, false], [31, 14, false], [34, 12, true], [38, 9, false], [58, 12, false], [60, 15, true]];
  for (const [x, y, rot] of smds) pcb.push(box(rot ? mm(0.8) : mm(1.6), mm(0.55), rot ? mm(1.6) : mm(0.8), ux(x), TOP, uz(y), smd));
  // Silkscreen: the infinity logo as two white rings, and a few ticks
  for (const cx of [26.5, 30.5]) pcb.push(tint(xf(new THREE.TorusGeometry(mm(2.2), mm(0.35), 6, 20), { p: [ux(cx), TOP + 0.0006, uz(8.5)], r: [-Math.PI / 2, 0, 0] }), "#e6f3f3"));

  // ---- USB-B connector (silver shell, dark opening on the outer face)
  const usbCx = 3, usbCy = 37.5;
  const usb: THREE.BufferGeometry[] = [
    box(mm(16.5), mm(10.6), mm(12), ux(usbCx), TOP, uz(usbCy), "#cdd2d9"),
    box(mm(0.8), mm(6.5), mm(8.6), ux(usbCx - 8.1), TOP + mm(2.0), uz(usbCy), "#1b1f26"),
    box(mm(16.6), mm(0.5), mm(12.1), ux(usbCx), TOP + mm(10.6), uz(usbCy), "#aeb4bd"),
  ];

  // ---- DC power jack (black plastic, round socket in the outer face)
  const barrel: THREE.BufferGeometry[] = [
    box(mm(14.2), mm(10.8), mm(9), ux(4.5), TOP, uz(8), "#24272c"),
    tint(xf(new THREE.CylinderGeometry(mm(3.1), mm(3.1), mm(0.8), 18), { p: [ux(-2.2), TOP + mm(5.9), uz(8)], r: [0, 0, Math.PI / 2] }), "#0c0e11"),
    cyl(mm(1.0), mm(5), ux(2.2), TOP + mm(1.5), uz(8), "#9aa0a8", 10),
  ];

  // ---- Voltage regulator, electrolytic capacitors and the fuse next to the jack
  const regulator: THREE.BufferGeometry[] = [
    box(mm(6.5), mm(2.6), mm(6.8), ux(19.5), TOP, uz(13), "#2a2d33"),
    box(mm(3.2), mm(0.5), mm(6.6), ux(22.2), TOP + mm(0.4), uz(13), "#a8aeb6"),
    cyl(mm(3.1), mm(6.3), ux(14), TOP, uz(22.5), "#b7bcc4", 22),
    cyl(mm(3.12), mm(0.5), ux(14), TOP + mm(5.9), uz(22.5), "#1f2329", 22),
    cyl(mm(3.1), mm(6.3), ux(21), TOP, uz(22.5), "#b7bcc4", 22),
    cyl(mm(3.12), mm(0.5), ux(21), TOP + mm(5.9), uz(22.5), "#1f2329", 22),
    box(mm(3.0), mm(1.6), mm(1.8), ux(14), TOP, uz(30), "#d9d4c4"),
  ];

  // ---- ATmega328P in a 28-pin DIP socket: long black body, silver legs
  const mcuC = { x: 45, y: 18 };
  const mcu: THREE.BufferGeometry[] = [
    box(mm(37), mm(3.0), mm(8.6), ux(mcuC.x), TOP, uz(mcuC.y), "#1d2025"), // socket
    box(mm(34.8), mm(3.6), mm(7.6), ux(mcuC.x), TOP + mm(3.0), uz(mcuC.y), "#2a2d33"), // chip body
    cyl(mm(0.8), mm(0.2), ux(mcuC.x - 15.5), TOP + mm(6.6), uz(mcuC.y + 2.2), "#cfd3d9", 10), // pin 1 dot
  ];
  for (let i = 0; i < 14; i++) {
    const lx = mcuC.x - 16.5 + i * 2.54;
    mcu.push(box(mm(0.5), mm(1.8), mm(0.5), ux(lx), TOP + mm(1.2), uz(mcuC.y + 4.7), "#c9ced5"), box(mm(0.5), mm(1.8), mm(0.5), ux(lx), TOP + mm(1.2), uz(mcuC.y - 4.7), "#c9ced5"));
  }
  for (let i = 0; i < 3; i++) mcu.push(box(mm(18 - i * 3), mm(0.1), mm(0.55), ux(mcuC.x + 1), TOP + mm(6.6), uz(mcuC.y - 1.4 + i * 1.3), "#d7dbe1")); // printed marking

  // ---- 16 MHz crystal (HC-49 can) and its two load capacitors
  const crystal: THREE.BufferGeometry[] = [
    tint(xf(roundedBox(mm(11.4), mm(3.8), mm(4.7), mm(1.6), 3), { p: [ux(31), TOP + mm(1.9), uz(29.5)] }), "#c8ced6"),
    box(mm(1.4), mm(0.6), mm(1.0), ux(24.4), TOP, uz(29.5), "#c2a572"),
  ];

  // ---- ATmega16U2 (the USB-to-serial chip, a small square QFN)
  const usbchip: THREE.BufferGeometry[] = [
    box(mm(7.2), mm(1.0), mm(7.2), ux(19.5), TOP, uz(38.5), "#1d2025"),
    cyl(mm(0.55), mm(0.12), ux(17.1), TOP + mm(1.0), uz(36.2), "#cfd3d9", 10),
  ];

  // ---- Reset button: silver body with a red cap
  const reset: THREE.BufferGeometry[] = [
    box(mm(6), mm(3.4), mm(6), ux(9.5), TOP, uz(47), "#b9bfc7"),
    cyl(mm(1.9), mm(1.8), ux(9.5), TOP + mm(3.4), uz(47), "#d8332b", 18),
  ];

  // ---- Female headers: black housings with square sockets on top
  const socketColor = "#050607";
  const header = (xs: number[], y: number, name: string) => {
    const g: THREE.BufferGeometry[] = [];
    const x0 = Math.min(...xs) - 1.27, x1 = Math.max(...xs) + 1.27;
    g.push(box(mm(x1 - x0), mm(8.5), mm(2.54), ux((x0 + x1) / 2), TOP, uz(y), "#17191d"));
    for (const x of xs) g.push(box(mm(1.1), 0.0006, mm(1.1), ux(x), TOP + mm(8.5), uz(y), socketColor));
    return part(name, g);
  };
  const digital = group("digital", header(D_LEFT.map((_, i) => 17.0 + i * 2.54), HEADER_Y, "dl"), header(D_RIGHT.map((_, i) => 46.2 + i * 2.54), HEADER_Y, "dr"));
  const power = header(P_POWER.map((_, i) => 29.2 + i * 2.54), 2.5, "power");
  const analog = header(P_ANALOG.map((_, i) => 51.8 + i * 2.54), 2.5, "analog");

  // ---- ICSP 2x3 pin header at the right edge (gold pins on a black base)
  const icsp: THREE.BufferGeometry[] = [box(mm(5.08), mm(2.5), mm(7.62), ux(64.3), TOP, uz(32), "#17191d")];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) icsp.push(box(mm(0.64), mm(6), mm(0.64), ux(64.3 + (c ? 1.27 : -1.27)), TOP + mm(2.5), uz(32 + (r - 1) * 2.54), "#d6b04a"));

  // ---- Status LEDs. "L" (pin 13) is its own part because it blinks; the rest sit on the board.
  const ledL = group("ledL", mesh(merge([box(mm(1.6), mm(0.7), mm(0.8), ux(34.4), TOP, uz(44.6), "#f4c542")]), mat({ color: "#ffffff", rough: 0.3 }), "led_l_geo"));
  const smdLeds = box(mm(1.6), mm(0.7), mm(0.8), ux(34.4), TOP, uz(41.8), "#3fc27a");
  pcb.push(smdLeds, box(mm(1.6), mm(0.7), mm(0.8), ux(34.4), TOP, uz(39.4), "#f08a3c"), box(mm(1.6), mm(0.7), mm(0.8), ux(44), TOP, uz(31.5), "#3fc27a"));

  const parts = {
    pcb: part("pcb", pcb),
    usb: part("usb", usb),
    barrel: part("barrel", barrel),
    regulator: part("regulator", regulator),
    mcu: part("mcu", mcu),
    crystal: part("crystal", crystal),
    usbchip: part("usbchip", usbchip),
    reset: part("reset", reset),
    digital,
    analog,
    power,
    icsp: part("icsp", icsp),
    ledL,
  } as Uno["parts"];

  // The printed surface: a plane just above the solder mask carrying the silkscreen text and outlines.
  const silk = tint(xf(new THREE.PlaneGeometry(mm(UW), mm(UH)), { p: [0, TOP + 0.0002, 0], r: [-Math.PI / 2, 0, 0] }), "#ffffff");
  parts.pcb.add(mesh(silk, mat({ color: "#ffffff", rough: 0.55, map: unoSilk() }), "pcb_silkscreen"));

  return {
    parts,
    pin: (n) => {
      const v = pins.get(n);
      if (!v) throw new Error(`unknown Uno pin ${n}`);
      return v.clone();
    },
    whole: () => group("uno", ...Object.values(parts).map((o) => o.clone())),
  };
}

// ===========================================================================
// Half-size breadboard (400 tie points)
// ===========================================================================

export const BB_W = 82.5; // mm (x)
export const BB_D = 55; // mm (z)
const BB_BASE = 4.2; // mm, solid base
const BB_CAP = 2.4; // mm, top plastic with holes
export const BB_TOP = mm(BB_BASE + BB_CAP);
const ROW_Z: Record<string, number> = { a: -13.97, b: -11.43, c: -8.89, d: -6.35, e: -3.81, f: 3.81, g: 6.35, h: 8.89, i: 11.43, j: 13.97 };
const RAIL_Z: Record<string, number> = { "+t": -22.86, "-t": -20.32, "-b": 20.32, "+b": 22.86 };
const colX = (c: number) => mm((c - 15.5) * 2.54); // columns 1..30

/** Hole centre on the breadboard's top face. Columns 1..30; rows a..j or a rail ("+t", "-t", "-b", "+b"); rails use slots 1..25. */
export function bbHole(col: number, row: string): THREE.Vector3 {
  if (row in RAIL_Z) {
    // 25 rail holes in five groups of five with a one-hole gap between groups
    const slot = col - 1;
    const pos = slot + Math.floor(slot / 5);
    return new THREE.Vector3(mm((pos - 14) * 2.54), BB_TOP, mm(RAIL_Z[row]));
  }
  return new THREE.Vector3(colX(col), BB_TOP, mm(ROW_Z[row]));
}

export interface Breadboard {
  /** Plastic cap with all hole markings, split into the regions lesson 2 explains */
  body: THREE.Group;
  stripsTop: THREE.Group;
  stripsBottom: THREE.Group;
  rails: THREE.Group;
  channel: THREE.Group;
  /** Hidden-by-plastic parts: the base and the metal clips */
  base: THREE.Group;
  clips: THREE.Group;
  /** Everything as one group, for scenes where the board is a single part */
  whole: () => THREE.Group;
}

export function buildBreadboard(): Breadboard {
  const ivory = "#e8e4d6";
  const holeDark = "#3a3a38";
  const w = mm(BB_W), d = mm(BB_D);
  const capY = mm(BB_BASE);

  // Plastic body: the cap with a recessed centre channel, drawn as two raised blocks.
  const chan = mm(4.4);
  const blockD = (d - chan) / 2;
  const body = part("bb_body_g", [
    box(w, mm(BB_CAP), blockD, 0, capY, -(chan / 2 + blockD / 2), ivory),
    box(w, mm(BB_CAP), blockD, 0, capY, chan / 2 + blockD / 2, ivory),
    // Coloured rail lines
    box(w * 0.9, 0.0006, mm(0.5), 0, BB_TOP, mm(-24.9), "#d8332b"),
    box(w * 0.9, 0.0006, mm(0.5), 0, BB_TOP, mm(-18.2), "#2f5fd0"),
    box(w * 0.9, 0.0006, mm(0.5), 0, BB_TOP, mm(18.2), "#2f5fd0"),
    box(w * 0.9, 0.0006, mm(0.5), 0, BB_TOP, mm(24.9), "#d8332b"),
  ]);

  // Printed labels on the cap: column numbers between each hole field and its rails, row letters and rail
  // signs at the left end, like a real board. Two sheets (one per cap block) so the channel stays open.
  {
    const labels: Array<{ t: string; x: number; z: number; h: number; bold?: boolean }> = [];
    for (const c of [1, 5, 10, 15, 20, 25, 30]) for (const z of [-17.1, 17.1]) labels.push({ t: String(c), x: (c - 15.5) * 2.54, z, h: 1.6, bold: true });
    for (const r of Object.keys(ROW_Z)) labels.push({ t: r.toUpperCase(), x: -39.2, z: ROW_Z[r], h: 1.6, bold: true });
    for (const [rk, z] of Object.entries(RAIL_Z)) labels.push({ t: rk[0] === "+" ? "+" : "\u2212", x: -39.2, z, h: 2.2, bold: true });
    const map = labelSheet({ w: BB_W, d: BB_D, base: ivory, ink: "#6d6a5c", labels });
    const capMat = mat({ color: "#ffffff", rough: 0.6, map });
    for (const [z0, z1] of [[-BB_D / 2, -4.4 / 2], [4.4 / 2, BB_D / 2]]) {
      const g = xf(new THREE.PlaneGeometry(w, mm(z1 - z0)), { p: [0, BB_TOP + 0.0002, mm((z0 + z1) / 2)], r: [-Math.PI / 2, 0, 0] });
      // UV from the sheet's own coordinates, so both strips sample the one texture
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (d / 2 - pos.getZ(i)) / d);
      body.add(mesh(tint(g, "#ffffff"), capMat, `bb_cap_print_${z0 < 0 ? "a" : "b"}`));
    }
  }

  // Hole fields sit on slightly tinted pads so each region is easy to pick
  const field = (rows: string[], pad: string, name: string) => {
    const zs = rows.map((r) => ROW_Z[r]);
    const z0 = Math.min(...zs) - 1.6, z1 = Math.max(...zs) + 1.6;
    const g: THREE.BufferGeometry[] = [box(mm(31 * 2.54), 0.0006, mm(z1 - z0), 0, BB_TOP, mm((z0 + z1) / 2), pad)];
    for (let c = 1; c <= 30; c++) for (const r of rows) g.push(box(mm(1.7), 0.0004, mm(1.7), colX(c), BB_TOP + 0.0006, mm(ROW_Z[r]), holeDark));
    return part(name, g);
  };
  const stripsTop = field(["a", "b", "c", "d", "e"], "#e0dccb", "bb_strips_top_g");
  const stripsBottom = field(["f", "g", "h", "i", "j"], "#e0dccb", "bb_strips_bottom_g");

  const railGeos: THREE.BufferGeometry[] = [];
  for (const rk of Object.keys(RAIL_Z)) {
    const z = RAIL_Z[rk];
    railGeos.push(box(mm(31 * 2.54), 0.0006, mm(3.4), 0, BB_TOP, mm(z), "#e0dccb"));
    for (let s = 1; s <= 25; s++) railGeos.push(box(mm(1.7), 0.0004, mm(1.7), bbHole(s, rk).x, BB_TOP + 0.0006, mm(z), holeDark));
  }
  const rails = part("bb_rails_g", railGeos);

  const channel = part("bb_channel_g", [box(mm(31 * 2.54), mm(0.4), chan * 0.92, 0, capY, 0, "#b9b5a6")]);

  // Under the cap: solid base and the metal clips that join each column of five
  const base = part("bb_base_g", [box(w, mm(BB_BASE), d, 0, 0, 0, "#d6d2c4")]);
  const clipGeos: THREE.BufferGeometry[] = [];
  const clipY = capY - mm(0.1);
  for (let c = 1; c <= 30; c++) {
    clipGeos.push(box(mm(0.9), mm(0.5), mm(12.6), colX(c), clipY, mm(-8.89), "#c7ccd3"));
    clipGeos.push(box(mm(0.9), mm(0.5), mm(12.6), colX(c), clipY, mm(8.89), "#c7ccd3"));
  }
  for (const rk of Object.keys(RAIL_Z)) clipGeos.push(box(mm(25 * 2.54 + 5), mm(0.5), mm(0.9), 0, clipY, mm(RAIL_Z[rk]), rk[0] === "+" ? "#e0a090" : "#a0b4e0"));
  const clips = part("bb_clips_g", clipGeos);

  return {
    body, stripsTop, stripsBottom, rails, channel, base, clips,
    whole: () => group("breadboard", ...[body, stripsTop, stripsBottom, rails, channel, base, clips].map((o) => o.clone())),
  };
}

// ===========================================================================
// Discrete components. Each takes the TOP surface position of the hole(s) it
// plugs into and extends its legs `depth` below, so peeling the plastic shows them in the clips.
// ===========================================================================

/** 5 mm LED. Returns a group with a dome mesh named "led_dome" (the adapter drives its glow) and a body mesh. */
export function buildLed(anode: THREE.Vector3, cathode: THREE.Vector3, color = "#ff3b2f", depth = mm(4)): THREE.Group {
  const mid = anode.clone().add(cathode).multiplyScalar(0.5);
  const r = mm(2.5);
  const dome = lathe5(r);
  const domeMesh = mesh(tint(xf(dome, { p: [mid.x, mid.y + mm(1.1), mid.z] }), "#ffffff"), mat({ color, rough: 0.2, opacity: 1 }), "led_dome");
  const rim = [
    tint(xf(new THREE.CylinderGeometry(mm(2.9), mm(2.9), mm(1.0), 24), { p: [mid.x, mid.y + mm(0.6), mid.z] }), "#d8d4cc"),
  ];
  // Legs: anode (longer, to the left) and cathode, vertical into the holes
  const legs = [
    box(mm(0.5), depth + mm(2), mm(0.5), anode.x, anode.y - depth, anode.z, "#c9ced5"),
    box(mm(0.5), depth + mm(2), mm(0.5), cathode.x, cathode.y - depth, cathode.z, "#c9ced5"),
    box(Math.abs(anode.x - mid.x) + mm(0.5), mm(0.5), mm(0.5), (anode.x + mid.x) / 2, anode.y + mm(1.5), mid.z, "#c9ced5"),
    box(Math.abs(cathode.x - mid.x) + mm(0.5), mm(0.5), mm(0.5), (cathode.x + mid.x) / 2, cathode.y + mm(1.5), mid.z, "#c9ced5"),
  ];
  return group("led", domeMesh, mesh(merge([...rim, ...legs]), white, "led_body"));
}

function lathe5(r: number) {
  // Dome: straight sides then a hemispherical top
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r, mm(4.2))];
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r, mm(4.2) + Math.sin(a) * r));
  }
  return new THREE.LatheGeometry(pts, 24);
}

/** Axial resistor lying along x between two holes in the same row. Colour bands for 220 ohm (red, red, brown, gold) by default. */
export function buildResistor(a: THREE.Vector3, b: THREE.Vector3, bands: string[] = ["#c8302a", "#c8302a", "#6b3f1e", "#c9a227"], depth = mm(4)): THREE.Group {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = Math.abs(a.x - b.x);
  const y = a.y + mm(1.6);
  const body = Math.min(len * 0.62, mm(6.3));
  const g: THREE.BufferGeometry[] = [
    // body: tan cylinder along x
    cylX(mm(1.25), body, mid.x, y + mm(1.0), mid.z, "#d7bd8a"),
    // leads: down into the holes, up and across
    box(mm(0.5), depth + mm(2.6), mm(0.5), a.x, a.y - depth, a.z, "#c9ced5"),
    box(mm(0.5), depth + mm(2.6), mm(0.5), b.x, b.y - depth, b.z, "#c9ced5"),
    box(len - body + mm(0.5), mm(0.5), mm(0.5), mid.x, y + mm(0.75), mid.z, "#c9ced5"),
  ];
  const bw = body / 7;
  bands.forEach((c, i) => g.push(cylX(mm(1.3), bw, mid.x - body / 2 + bw * (1.3 + i * 1.5), y + mm(1.0), mid.z, c, 16)));
  return group("resistor", mesh(merge(g), white, "resistor_geo"));
}

/** Short wire straight between two holes of one breadboard (flat jumper arching above the board). */
export function buildJumper(a: THREE.Vector3, b: THREE.Vector3, color: string, lift = mm(8), depth = mm(4)): THREE.Group {
  const up = (p: THREE.Vector3, h: number) => p.clone().add(new THREE.Vector3(0, h, 0));
  const pts = [up(a, mm(0.2)), up(a, lift * 0.9), up(a.clone().lerp(b, 0.5), lift), up(b, lift * 0.9), up(b, mm(0.2))];
  const g: THREE.BufferGeometry[] = [
    tint(tube(pts, mm(0.9), { radial: 8, segments: 28 }), color),
    box(mm(0.5), depth + mm(0.5), mm(0.5), a.x, a.y - depth, a.z, "#c9ced5"),
    box(mm(0.5), depth + mm(0.5), mm(0.5), b.x, b.y - depth, b.z, "#c9ced5"),
    box(mm(2.6), mm(5.5), mm(2.6), a.x, a.y, a.z, color),
    box(mm(2.6), mm(5.5), mm(2.6), b.x, b.y, b.z, color),
  ];
  return group("wire", mesh(merge(g), glossy, "wire_geo"));
}

/** Longer wire between two points at different heights, e.g. an Uno header pin and a breadboard hole. */
export function buildWire(a: THREE.Vector3, b: THREE.Vector3, color: string, sag = mm(14)): THREE.Group {
  const dirA = new THREE.Vector3(0, 1, 0);
  const pts = cablePoints(a.clone().addScaledVector(dirA, mm(5)), b.clone().addScaledVector(dirA, mm(5)), sag, 14);
  pts.unshift(a.clone().addScaledVector(dirA, mm(0.3)));
  pts.push(b.clone().addScaledVector(dirA, mm(0.3)));
  const g: THREE.BufferGeometry[] = [
    tint(tube(pts, mm(0.9), { radial: 8, segments: 40 }), color),
    box(mm(2.6), mm(5.5), mm(2.6), a.x, a.y, a.z, color),
    box(mm(2.6), mm(5.5), mm(2.6), b.x, b.y, b.z, color),
    box(mm(0.64), mm(3), mm(0.64), a.x, a.y - mm(2.5), a.z, "#c9ced5"),
    box(mm(0.64), mm(3), mm(0.64), b.x, b.y - mm(2.5), b.z, "#c9ced5"),
  ];
  return group("wire", mesh(merge(g), glossy, "wire_geo"));
}

/** 6 mm tactile switch straddling the centre channel: body, silver cover and a round cap named "switch_cap". */
export function buildSwitch(cx: number, cz: number, y: number, depth = mm(4)): THREE.Group {
  const body = [
    box(mm(6), mm(3.2), mm(6), cx, y, cz, "#26292e"),
    box(mm(5.2), mm(0.5), mm(5.2), cx, y + mm(3.2), cz, "#b3b9c1"),
  ];
  // Four legs: two each side of the channel, 6.35 mm apart across, 4.5 mm apart along (pitch 2.54 => use 5.08)
  for (const sx of [-2.54, 2.54]) for (const sz of [-3.81, 3.81]) body.push(box(mm(0.5), depth + mm(1), mm(0.5), cx + mm(sx), y - depth, cz + mm(sz), "#c9ced5"));
  const cap = mesh(tint(xf(new THREE.CylinderGeometry(mm(1.8), mm(1.8), mm(2.2), 20), { p: [cx, y + mm(3.7) + mm(1.1), cz] }), "#d03a2f"), mat({ color: "#ffffff", rough: 0.4 }), "switch_cap");
  return group("switch", mesh(merge(body), white, "switch_body"), cap);
}

// ===========================================================================
// Circuit layout shared by the blink and button scenes
// ===========================================================================

/**
 * An Uno in front of a half-size breadboard, header edge toward the board, so
 * short jumper wires reach the lower half (rows f-j and the "-b"/"+b" rails).
 * `pin(name)` and `hole(col,row)` return WORLD positions for wiring.
 */
export function layoutCircuit() {
  const uno = buildUno();
  const bb = buildBreadboard();
  const UNO_POS = new THREE.Vector3(-0.07, 0, 0.6);

  const unoParts = Object.entries(uno.parts).filter(([k]) => k !== "ledL").map(([, g]) => g);
  const unoBoard = group("uno_board", ...unoParts);
  unoBoard.position.copy(UNO_POS);
  const ledL = uno.parts.ledL;
  ledL.position.copy(UNO_POS);

  const board = bb.whole();
  return {
    unoBoard,
    ledL,
    board,
    pin: (n: string) => uno.pin(n).add(UNO_POS),
    hole: (col: number, row: string) => bbHole(col, row),
  };
}
