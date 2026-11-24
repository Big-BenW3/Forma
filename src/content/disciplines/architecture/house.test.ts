/**
 * The house layout is the single source of truth for the 3D model, the plan, the
 * elevation and the section. These checks keep it physically sensible: rooms tile
 * the footprint, openings fit their walls, furniture stands inside its room and
 * clear of the walls, and nothing blocks a doorway.
 */
import { describe, expect, it } from "vitest";
import { EXT_T, FOOTPRINT, FURNITURE, INT_T, OPENINGS, ROOMS, TOTAL_NET_AREA, WALLS, faceAngle, roomById, roomNetArea, wallById, type Furniture } from "./house";

const wallLen = (id: string) => {
  const w = wallById(id);
  return Math.abs(w.b[0] - w.a[0]) + Math.abs(w.b[1] - w.a[1]);
};

/** Plan footprint of an item: width runs along its front, so a sideways-facing item swaps w and d. */
const footprint = (f: Furniture) => {
  const side = f.face === "e" || f.face === "w";
  const hx = (side ? f.d : f.w) / 2, hz = (side ? f.w : f.d) / 2;
  return { x0: f.x - hx, x1: f.x + hx, z0: f.z - hz, z1: f.z + hz };
};

describe("rooms", () => {
  it("tile the footprint exactly, with no overlaps", () => {
    const area = ROOMS.reduce((s, r) => s + (r.x1 - r.x0) * (r.z1 - r.z0), 0);
    expect(area).toBeCloseTo(FOOTPRINT.w * FOOTPRINT.d, 6);
    for (const a of ROOMS)
      for (const b of ROOMS) {
        if (a === b) continue;
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
        expect(ox > 1e-9 && oz > 1e-9, `${a.id} overlaps ${b.id}`).toBe(false);
      }
  });

  it("have a net (inside-the-walls) area smaller than the gross, and a sensible total", () => {
    for (const r of ROOMS) expect(roomNetArea(r)).toBeLessThan((r.x1 - r.x0) * (r.z1 - r.z0));
    expect(TOTAL_NET_AREA).toBeGreaterThan(80);
    expect(TOTAL_NET_AREA).toBeLessThan(FOOTPRINT.w * FOOTPRINT.d);
  });
});

describe("walls and openings", () => {
  it("every wall is axis-aligned and inside the footprint", () => {
    for (const w of WALLS) {
      expect(w.a[0] === w.b[0] || w.a[1] === w.b[1]).toBe(true);
      for (const [x, z] of [w.a, w.b]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(FOOTPRINT.w);
        expect(z).toBeGreaterThanOrEqual(0);
        expect(z).toBeLessThanOrEqual(FOOTPRINT.d);
      }
    }
  });

  it("every opening fits inside its wall and below the ceiling, with no two overlapping", () => {
    for (const o of OPENINGS) {
      expect(o.at).toBeGreaterThanOrEqual(0);
      expect(o.at + o.w).toBeLessThanOrEqual(wallLen(o.wall) + 1e-9);
      expect(o.head).toBeGreaterThan(o.sill);
      expect(o.head).toBeLessThan(2.7);
    }
    for (const a of OPENINGS)
      for (const b of OPENINGS) if (a !== b && a.wall === b.wall) expect(a.at + a.w <= b.at || b.at + b.w <= a.at).toBe(true);
  });

  it("doors are at least 0.8 m wide and windows sit above the floor", () => {
    for (const o of OPENINGS) {
      if (o.kind === "door") expect(o.w).toBeGreaterThanOrEqual(0.8);
      if (o.kind === "window") expect(o.sill).toBeGreaterThan(0.3);
    }
  });

  it("the front door opens inward", () => {
    const front = OPENINGS.find((o) => o.wall === "ext_s" && o.kind === "door");
    expect(front?.swing).toBe("in-b");
  });
});

describe("furniture", () => {
  it("every item belongs to a room that exists", () => {
    for (const f of FURNITURE) expect(roomById(f.room), f.room).toBeTruthy();
  });

  it("every item stands inside its room, clear of the walls", () => {
    for (const f of FURNITURE) {
      const r = roomById(f.room);
      const t = (ext: boolean) => (ext ? EXT_T : INT_T) / 2 - 0.02; // 2 cm tolerance for items touching a wall
      const fp = footprint(f);
      const where = `${f.kind} in ${f.room}`;
      expect(fp.x0, where).toBeGreaterThanOrEqual(r.x0 + t(r.x0 === 0));
      expect(fp.x1, where).toBeLessThanOrEqual(r.x1 - t(r.x1 === FOOTPRINT.w));
      expect(fp.z0, where).toBeGreaterThanOrEqual(r.z0 + t(r.z0 === 0));
      expect(fp.z1, where).toBeLessThanOrEqual(r.z1 - t(r.z1 === FOOTPRINT.d));
    }
  });

  it("nothing stands in a doorway", () => {
    for (const o of OPENINGS.filter((q) => q.kind !== "window")) {
      const w = wallById(o.wall);
      const alongX = w.a[1] === w.b[1];
      // the doorway plus 0.6 m of clear floor either side of the wall
      const box = alongX
        ? { x0: w.a[0] + o.at, x1: w.a[0] + o.at + o.w, z0: w.a[1] - 0.6, z1: w.a[1] + 0.6 }
        : { x0: w.a[0] - 0.6, x1: w.a[0] + 0.6, z0: w.a[1] + o.at, z1: w.a[1] + o.at + o.w };
      for (const f of FURNITURE.filter((q) => q.kind !== "rug")) {
        const fp = footprint(f);
        const overlap = fp.x0 < box.x1 && fp.x1 > box.x0 && fp.z0 < box.z1 && fp.z1 > box.z0;
        expect(overlap, `${f.kind} in ${f.room} blocks ${o.kind} on ${o.wall}`).toBe(false);
      }
    }
  });

  it("each bedroom has a bed, the kitchen a hob, sink and fridge, the bathroom a toilet and basin", () => {
    const has = (room: string, kind: Furniture["kind"]) => FURNITURE.some((f) => f.room === room && f.kind === kind);
    for (const r of ROOMS.filter((q) => q.id.startsWith("room_bedroom"))) expect(has(r.id, "bed_double") || has(r.id, "bed_single"), r.id).toBe(true);
    for (const k of ["hob", "sink", "fridge"] as const) expect(has("room_kitchen", k)).toBe(true);
    for (const k of ["toilet", "basin"] as const) expect(has("room_bathroom", k)).toBe(true);
  });

  it("face angles turn the authored front (+z) the right way", () => {
    const front = (f: Furniture["face"]) => {
      const a = faceAngle(f);
      return [Math.round(Math.sin(a)), Math.round(Math.cos(a))]; // where +z ends up, as (x, z)
    };
    expect(front("s")).toEqual([0, 1]);
    expect(front("e")).toEqual([1, 0]);
    expect(front("n")).toEqual([0, -1]);
    expect(front("w")).toEqual([-1, 0]);
  });
});
