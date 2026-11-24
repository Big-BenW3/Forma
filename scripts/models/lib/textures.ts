/**
 * Small procedural textures (no image assets): timber boards and ceramic tiles.
 * Drawn pixel by pixel into an RGB buffer and encoded as WebP with sharp.
 * They tile (glTF's default sampler repeats), so 512 px covers a whole floor.
 */
import sharp from "sharp";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "node:path";
import { makeNoise3 } from "./math";

const noise = makeNoise3(3);
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

async function encode(size: number, px: (x: number, y: number) => RGB) {
  const buf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const c = px(x, y);
      const i = (y * size + x) * 3;
      buf[i] = Math.max(0, Math.min(255, c[0]));
      buf[i + 1] = Math.max(0, Math.min(255, c[1]));
      buf[i + 2] = Math.max(0, Math.min(255, c[2]));
    }
  const out = await sharp(buf, { raw: { width: size, height: size, channels: 3 } }).webp({ quality: 82 }).toBuffer();
  return { buffer: out, mime: "image/webp" as const };
}

/** Timber boards running along u: 4 boards per tile, staggered end joints, grain. */
export function timber(base = "#c69a68") {
  const S = 512, boards = 4;
  const a = hex(base), dark: RGB = mix(a, [70, 45, 25], 0.35), light: RGB = mix(a, [255, 240, 210], 0.18);
  return encode(S, (x, y) => {
    const bh = S / boards;
    const row = Math.floor(y / bh);
    const yy = y - row * bh;
    const off = (row * 0.37 % 1) * S;
    const xx = (x + off) % S;
    const joint = yy < 2 || xx < 2 || Math.abs(xx - S / 2) < 1.5 && row % 2 === 0;
    if (joint) return mix(dark, [40, 28, 18], 0.5);
    const tone = noise(row * 7.1, 0, 0) * 0.5 + 0.5;
    const grain = Math.sin((yy / bh) * 30 + noise(xx / 60, yy / 18, row) * 6) * 0.5 + 0.5;
    return mix(mix(dark, light, tone), dark, grain * 0.22);
  });
}

/** Square ceramic tiles with grout lines. */
export function tiles(base = "#dfe6e8", grout = "#a9b2b5", perSide = 4) {
  const S = 512;
  const a = hex(base), g = hex(grout);
  return encode(S, (x, y) => {
    const t = S / perSide;
    const gx = x % t, gy = y % t;
    if (gx < 3 || gy < 3) return g;
    const n = noise(Math.floor(x / t) * 3.1, Math.floor(y / t) * 2.7, 0) * 0.04 + noise(x / 30, y / 30, 5) * 0.02;
    return mix(a, [255, 255, 255], n + 0.02);
  });
}

/** Clay roof tiles seen from above: rows of rounded tiles, light at the crown, dark at the lap. */
export function roofTiles(base = "#b4593b") {
  const S = 512, rows = 8, cols = 8;
  const a = hex(base), dark: RGB = mix(a, [40, 15, 8], 0.55), light: RGB = mix(a, [255, 200, 170], 0.22);
  return encode(S, (x, y) => {
    const rh = S / rows, cw = S / cols;
    const r = Math.floor(y / rh);
    const yy = (y % rh) / rh;
    const xx = ((x + (r % 2) * cw * 0.5) % cw) / cw;
    const crown = Math.sin(xx * Math.PI); // rounded across each tile
    const lap = Math.pow(yy, 3); // shadow under the next row's lower edge
    const n = noise(Math.floor((x + (r % 2) * cw * 0.5) / cw) * 3, r * 2, 0) * 0.08;
    return mix(mix(dark, light, crown * 0.8 + n), dark, lap * 0.8);
  });
}

/**
 * A motherboard's top surface: green solder mask, copper traces routed in buses
 * between the socket, the memory slots, the PCIe slot and the chipset, vias, white
 * silkscreen outlines where parts sit, and plated mounting holes.
 *
 * `toPx` maps board coordinates (x, z in scene units, origin at the board centre)
 * to pixels, so the routing lines up with the 3D parts placed on top of it.
 */
export function pcb(o: { w: number; d: number; px?: number; outlines: Array<[number, number, number, number]>; buses: Array<Array<[number, number]>>; holes: Array<[number, number]> }) {
  const W = o.px ?? 1024, H = Math.round((W * o.d) / o.w);
  const img = new Float32Array(W * H * 3);
  const base = hex("#1d5a3c"), trace = hex("#2f7d55"), via = hex("#c8a24a"), silk = hex("#e9efe8"), pad = hex("#d4b25a");
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = noise(x / 40, y / 40, 1) * 0.04 + noise(x / 7, y / 7, 2) * 0.015;
      const c = mix(base, [0, 0, 0], -n);
      img.set(c, (y * W + x) * 3);
    }
  const toPx = (bx: number, bz: number): [number, number] => [((bx + o.w / 2) / o.w) * W, ((bz + o.d / 2) / o.d) * H];
  const put = (x: number, y: number, c: RGB, a = 1) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    img[i] = img[i] + (c[0] - img[i]) * a; img[i + 1] = img[i + 1] + (c[1] - img[i + 1]) * a; img[i + 2] = img[i + 2] + (c[2] - img[i + 2]) * a;
  };
  const line = (a: [number, number], b: [number, number], c: RGB, wpx: number) => {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / Math.max(1, n), y = a[1] + ((b[1] - a[1]) * i) / Math.max(1, n);
      for (let dy = -wpx / 2; dy <= wpx / 2; dy++) for (let dx = -wpx / 2; dx <= wpx / 2; dx++) put(x + dx, y + dy, c);
    }
  };
  const ring = (cx: number, cy: number, r0: number, r1: number, c: RGB) => {
    for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) { const d = Math.hypot(x, y); if (d <= r1 && d >= r0) put(cx + x, cy + y, c); }
  };
  // Buses: groups of parallel traces with 45-degree jogs between the waypoints.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const bus of o.buses) {
    const n = 6 + Math.floor(rnd() * 6);
    for (let k = 0; k < n; k++) {
      const off = (k - n / 2) * 5;
      const pts = bus.map(([x, z]) => toPx(x, z));
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const horiz = Math.abs(bx - ax) > Math.abs(by - ay);
        // offset perpendicular to the main direction so the traces run side by side
        const a: [number, number] = horiz ? [ax, ay + off] : [ax + off, ay];
        const b: [number, number] = horiz ? [bx, by + off] : [bx + off, by];
        // route: straight, then a 45-degree jog to line up
        const mid: [number, number] = horiz ? [b[0] - Math.sign(b[0] - a[0]) * Math.abs(b[1] - a[1]), a[1]] : [a[0], b[1] - Math.sign(b[1] - a[1]) * Math.abs(b[0] - a[0])];
        line(a, mid, trace, 2);
        line(mid, b, trace, 2);
      }
      if (rnd() < 0.5) { const p = pts[Math.floor(rnd() * pts.length)]; ring(p[0] + off, p[1] + 3, 2, 4, via); }
    }
  }
  // Scattered short traces and vias across the board
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * H, len = 10 + rnd() * 60;
    const dir = Math.floor(rnd() * 4);
    const b: [number, number] = dir === 0 ? [x + len, y] : dir === 1 ? [x, y + len] : dir === 2 ? [x + len * 0.7, y + len * 0.7] : [x + len * 0.7, y - len * 0.7];
    line([x, y], b, trace, 1.5);
    ring(b[0], b[1], 1.5, 3.2, via);
  }
  // Silkscreen outlines where parts sit (1 px white rectangles), with small pin-1 marks
  for (const [x0, z0, x1, z1] of o.outlines) {
    const [ax, ay] = toPx(x0, z0), [bx, by] = toPx(x1, z1);
    line([ax, ay], [bx, ay], silk, 1); line([bx, ay], [bx, by], silk, 1); line([bx, by], [ax, by], silk, 1); line([ax, by], [ax, ay], silk, 1);
    ring(ax + 5, ay + 5, 0, 1.5, silk);
    // a reference-designator-like dash group under each outline
    for (let k = 0; k < 3; k++) line([ax + k * 6, by + 6], [ax + k * 6 + 4, by + 6], silk, 1);
  }
  // Mounting holes: plated rings with a dark centre
  for (const [x, z] of o.holes) {
    const [cx, cy] = toPx(x, z);
    ring(cx, cy, 0, 9, [20, 20, 20]);
    ring(cx, cy, 9, 15, pad);
    ring(cx, cy, 15, 17, silk);
  }
  void pad;
  const out: (x: number, y: number) => RGB = (x, y) => [img[(y * W + x) * 3], img[(y * W + x) * 3 + 1], img[(y * W + x) * 3 + 2]];
  // encode() is square; draw into a square by stretching rows (UVs use the same 0..1 range)
  const S = W;
  return encode(S, (x, y) => out(x, Math.min(H - 1, Math.floor((y * H) / S))));
}

// ---------------------------------------------------------------------------
// Arduino Uno silkscreen
// ---------------------------------------------------------------------------

let fontsReady = false;
function silkFonts() {
  if (fontsReady) return;
  const dir = path.join(process.cwd(), "node_modules/@fontsource/barlow-semi-condensed/files");
  GlobalFonts.registerFromPath(path.join(dir, "barlow-semi-condensed-latin-600-normal.woff2"), "UnoSilk");
  GlobalFonts.registerFromPath(path.join(dir, "barlow-semi-condensed-latin-700-normal.woff2"), "UnoSilkBold");
  fontsReady = true;
}

/**
 * The printed surface of an Arduino Uno R3: solder-mask teal with the white
 * silkscreen a student sees on the real board: header outlines and pin numbers
 * (with the ~ on PWM pins), POWER / ANALOG IN / DIGITAL labels, RESET, ICSP, the
 * TX / RX / L / ON lamp names and the ARDUINO / UNO wordmark.
 *
 * Positions are in the board drawing's own millimetres (origin lower-left, y up
 * the page, 68.6 x 53.3 mm) so the text lines up with the 3D headers and parts
 * placed from the same drawing. Returns a WebP sized for mobile (1024 px wide).
 */
export function unoSilk(base = "#0e7f8d") {
  silkFonts();
  const UW = 68.6, UH = 53.3, W = 1024, H = Math.round((W * UH) / UW), k = W / UW;
  const c = createCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const silk = "#eaf6f5";
  g.fillStyle = silk; g.strokeStyle = silk; g.lineWidth = 0.3 * k; g.lineJoin = "round";
  const X = (x: number) => x * k, Y = (y: number) => (UH - y) * k;
  const text = (t: string, x: number, y: number, mmH: number, o: { align?: CanvasTextAlign; bold?: boolean; rot?: number } = {}) => {
    g.save();
    g.font = `${o.bold ? "700" : "600"} ${mmH * k}px ${o.bold ? "UnoSilkBold" : "UnoSilk"}`;
    g.textAlign = o.align ?? "center"; g.textBaseline = "middle";
    g.translate(X(x), Y(y)); if (o.rot) g.rotate(o.rot);
    g.fillText(t, 0, 0); g.restore();
  };
  const outline = (x0: number, y0: number, x1: number, y1: number) => g.strokeRect(X(x0), Y(y1), (x1 - x0) * k, (y1 - y0) * k);

  // Header outlines (one rectangle round each socket row)
  outline(15.0, 48.9, 41.9, 52.7); outline(44.2, 48.9, 66.0, 52.7); // digital
  outline(27.2, 0.6, 49.0, 4.4); outline(49.8, 0.6, 66.5, 4.4); // power, analog
  // Digital pin names: numbers under the headers, ~ on the PWM pins
  const pwm = new Set(["11", "10", "9", "6", "5", "3"]);
  ["SCL", "SDA", "AREF", "GND", "13", "12", "11", "10", "9", "8"].forEach((n, i) => {
    const small = n.length > 2;
    text(pwm.has(n) ? "~" + n : n, 17.0 + i * 2.54, 47.0, small ? 1.15 : 1.55, { bold: !small });
  });
  ["7", "6", "5", "4", "3", "2", "1", "0"].forEach((n, i) => text(pwm.has(n) ? "~" + n : n, 46.2 + i * 2.54, 47.0, 1.55, { bold: true }));
  text("TX", 46.2 + 6 * 2.54, 45.1, 1.0); text("RX", 46.2 + 7 * 2.54, 45.1, 1.0);
  text("DIGITAL (PWM= ~)", 44.9, 43.2, 1.6, { align: "left", bold: true });
  // Power and analog names above their headers
  ["IOREF", "RESET", "3.3V", "5V", "GND", "GND", "VIN"].forEach((n, i) => text(n, 31.74 + i * 2.54, 6.0, n.length > 3 ? 1.0 : 1.2));
  ["A0", "A1", "A2", "A3", "A4", "A5"].forEach((n, i) => text(n, 51.8 + i * 2.54, 6.0, 1.4, { bold: true }));
  text("POWER", 38.1, 8.7, 1.6, { bold: true });
  text("ANALOG IN", 58.5, 8.7, 1.6, { bold: true });
  // Wordmark: ARDUINO over a large UNO
  text("ARDUINO", 33.4, 12.2, 2.1, { align: "left", bold: true });
  text("UNO", 33.4, 15.4, 3.4, { align: "left", bold: true });
  // Controls and lamps
  text("RESET", 9.5, 42.6, 1.3, { bold: true });
  text("ICSP", 64.3, 26.6, 1.3, { bold: true }); outline(60.9, 27.9, 67.7, 36.1);
  text("L", 32.6, 44.6, 1.25, { align: "right", bold: true });
  text("TX", 32.6, 41.8, 1.25, { align: "right", bold: true });
  text("RX", 32.6, 39.4, 1.25, { align: "right", bold: true });
  text("ON", 46.4, 31.5, 1.25, { align: "left", bold: true });
  // Part outlines: the 28-pin chip's socket, the USB chip and the crystal
  outline(25.9, 13.2, 64.1, 22.8); outline(15.4, 34.4, 23.6, 42.6); outline(24.8, 26.6, 37.2, 32.4);
  text("ICSP", 19.5, 44.3, 1.1);
  g.beginPath(); g.arc(X(16.2), Y(41.7), 0.5 * k, 0, Math.PI * 2); g.fill(); // pin-1 dots
  // glTF's texture origin is the top-left corner while three.js plane UVs run bottom-up, so the
  // image must be stored upside-down for the text to read the right way up on the board.
  const flipped = createCanvas(W, H), fg = flipped.getContext("2d");
  fg.translate(0, H); fg.scale(1, -1); fg.drawImage(c, 0, 0);
  return { buffer: flipped.toBuffer("image/webp", 86), mime: "image/webp" as const };
}

/**
 * A flat sheet of printed labels on a solid base colour, for the top face of a part
 * (a breadboard cap, say). Label positions are in millimetres from the sheet's
 * centre, x to the right and z toward the viewer, matching the 3D scene axes.
 */
export function labelSheet(o: { w: number; d: number; base: string; ink: string; labels: Array<{ t: string; x: number; z: number; h: number; bold?: boolean; align?: CanvasTextAlign }> }) {
  silkFonts();
  const W = 1024, H = Math.max(64, Math.round((W * o.d) / o.w)), k = W / o.w;
  const c = createCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = o.base; g.fillRect(0, 0, W, H);
  g.fillStyle = o.ink; g.textBaseline = "middle";
  for (const l of o.labels) {
    g.font = `${l.bold ? "700" : "600"} ${l.h * k}px ${l.bold ? "UnoSilkBold" : "UnoSilk"}`;
    g.textAlign = l.align ?? "center";
    g.fillText(l.t, (l.x + o.w / 2) * k, (l.z + o.d / 2) * k);
  }
  // glTF's texture origin is top-left while three.js plane UVs run bottom-up: store the image upside-down.
  const f = createCanvas(W, H), fg = f.getContext("2d");
  fg.translate(0, H); fg.scale(1, -1); fg.drawImage(c, 0, 0);
  return { buffer: f.toBuffer("image/webp", 86), mime: "image/webp" as const };
}
