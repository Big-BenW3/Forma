/**
 * Adapter registry. The ONLY place that knows which disciplines have custom
 * behaviour. Adding a discipline = import its adapter here and add one line.
 * `generic` is the fallback so a discipline with no special needs works at all.
 */
import type { DisciplineAdapter } from "./types";
import { medicineAdapter } from "./medicine/adapter";
import { architectureAdapter } from "./architecture/adapter";
import { softwareAdapter } from "./software/adapter";
import { mechatronicsAdapter } from "./mechatronics/adapter";

const generic: DisciplineAdapter = { id: "generic" };

const adapters: Record<string, DisciplineAdapter> = {
  generic,
  medicine: medicineAdapter,
  architecture: architectureAdapter,
  software: softwareAdapter,
  mechatronics: mechatronicsAdapter,
};

export function getAdapter(id: string): DisciplineAdapter {
  return adapters[id] ?? generic;
}
