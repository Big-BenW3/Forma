/**
 * Camera framing on narrow canvases: tall subjects should not shrink on a phone,
 * wide ones should pull back just enough to fit.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FRAMED_ASPECT, MAX_FIT, framingFit } from "./framing";

const manifest = (scene: string) => JSON.parse(readFileSync(path.join(process.cwd(), "public/models", `${scene}.manifest.json`), "utf8"));

const fake = (size: [number, number, number]) => ({
  bounds: { min: [-size[0] / 2, -size[1] / 2, -size[2] / 2] as [number, number, number], max: [size[0] / 2, size[1] / 2, size[2] / 2] as [number, number, number] },
  camera: { position: [0, 0, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number], fov: 30, minDistance: 1, maxDistance: 50 },
});

describe("framingFit", () => {
  it("needs no pull-back on the canvas shape the scenes were framed for, or a wider one", () => {
    expect(framingFit(fake([2, 1, 1]), FRAMED_ASPECT)).toBeCloseTo(1, 5);
    expect(framingFit(fake([2, 1, 1]), 2.2)).toBe(1);
  });

  it("a tall, narrow subject needs none even on a phone", () => {
    expect(framingFit(fake([0.6, 1.8, 0.3]), 390 / 760)).toBe(1);
  });

  it("a wide subject pulls back in proportion to the narrower canvas", () => {
    const fit = framingFit(fake([3, 1, 1]), 0.5);
    expect(fit).toBeGreaterThan(1.8);
    expect(fit).toBeLessThanOrEqual(MAX_FIT);
  });

  it("is clamped for extreme shapes", () => {
    expect(framingFit(fake([10, 0.1, 0.1]), 0.1)).toBe(MAX_FIT);
  });

  it("matches the real scenes: the skeleton stays big on a phone, the house pulls back", () => {
    const phone = 390 / 730;
    expect(framingFit(manifest("medicine_skeleton"), phone)).toBe(1);
    expect(framingFit(manifest("architecture_house"), phone)).toBeGreaterThan(1.5);
  });
});
