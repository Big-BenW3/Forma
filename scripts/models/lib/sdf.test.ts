/**
 * The distance-field modeller behind the anatomical models. These check that the
 * surface comes out where the field says it is, that the blending and carving
 * operators keep their meaning, and that splitting one surface into labelled
 * parts loses nothing.
 */
import { describe, expect, it } from "vitest";
import { box, capsule, ellipsoid, meshSDF, mirrorX, shell, smin, sphere, splitByLabel, subtract, union } from "./sdf";

const radii = (g: import("three").BufferGeometry) => {
  const p = g.getAttribute("position");
  const r: number[] = [];
  for (let i = 0; i < p.count; i++) r.push(Math.hypot(p.getX(i), p.getY(i), p.getZ(i)));
  return r;
};

describe("primitives and operators", () => {
  it("sphere is negative inside, zero on the surface, positive outside", () => {
    const s = sphere([0, 0, 0], 1);
    expect(s(0, 0, 0)).toBeCloseTo(-1);
    expect(s(1, 0, 0)).toBeCloseTo(0);
    expect(s(2, 0, 0)).toBeCloseTo(1);
  });

  it("smooth minimum never exceeds the plain minimum and equals it when far apart", () => {
    expect(smin(0.2, 0.3, 0.5)).toBeLessThanOrEqual(0.2);
    expect(smin(0.2, 5, 0.5)).toBeCloseTo(0.2);
  });

  it("union keeps both shapes; subtract carves a hole", () => {
    const u = union(0.01, sphere([-1, 0, 0], 0.5), sphere([1, 0, 0], 0.5));
    expect(u(-1, 0, 0)).toBeLessThan(0);
    expect(u(1, 0, 0)).toBeLessThan(0);
    expect(u(0, 0, 0)).toBeGreaterThan(0);
    const holed = subtract(box([0, 0, 0], [1, 1, 1]), sphere([0, 0, 0], 0.5));
    expect(holed(0, 0, 0)).toBeGreaterThan(0); // carved out
    expect(holed(0.8, 0.8, 0.8)).toBeLessThan(0); // material left in the corner
  });

  it("union skips a far-away term via its bounding box but gives the same answer", () => {
    const near = sphere([0, 0, 0], 1);
    const far = sphere([100, 0, 0], 1);
    expect(union(0.05, near, far)(0.5, 0, 0)).toBeCloseTo(near(0.5, 0, 0));
  });

  it("mirrorX makes a shape authored on +x appear on -x too", () => {
    const m = mirrorX(sphere([1, 0, 0], 0.2));
    expect(m(-1, 0, 0)).toBeCloseTo(-0.2);
    expect(m.box!.min[0]).toBeLessThanOrEqual(-1.2);
  });

  it("shell is hollow: inside the wall is negative, the centre is not", () => {
    const sh = shell(sphere([0, 0, 0], 1), 0.05);
    expect(sh(1, 0, 0)).toBeLessThan(0);
    expect(sh(0, 0, 0)).toBeGreaterThan(0);
  });

  it("capsule and ellipsoid have the expected extents", () => {
    expect(capsule([0, 0, 0], [0, 2, 0], 0.5)(0, 2.5, 0)).toBeCloseTo(0);
    expect(ellipsoid([0, 0, 0], [2, 1, 1])(2, 0, 0)).toBeCloseTo(0, 5);
  });
});

describe("meshSDF", () => {
  it("puts the vertices of a meshed sphere on the sphere", async () => {
    const g = await meshSDF(sphere([0, 0, 0], 1), { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2], cell: 0.05 });
    const r = radii(g);
    expect(r.length).toBeGreaterThan(500);
    for (const v of r) expect(Math.abs(v - 1)).toBeLessThan(0.01);
  });

  it("produces outward normals and consistent winding", async () => {
    const g = await meshSDF(sphere([0, 0, 0], 1), { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2], cell: 0.08 });
    const p = g.getAttribute("position"), n = g.getAttribute("normal"), idx = g.getIndex()!;
    for (let i = 0; i < p.count; i += 7) expect(p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) + p.getZ(i) * n.getZ(i)).toBeGreaterThan(0.9);
    // face normals from the winding point outward too
    let outward = 0;
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2);
      const ux = p.getX(b) - p.getX(a), uy = p.getY(b) - p.getY(a), uz = p.getZ(b) - p.getZ(a);
      const vx = p.getX(c) - p.getX(a), vy = p.getY(c) - p.getY(a), vz = p.getZ(c) - p.getZ(a);
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * p.getX(a) + ny * p.getY(a) + nz * p.getZ(a) > 0) outward++;
    }
    expect(outward / (idx.count / 3)).toBeGreaterThan(0.99);
  });

  it("simplifies to the triangle budget and colours every vertex", async () => {
    const g = await meshSDF(sphere([0, 0, 0], 1), { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2], cell: 0.04, tris: 800, color: () => [1, 0, 0] });
    expect(g.getIndex()!.count / 3).toBeLessThanOrEqual(800);
    expect(g.getAttribute("color").count).toBe(g.getAttribute("position").count);
  });

  it("refuses a grid that would not fit in memory", async () => {
    await expect(meshSDF(sphere([0, 0, 0], 1), { min: [-10, -10, -10], max: [10, 10, 10], cell: 0.001 })).rejects.toThrow(/too large/);
  });
});

describe("splitByLabel", () => {
  it("splits one surface into parts without losing a triangle", async () => {
    const g = await meshSDF(sphere([0, 0, 0], 1), { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2], cell: 0.08 });
    const parts = splitByLabel(g, (p) => (p[1] > 0 ? "top" : "bottom"));
    expect(Object.keys(parts).sort()).toEqual(["bottom", "top"]);
    const total = Object.values(parts).reduce((n, q) => n + q.getIndex()!.count, 0);
    expect(total).toBe(g.getIndex()!.count);
    // every vertex of the top part is in the top half (within a cell)
    const tp = parts.top.getAttribute("position");
    for (let i = 0; i < tp.count; i++) expect(tp.getY(i)).toBeGreaterThan(-0.1);
  });
});
