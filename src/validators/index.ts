/**
 * Validator registry. Maps a lesson's `practice.validator` id to its function.
 *
 * Shared by the browser and the server. Adding a discipline's validator is one
 * import and one line here; nothing else in the progress system changes.
 */
import { explore, identify } from "./generic";
import { first_program, memory_lab } from "./software";
import { blink_led, button_led } from "./mechatronics";
import type { Validator, Verdict, Snapshot } from "./types";
import type { Lesson } from "@/content/schema";

export const validators: Record<string, Validator> = {
  explore,
  identify,
  first_program,
  memory_lab,
  blink_led,
  button_led,
};

/** Registers extra validators (called by discipline modules at import time). */
export function registerValidators(extra: Record<string, Validator>) {
  Object.assign(validators, extra);
}

export function runValidator(lesson: Lesson, snapshot: Snapshot): Verdict {
  const fn = validators[lesson.practice.validator];
  if (!fn) throw new Error(`No validator registered for "${lesson.practice.validator}"`);
  return fn(lesson, snapshot);
}

export type { Snapshot, Verdict, Check, Validator } from "./types";
