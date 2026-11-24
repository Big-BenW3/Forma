/**
 * Discipline adapter contract
 * ===========================
 * The workspace shell is discipline-agnostic. Anything that differs between
 * disciplines is supplied through one adapter object that the shell calls
 * without knowing which discipline it is talking to.
 *
 * Adding a discipline = content + a GLB + registering ONE adapter in
 * ./registry.ts. If adding a discipline would ever require opening the
 * workspace component, the layering is wrong: fix it here instead.
 */
import type { ComponentType, ReactNode } from "react";
import type { Block, Lesson, Manifest, Part } from "@/content/schema";
import type { CutConfig } from "@/engine/Cutaway";
import type { Snapshot, Verdict } from "@/validators";

export interface SceneProps {
  lesson: Lesson;
  manifest: Manifest;
}

export interface BlockProps {
  lesson: Lesson;
  manifest: Manifest;
  block: Extract<Block, { type: "custom" }>;
}

export interface PracticeProps {
  lesson: Lesson;
  snapshot: Snapshot;
  verdict: Verdict;
  /** Record a fact the validator will see (e.g. an emulator trace) */
  setFacts: (facts: Record<string, unknown>) => void;
  setCode: (code: string) => void;
}

export interface DisciplineAdapter {
  id: string;
  /** Cut-away plane for this lesson's scene, if it has one */
  cut?: (lesson: Lesson) => CutConfig | undefined;
  /** Soft contact shadow under the object */
  ground?: (lesson: Lesson) => boolean;
  /** Extra controls in the pill bar under the canvas (cutaway slider, layers, ...) */
  ToolbarExtra?: ComponentType<SceneProps>;
  /** Rendered inside the 3D scene (emulator-driven emissive, plan highlighting) */
  SceneExtras?: ComponentType<SceneProps>;
  /** Renders `custom` blocks in the reference tabs */
  blocks?: Record<string, ComponentType<BlockProps>>;
  /** Extra action(s) in an inspector card's footer (e.g. "Section this bone") */
  InspectorExtra?: ComponentType<SceneProps & { part: Part }>;
  /** Replaces the default practice card body (e.g. the code editor) */
  Practice?: ComponentType<PracticeProps>;
  /**
   * Replaces the whole centre stage. Used by terminal lessons, which have no 3D
   * scene, so `manifest` is null there; it is only called for lessons whose layout
   * is "terminal" (see Workspace).
   */
  Stage?: ComponentType<{ lesson: Lesson; manifest: Manifest | null; children?: ReactNode }>;
  /**
   * Called when a part is located from the Parts flyout, so the adapter can
   * reveal it first (peel layers, open the cut-away) before the camera flies in.
   */
  reveal?: (partId: string, lesson: Lesson, manifest: Manifest) => void;
}
