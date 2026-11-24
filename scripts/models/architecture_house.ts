/**
 * Scene: architecture_house  (Architecture, lesson 1)
 *
 * A single-storey, three-bedroom house, generated from the shared layout in
 * src/content/disciplines/architecture/house.ts (the same file the floor-plan
 * drawing is drawn from).
 *
 * Interactive parts (13):
 *   7 rooms (floor + furniture),  exterior walls,  interior walls,
 *   roof,  foundation slab,  doors,  windows.
 *
 * Draw calls are kept low on purpose: each room is ONE mesh (floor and furniture
 * merged, colours baked into vertex colours), and windows are two meshes (frames
 * and glass).
 *
 * Walls, roof and slab are CLOSED solids with `userData.cap`, so the section
 * plane can paint a solid dark cut face (poché) where it passes through them,
 * exactly as an architect's section drawing does.
 */
import * as THREE from "three";
import { SceneBuild } from "./lib/export";
import { group, mat, merge, mesh, tint } from "./lib/geo";
import { furnitureGeometry } from "./lib/furniture";
import * as textures from "./lib/textures";
import {
  EAVE, EXT_T, FOOTPRINT, FURNITURE, INT_T, OPENINGS, ROOF_RISE, ROOMS, SLAB_T, WALLS, WALL_H, type Opening, type Wall, wallById,
} from "../../src/content/disciplines/architecture/house";

// ------------------------------------------------------------------ helpers
/** Axis-aligned box: size (w,h,d), centre x/z, base y. Returns a vertex-coloured geometry. */
function box(w: number, h: number, d: number, cx: number, y0: number, cz: number, color: string) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(cx, y0 + h / 2, cz);
  return tint(g, color);
}

/**
 * Extrudes a convex polygon given in (z, y) along the x axis, from x0 to x1.
 * Used for the roof slabs (a parallelogram) and the gable ends (a triangle).
 * Winding is checked after building, so the polygon may be given either way round.
 */
function prismX(poly: Array<[number, number]>, x0: number, x1: number, color: string) {
  const n = poly.length;
  const pos: number[] = [];
  const idx: number[] = [];
  for (const [z, y] of poly) pos.push(x0, y, z);
  for (const [z, y] of poly) pos.push(x1, y, z);
  for (let i = 1; i < n - 1; i++) {
    idx.push(0, i, i + 1); // cap at x0
    idx.push(n, n + i + 1, n + i); // cap at x1
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    idx.push(i, j, n + j, i, n + j, n + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // Make the surface face outwards: a negative signed volume means the winding is inside-out.
  let vol = 0;
  const p = g.getAttribute("position");
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) {
    a.fromBufferAttribute(p, idx[i]); b.fromBufferAttribute(p, idx[i + 1]); c.fromBufferAttribute(p, idx[i + 2]);
    vol += a.dot(b.clone().cross(c)) / 6;
  }
  if (vol < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    g.setIndex(idx);
  }
  // Flat shading needs unshared vertices.
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return tint(flat, color);
}

const isX = (w: Wall) => w.a[1] === w.b[1];
const tOf = (w: Wall) => (w.kind === "ext" ? EXT_T : INT_T);

/** World-space box occupying [s0,s1] along the wall, with height range [y0,y1]. */
function wallBox(w: Wall, s0: number, s1: number, y0: number, y1: number, color: string, thick = tOf(w)) {
  const len = s1 - s0;
  const mid = (s0 + s1) / 2;
  if (isX(w)) return box(len, y1 - y0, thick, w.a[0] + mid, y0, w.a[1], color);
  return box(thick, y1 - y0, len, w.a[0], y0, w.a[1] + mid, color);
}

/** Splits a wall around its openings into closed boxes: full-height piers, lintels and sills. */
function wallSolids(w: Wall, color: string) {
  const len = isX(w) ? Math.abs(w.b[0] - w.a[0]) : Math.abs(w.b[1] - w.a[1]);
  const ext = w.kind === "ext" ? EXT_T / 2 : 0; // exterior walls run past the corners so the corners close
  const ops = OPENINGS.filter((o) => o.wall === w.id).sort((p, q) => p.at - q.at);
  const out: THREE.BufferGeometry[] = [];
  let cur = -ext;
  for (const o of ops) {
    if (o.at > cur) out.push(wallBox(w, cur, o.at, 0, WALL_H, color));
    if (o.head < WALL_H) out.push(wallBox(w, o.at, o.at + o.w, o.head, WALL_H, color));
    if (o.sill > 0) out.push(wallBox(w, o.at, o.at + o.w, 0, o.sill, color));
    cur = o.at + o.w;
  }
  if (cur < len + ext) out.push(wallBox(w, cur, len + ext, 0, WALL_H, color));
  return out;
}

/** A frame (four thin bars) for an opening, plus optional extras, in world space. */
function openingFrame(w: Wall, o: Opening, color: string, bar = 0.06, depth = 0.1) {
  const parts: THREE.BufferGeometry[] = [];
  const s0 = o.at, s1 = o.at + o.w, y0 = o.sill, y1 = o.head;
  parts.push(wallBox(w, s0, s0 + bar, y0, y1, color, depth)); // jambs
  parts.push(wallBox(w, s1 - bar, s1, y0, y1, color, depth));
  parts.push(wallBox(w, s0, s1, y1 - bar, y1, color, depth)); // head
  if (o.kind === "window") parts.push(wallBox(w, s0, s1, y0, y0 + bar, color, depth)); // sill
  return parts;
}

// ------------------------------------------------------------------ build
export async function buildHouse() {
  const B = new SceneBuild({ sceneId: "architecture_house", view: [0.7, 0.85, 1.0], fit: 3.7, partFitScale: 1.8, fov: 30 });
  B.group("sleeping", "Bedrooms", "#6f86d8");
  B.group("living", "Living", "#e0a23a");
  B.group("service", "Service rooms", "#3f9f8f");
  B.group("envelope", "Envelope", "#c9684a");
  B.group("structure", "Structure", "#7c8594");
  B.layer("roof", "Roof", true);
  B.layer("building", "Walls and floors");

  const white = mat({ color: "#ffffff", rough: 0.85 });
  const gloss = mat({ color: "#ffffff", rough: 0.35 });
  const glass = mat({ color: "#bcd6e6", rough: 0.1, opacity: 0.22, metal: 0.1 });

  const { w: FW, d: FD } = FOOTPRINT;

  // ---- foundation slab
  {
    const g = box(FW + 0.7, SLAB_T, FD + 0.7, FW / 2, -SLAB_T, FD / 2, "#a9a59b");
    const m = mesh(g, white, "slab_geo");
    m.userData.cap = "#5d5a53";
    m.userData.capOrder = 1;
    B.root.add(B.part(group("x", m), { id: "slab_foundation", name: "Foundation slab", group: "structure", layer: "building", shell: false, anchor: [FW + 0.25, 0, FD / 2], view: [1, 0.5, 0.6], fit: 2.8 }));
  }

  // ---- walls (exterior and interior), plus the gable ends in the exterior part
  {
    const ext: THREE.BufferGeometry[] = [];
    const int: THREE.BufferGeometry[] = [];
    for (const w of WALLS) (w.kind === "ext" ? ext : int).push(...wallSolids(w, w.kind === "ext" ? "#efe6d3" : "#f5f1e8"));
    // Gable triangles, tucked just under the roof slabs
    const topAt = (z: number) => WALL_H + (ROOF_RISE * (z <= FD / 2 ? z : FD - z)) / (FD / 2);
    const tri: Array<[number, number]> = [[-EXT_T / 2, WALL_H - 0.1], [FD + EXT_T / 2, WALL_H - 0.1], [FD / 2, topAt(FD / 2) - 0.19]];
    ext.push(prismX(tri, -EXT_T / 2, EXT_T / 2, "#ece4d4"), prismX(tri, FW - EXT_T / 2, FW + EXT_T / 2, "#ece4d4"));

    const em = mesh(merge(ext), white, "ext_geo");
    em.userData.cap = "#2b3240";
    em.userData.capOrder = 2;
    const im = mesh(merge(int), white, "int_geo");
    im.userData.cap = "#2b3240";
    im.userData.capOrder = 2;
    B.root.add(B.part(group("x", em), { id: "wall_exterior", name: "Exterior walls", group: "envelope", layer: "building", anchor: [0, 1.4, 6.8], view: [-1, 0.5, 0.5], fit: 3.0 }));
    B.root.add(B.part(group("x", im), { id: "wall_interior", name: "Interior walls", group: "structure", layer: "building", anchor: [4.4, 1.4, 6.0], view: [0.2, 1.4, 1], fit: 3.0 }));
  }

  // ---- roof: two slabs meeting at a ridge, clay tiles on top, fascia, gutters,
  // downpipes, ridge tiles, barge boards and a chimney.
  {
    const T = 0.18;
    const topN = (z: number) => WALL_H + 0.04 + (ROOF_RISE * z) / (FD / 2); // +0.04 keeps the wall tops from z-fighting with the slab
    const north: Array<[number, number]> = [[-EAVE, topN(-EAVE)], [FD / 2 + 0.1, topN(FD / 2 + 0.1)], [FD / 2 + 0.1, topN(FD / 2 + 0.1) - T], [-EAVE, topN(-EAVE) - T]];
    const south: Array<[number, number]> = north.map(([z, y]) => [FD - z, y]);
    const x0 = -EAVE - 0.05, x1 = FW + EAVE + 0.05;
    const slabs = [prismX(north, x0, x1, "#ffffff"), prismX(south, x0, x1, "#ffffff")];
    // Tile texture coordinates: u along the eave, v up the slope (so tile rows run parallel to the eave).
    const slope = Math.hypot(FD / 2, ROOF_RISE) / (FD / 2);
    for (const [g, sgn] of [[slabs[0], 1], [slabs[1], -1]] as const) {
      const pp = g.getAttribute("position");
      const uv = new Float32Array(pp.count * 2);
      for (let i = 0; i < pp.count; i++) {
        const z = pp.getZ(i);
        uv[i * 2] = pp.getX(i) / 1.6;
        uv[i * 2 + 1] = ((sgn > 0 ? z + EAVE : FD + EAVE - z) * slope) / 1.6;
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    const tileMat = mat({ color: "#ffffff", rough: 0.8, map: await textures.roofTiles() });
    const tilesM = mesh(merge(slabs), tileMat, "roof_tiles");
    tilesM.userData.cap = "#6a2f1e";
    tilesM.userData.capOrder = 2;

    const trim: THREE.BufferGeometry[] = [];
    // Ridge: half-round ridge tiles
    {
      const r = new THREE.CylinderGeometry(0.13, 0.13, x1 - x0, 16, 1, false, 0, Math.PI);
      r.rotateZ(Math.PI / 2);
      r.rotateX(-Math.PI / 2);
      r.translate(FW / 2, topN(FD / 2) - 0.02, FD / 2);
      trim.push(tint(r.toNonIndexed(), "#8f432b"));
    }
    // Fascia boards along both eaves, gutters and downpipes
    for (const zE of [-EAVE, FD + EAVE]) {
      const yE = topN(-EAVE) - T;
      trim.push(box(x1 - x0, 0.2, 0.03, FW / 2, yE - 0.06, zE, "#f3efe6"));
      const gut = new THREE.CylinderGeometry(0.065, 0.065, x1 - x0, 12, 1, true, Math.PI / 2, Math.PI);
      gut.rotateZ(Math.PI / 2);
      gut.translate(FW / 2, yE - 0.04, zE + (zE < 0 ? -0.07 : 0.07));
      trim.push(tint(gut.toNonIndexed(), "#6e757c"));
      for (const xD of [0.2, FW - 0.2]) {
        trim.push(tint(new THREE.CylinderGeometry(0.035, 0.035, yE, 8).translate(xD, yE / 2 - 0.02, zE + (zE < 0 ? 0.32 : -0.32)).toNonIndexed(), "#6e757c"));
        trim.push(box(0.07, 0.07, EAVE - 0.18, xD, yE - 0.1, zE + (zE < 0 ? 0.2 : -0.2), "#6e757c"));
      }
    }
    // Barge boards along the gable edges
    for (const xB of [x0 - 0.015, x1 + 0.015]) {
      for (const sgn of [1, -1]) {
        const zA = sgn > 0 ? -EAVE : FD + EAVE, zB = FD / 2;
        const len = Math.hypot(zB - zA, topN(FD / 2) - topN(-EAVE));
        const bb = new THREE.BoxGeometry(0.04, 0.22, len);
        bb.rotateX(sgn > 0 ? -Math.atan2(ROOF_RISE, FD / 2) : Math.atan2(ROOF_RISE, FD / 2));
        bb.translate(xB, (topN(-EAVE) + topN(FD / 2)) / 2 - 0.08, (zA + zB) / 2);
        trim.push(tint(bb.toNonIndexed(), "#f3efe6"));
      }
    }
    // Chimney on the north slope above the living-room wall, with a cap and two pots
    {
      const cx = 7.2, cz = 2.6, yb = topN(cz) - 0.3;
      trim.push(box(0.6, topN(FD / 2) + 0.7 - yb, 0.6, cx, yb, cz, "#9c5a43"));
      trim.push(box(0.72, 0.08, 0.72, cx, topN(FD / 2) + 0.7, cz, "#8a8378"));
      for (const dx of [-0.13, 0.13]) trim.push(tint(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 12).translate(cx + dx, topN(FD / 2) + 0.92, cz).toNonIndexed(), "#b5663f"));
    }
    const trimM = mesh(merge(trim), white, "roof_trim");
    B.root.add(B.part(group("x", tilesM, trimM), { id: "roof", name: "Roof", group: "envelope", layer: "roof", shell: true, anchor: [FW * 0.7, WALL_H + ROOF_RISE * 0.55, FD * 0.82], view: [0.4, 0.9, 1], fit: 2.6 }));
  }

  // ---- doors: frame, architrave, panelled leaf and handle; front door gets a step and a canopy
  {
    const parts: THREE.BufferGeometry[] = [];
    for (const o of OPENINGS.filter((q) => q.kind === "door")) {
      const w = wallById(o.wall);
      const front = o.wall === "ext_s";
      const frameC = front ? "#5a3a24" : "#f4f1ea";
      const leafC = front ? "#2f5b4f" : "#f1ede4";
      parts.push(...openingFrame(w, o, frameC, 0.07, tOf(w) + 0.03));
      const s0 = o.at + 0.07, s1 = o.at + o.w - 0.07, top = o.head - 0.07;
      parts.push(wallBox(w, s0, s1, 0.01, top, leafC, 0.045));
      // Raised panels on both faces: two tall over two short
      const pw = (s1 - s0 - 0.24) / 2;
      for (const [y0, y1] of [[0.15, 0.85], [1.0, top - 0.15]] as Array<[number, number]>)
        for (const k of [0, 1]) {
          const a0 = s0 + 0.08 + k * (pw + 0.08);
          parts.push(wallBox(w, a0, a0 + pw, y0, y1, front ? "#29504a" : "#e6e1d6", 0.06));
        }
      // Handle on both faces
      const hs = o.swing === "in-b" ? s0 + 0.08 : s1 - 0.08;
      parts.push(wallBox(w, hs - 0.06, hs + 0.06, 1.0, 1.03, "#b8b2a4", 0.11));
      if (front) {
        // step and canopy
        const sx = w.a[0] + o.at + o.w / 2;
        parts.push(box(o.w + 0.6, 0.15, 0.5, sx, -0.05, FD + EXT_T / 2 + 0.25, "#b5ada0"));
        parts.push(box(o.w + 0.7, 0.08, 0.8, sx, o.head + 0.25, FD + EXT_T / 2 + 0.4, "#f3efe6"));
        for (const dx of [-(o.w / 2 + 0.25), o.w / 2 + 0.25]) parts.push(box(0.05, 0.25, 0.6, sx + dx, o.head, FD + EXT_T / 2 + 0.3, "#5a3a24"));
      }
    }
    const dm = mesh(merge(parts), gloss, "doors_geo");
    B.root.add(B.part(group("x", dm), { id: "doors", name: "Doors", group: "envelope", layer: "building", anchor: [8.5, 1.05, FD], view: [0.3, 0.2, 1], fit: 2.4 }));
  }

  // ---- windows: frames with mullions and transoms, projecting stone sills, glass
  {
    const frames: THREE.BufferGeometry[] = [];
    const panes: THREE.BufferGeometry[] = [];
    for (const o of OPENINGS.filter((q) => q.kind === "window")) {
      const w = wallById(o.wall);
      const FR = "#f6f3ec";
      frames.push(...openingFrame(w, o, FR, 0.07, tOf(w) * 0.6));
      // mullions: split wide windows into casements
      const n = o.w >= 1.9 ? 3 : o.w >= 1.2 ? 2 : 1;
      for (let i = 1; i < n; i++) {
        const c = o.at + (o.w * i) / n;
        frames.push(wallBox(w, c - 0.03, c + 0.03, o.sill, o.head, FR, tOf(w) * 0.5));
      }
      // transom: a fixed top light on tall windows
      if (o.head - o.sill > 1.3) frames.push(wallBox(w, o.at, o.at + o.w, o.head - 0.45, o.head - 0.4, FR, tOf(w) * 0.5));
      panes.push(wallBox(w, o.at + 0.07, o.at + o.w - 0.07, o.sill + 0.06, o.head - 0.07, "#cfe3ee", 0.02));
      // stone sill on the outside face of exterior walls
      if (w.kind === "ext") {
        const out = (w.id === "ext_n" || w.id === "ext_w" ? -1 : 1) * (EXT_T / 2 + 0.03);
        const sb = wallBox(w, o.at - 0.06, o.at + o.w + 0.06, o.sill - 0.06, o.sill, "#d4cfc4", 0.1);
        if (isX(w)) sb.translate(0, 0, out); else sb.translate(out, 0, 0);
        frames.push(sb);
      }
    }
    const fm = mesh(merge(frames), gloss, "window_frames");
    const gm = mesh(merge(panes), glass, "window_glass");
    B.root.add(B.part(group("x", fm, gm), { id: "windows", name: "Windows", group: "envelope", layer: "building", anchor: [5.2 + 1.0, 1.5, FD], view: [0.3, 0.2, 1], fit: 2.4 }));
  }

  // ---- rooms: a textured floor finish and the room's furniture (from FURNITURE)
  {
    const timberMat = mat({ color: "#ffffff", rough: 0.6, map: await textures.timber() });
    const tileMat = mat({ color: "#ffffff", rough: 0.4, map: await textures.tiles() });
    const furnMat = mat({ color: "#ffffff", rough: 0.6 });
    const inset = (r: (typeof ROOMS)[number]) => {
      const t = (ext: boolean) => (ext ? EXT_T : INT_T) / 2;
      return { x0: r.x0 + t(r.x0 === 0), x1: r.x1 - t(r.x1 === FW), z0: r.z0 + t(r.z0 === 0), z1: r.z1 - t(r.z1 === FD) };
    };
    for (const r of ROOMS) {
      const i = inset(r);
      const floor = new THREE.BoxGeometry(i.x1 - i.x0, 0.03, i.z1 - i.z0);
      floor.translate((i.x0 + i.x1) / 2, 0.015, (i.z0 + i.z1) / 2);
      const isTile = r.finish.toLowerCase().includes("tile");
      // Texture coordinates in metres: boards ~0.3 m wide, tiles 0.3 m square
      const pp = floor.getAttribute("position");
      const uv = floor.getAttribute("uv");
      for (let k = 0; k < pp.count; k++) uv.setXY(k, pp.getX(k) / 1.2, pp.getZ(k) / 1.2);
      const fl = mesh(tint(floor, "#ffffff"), isTile ? tileMat : timberMat, `${r.id}_floor`);
      // Skirting boards around the room
      const sk: THREE.BufferGeometry[] = [];
      const H = 0.1, T = 0.015;
      sk.push(box(i.x1 - i.x0, H, T, (i.x0 + i.x1) / 2, 0.03, i.z0 + T / 2, "#f6f3ec"), box(i.x1 - i.x0, H, T, (i.x0 + i.x1) / 2, 0.03, i.z1 - T / 2, "#f6f3ec"));
      sk.push(box(T, H, i.z1 - i.z0, i.x0 + T / 2, 0.03, (i.z0 + i.z1) / 2, "#f6f3ec"), box(T, H, i.z1 - i.z0, i.x1 - T / 2, 0.03, (i.z0 + i.z1) / 2, "#f6f3ec"));
      const furn = furnitureGeometry(FURNITURE.filter((f) => f.room === r.id), 0.03);
      const kids: THREE.Object3D[] = [fl, mesh(merge([...sk, ...(furn ? [furn] : [])]), furnMat, `${r.id}_furniture`)];
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      B.root.add(B.part(group("x", ...kids), { id: r.id, name: r.name, group: r.group, layer: "building", anchor: [cx, 0.9, cz], view: [0.15, 1.5, 0.7], fit: r.id === "room_living" ? 2.6 : r.id === "room_hall" ? 3.2 : 2.9 }));
    }
  }

  // ---- exterior plinth: a darker band at the foot of the outside walls
  {
    const pl: THREE.BufferGeometry[] = [];
    for (const w of WALLS.filter((q) => q.kind === "ext")) {
      const len = isX(w) ? Math.abs(w.b[0] - w.a[0]) : Math.abs(w.b[1] - w.a[1]);
      const out = (w.id === "ext_n" || w.id === "ext_w" ? -1 : 1) * (EXT_T / 2 + 0.012);
      const ops = OPENINGS.filter((o) => o.wall === w.id && o.sill === 0).sort((p, q) => p.at - q.at);
      let cur = -EXT_T / 2 - 0.02;
      const segs: Array<[number, number]> = [];
      for (const o of ops) { segs.push([cur, o.at]); cur = o.at + o.w; }
      segs.push([cur, len + EXT_T / 2 + 0.02]);
      for (const [a0, a1] of segs) {
        const g = wallBox(w, a0, a1, 0, 0.45, "#8f8a80", 0.025);
        if (isX(w)) g.translate(0, 0, out); else g.translate(out, 0, 0);
        pl.push(g);
      }
    }
    const pm = mesh(merge(pl), white, "plinth_geo");
    // Belongs with the exterior walls (same part), so it peels and selects with them.
    B.root.getObjectByName("wall_exterior")!.add(pm);
  }

  return B.write("public/models");
}

buildHouse().then((r) => console.log(JSON.stringify(r)));
