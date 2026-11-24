/**
 * Content / manifest parity. A lesson is data, so most breakage is a typo in
 * an id. These tests fail at build time instead of showing a blank card.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { allDisciplines, allLessons, lessonsOf } from "./registry";
import { Manifest } from "./schema";

const manifestOf = (scene: string) =>
  Manifest.parse(JSON.parse(readFileSync(path.join(process.cwd(), "public/models", `${scene}.manifest.json`), "utf8")));

describe("registry", () => {
  it("every discipline lists only lessons that exist, in order", () => {
    for (const d of allDisciplines) {
      expect(lessonsOf(d).length).toBe(d.lessonIds.length);
      lessonsOf(d).forEach((l, i) => expect(l.order).toBe(i + 1));
    }
  });

  it("every lesson belongs to a discipline that lists it", () => {
    for (const l of allLessons) {
      const d = allDisciplines.find((x) => x.id === l.disciplineId);
      expect(d?.lessonIds).toContain(l.id);
    }
  });

  it("every lesson supplies exactly the discipline's tabs", () => {
    for (const l of allLessons) {
      const d = allDisciplines.find((x) => x.id === l.disciplineId)!;
      expect(Object.keys(l.tabs).sort()).toEqual(d.tabs.map((t) => t.id).sort());
    }
  });
});

describe("lesson <-> manifest parity", () => {
  const canvas = allLessons.filter((l) => l.layout === "canvas" && l.scene);

  it.each(canvas.map((l) => [`${l.disciplineId}/${l.id}`, l] as const))("%s: ids match the model", (_k, l) => {
    const scenes = [l.scene!.id, ...Object.values((l.options.variants ?? {}) as Record<string, { scene: string }>).map((v) => v.scene)];
    const nodes = new Set(scenes.flatMap((s) => Object.keys(manifestOf(s).nodes)));
    // Every lesson part must exist in at least one of its scenes.
    for (const p of l.parts) expect(nodes.has(p.id), `part ${p.id} is not in ${scenes.join(", ")}`).toBe(true);
    // Every non-decor model part needs a card.
    for (const s of scenes) {
      const m = manifestOf(s);
      for (const [id, n] of Object.entries(m.nodes)) {
        if (n.decor) continue;
        expect(l.parts.some((p) => p.id === id), `${id} in ${s} has no card`).toBe(true);
      }
    }
  });

  it.each(canvas.map((l) => [`${l.disciplineId}/${l.id}`, l] as const))("%s: groups and practice reference real things", (_k, l) => {
    const scenes = [l.scene!.id, ...Object.values((l.options.variants ?? {}) as Record<string, { scene: string }>).map((v) => v.scene)];
    const groups = new Set(scenes.flatMap((s) => Object.keys(manifestOf(s).groups)));
    for (const p of l.parts) if (p.group) expect(groups.has(p.group), `${p.id}: unknown group ${p.group}`).toBe(true);
    const ids = new Set(l.parts.map((p) => p.id));
    const params = l.practice.params as { rounds?: { answer: string }[]; required?: string[] };
    for (const r of params.rounds ?? []) expect(ids.has(r.answer)).toBe(true);
    for (const id of params.required ?? []) expect(ids.has(id)).toBe(true);
  });

  it("variant forPart ids are real parts", () => {
    for (const l of canvas) {
      const v = (l.options.variants ?? {}) as Record<string, { forPart: string[] }>;
      for (const { forPart } of Object.values(v)) for (const id of forPart) expect(l.parts.some((p) => p.id === id)).toBe(true);
    }
  });
});

describe("model budgets (from the manifests)", () => {
  const scenes = ["medicine_cell", "medicine_skeleton", "medicine_bone_section", "medicine_brain", "architecture_house", "software_computer", "software_memory", "software_dram_cell", "mechatronics_uno", "mechatronics_breadboard", "mechatronics_blink", "mechatronics_button"];
  it.each(scenes)("%s is a valid manifest with a camera inside its distance limits", (s) => {
    const m = manifestOf(s);
    expect(m.camera.minDistance).toBeLessThan(m.camera.maxDistance);
  });
});

describe("lesson wiring", () => {
  it("every id a discipline lists resolves to a lesson", () => {
    for (const d of allDisciplines) for (const id of d.lessonIds) expect(allLessons.some((l) => l.disciplineId === d.id && l.id === id), `${d.id}/${id}`).toBe(true);
  });
  it("every lesson's practice validator is registered", async () => {
    const { validators } = await import("@/validators");
    for (const l of allLessons) expect(validators[l.practice.validator], `${l.id} -> ${l.practice.validator}`).toBeTypeOf("function");
  });
  it("terminal lessons have no scene and canvas lessons have one", () => {
    for (const l of allLessons) expect(l.layout === "terminal" ? l.scene === null : l.scene !== null, l.id).toBe(true);
  });
});
