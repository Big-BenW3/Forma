"use client";
/**
 * Software Engineering adapter.
 *
 *   - Layers (lesson 1) and "Zoom into a chip" variants (lesson 2) reuse the shared scene controls.
 *   - Lesson 2's practice is a memory lab (a small RAM you can power off).
 *   - Lesson 3 has no 3D scene: `Stage` replaces the centre with a terminal and the
 *     practice card holds the code editor. See Terminal.tsx and ProgramPractice.tsx.
 *
 * Which behaviour a lesson gets comes from its practice validator id, so adding a
 * lesson that reuses one of these is content-only.
 */
import type { DisciplineAdapter, PracticeProps } from "../types";
import { SceneToolbar, VariantButton, revealPart } from "../shared/sceneControls";
import { MemoryLab } from "./MemoryLab";
import { ProgramPractice } from "./ProgramPractice";
import { TerminalStage } from "./Terminal";

function Practice(props: PracticeProps) {
  switch (props.lesson.practice.validator) {
    case "memory_lab":
      return <MemoryLab {...props} />;
    case "first_program":
      return <ProgramPractice {...props} />;
    default:
      return null;
  }
}

export const softwareAdapter: DisciplineAdapter = {
  id: "software",
  // Floating objects (a schematic stack, a module) get no ground shadow.
  ground: () => false,
  ToolbarExtra: SceneToolbar,
  InspectorExtra: VariantButton,
  reveal: revealPart,
  Practice,
  Stage: TerminalStage,
};
