"use client";
/**
 * Mechatronics adapter.
 *
 *   - Lesson 2 uses the shared layer peel (plastic cover -> metal clips).
 *   - Lessons 3 and 4 run a real sketch: the C++ editor posts to /api/v1/compile
 *     (arduino-cli), and the HEX runs in an AVR emulator in a Web Worker. Its pin
 *     state lights the 3D LED (MechSceneExtras).
 *   - Lesson 4 adds a Press button to the scene bar. The button part's own
 *     Hold / Toggle control (declared in the lesson content) decides whether it
 *     is held down or latched.
 */
import type { DisciplineAdapter, SceneProps } from "../types";
import { SceneToolbar, VariantButton, cutOf, revealPart } from "../shared/sceneControls";
import { useWorkspace } from "@/engine/store";
import { CodeLab } from "./CodeLab";
import { MechSceneExtras } from "./SceneExtras";
import { useMech } from "./store";
import type { PracticeProps } from "../types";

function PressButton({ lesson }: SceneProps) {
  const mode = useWorkspace((s) => s.controls[lesson.options.buttonPart as string]?.mode) ?? "hold";
  const { pressed, latched, setPressed } = useMech();
  const base = "flex h-8 items-center rounded-[7px] px-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] select-none touch-none";
  const on = mode === "toggle" ? latched : pressed;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={mode === "toggle" ? "Click the button to latch it, click again to release" : "Hold to press the button"}
      className={`${base} ${on ? "bg-ink text-surface" : "border border-line-strong text-ink hover:bg-ground-deep"}`}
      onPointerDown={() => {
        if (mode === "hold") setPressed(true);
      }}
      onPointerUp={() => {
        if (mode === "hold") setPressed(false);
      }}
      onPointerLeave={() => {
        if (mode === "hold" && useMech.getState().pressed) setPressed(false);
      }}
      onPointerCancel={() => mode === "hold" && setPressed(false)}
      onKeyDown={(e) => {
        if (mode === "hold" && (e.key === " " || e.key === "Enter") && !e.repeat) setPressed(true);
      }}
      onKeyUp={(e) => {
        if (mode === "hold" && (e.key === " " || e.key === "Enter")) setPressed(false);
      }}
      onClick={() => {
        if (mode === "toggle") {
          const next = !useMech.getState().latched;
          useMech.setState({ latched: next });
          setPressed(next);
        }
      }}
    >
      {mode === "toggle" ? (latched ? "Release" : "Latch button") : "Hold button"}
    </button>
  );
}

function Toolbar(props: SceneProps) {
  return (
    <>
      <SceneToolbar {...props} />
      {typeof props.lesson.options.buttonPart === "string" && <PressButton {...props} />}
    </>
  );
}

function Practice(props: PracticeProps) {
  const v = props.lesson.practice.validator;
  return v === "blink_led" || v === "button_led" ? <CodeLab {...props} /> : null;
}

export const mechatronicsAdapter: DisciplineAdapter = {
  id: "mechatronics",
  cut: cutOf,
  ground: (lesson) => lesson.options.floating !== true,
  ToolbarExtra: Toolbar,
  SceneExtras: MechSceneExtras,
  InspectorExtra: VariantButton,
  reveal: revealPart,
  Practice,
};
