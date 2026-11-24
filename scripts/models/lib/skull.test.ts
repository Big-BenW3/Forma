/**
 * The skull is one surface cut into bones along its sutures. These points are
 * landmarks on the local skull frame (see lib/skull.ts): each must land in the
 * bone an anatomist would name.
 */
import { describe, expect, it } from "vitest";
import { skullBone } from "./skull";

describe("skullBone", () => {
  const cases: Array<[string, [number, number, number], string]> = [
    ["forehead", [0, 0.02, 0.085], "bone_frontal"],
    ["crown, behind the coronal suture", [0.03, 0.08, -0.02], "bone_parietal"],
    ["back of the head", [0, -0.01, -0.11], "bone_occipital"],
    ["just above the ear", [0.07, -0.035, -0.02], "bone_temporal"],
    ["cheekbone", [0.052, -0.06, 0.06], "bone_zygomatic"],
    ["upper jaw beside the nose", [0.02, -0.085, 0.085], "bone_maxilla"],
    ["bridge of the nose", [0.004, -0.05, 0.09], "bone_nasal"],
    ["temple, in front of the temporal bone", [0.068, -0.03, 0.03], "bone_sphenoid"],
  ];
  for (const [what, p, bone] of cases) it(`${what} is ${bone}`, () => expect(skullBone(p)).toBe(bone));

  it("is symmetric left and right", () => {
    for (const [, p] of cases) expect(skullBone([-p[0], p[1], p[2]])).toBe(skullBone(p));
  });
});
