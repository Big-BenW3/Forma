"use client";
/**
 * Medicine adapter.
 *
 * What differs for anatomy, expressed through the generic adapter contract:
 *   - a cut-away plane (cell, brain) driven by a slider in the control bar,
 *   - a layer peel slider (skeleton: skin -> muscle -> connective tissue -> bone),
 *   - "Section this bone" on long bones (opens the cross-section variant scene),
 *   - `reveal`: peel layers away before flying to a deep structure.
 *
 * All four are shared controls (./shared/sceneControls); which a lesson uses is
 * read from `lesson.options`, so new anatomy lessons are content-only.
 */
import type { DisciplineAdapter } from "../types";
import { SceneToolbar, VariantButton, cutOf, revealPart } from "../shared/sceneControls";

export const medicineAdapter: DisciplineAdapter = {
  id: "medicine",
  cut: cutOf,
  ground: (lesson) => lesson.options.floating !== true,
  ToolbarExtra: SceneToolbar,
  InspectorExtra: VariantButton,
  reveal: revealPart,
};
