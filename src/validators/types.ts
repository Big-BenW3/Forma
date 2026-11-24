/**
 * Validator types
 * ===============
 * A validator decides whether a student has completed a lesson's practice.
 *
 * Two rules keep this honest:
 *
 *  1. A validator is a PURE FUNCTION of (lesson, snapshot). No clocks, no
 *     randomness, no I/O. That is what lets the exact same code run in the
 *     browser (to show live feedback) and on the server (to decide whether a
 *     completion is real). If the two ever disagreed, progress would be
 *     corrupted silently, so they share one implementation.
 *
 *  2. A snapshot contains FACTS, never verdicts: what the student examined,
 *     what they answered, what they typed, what the emulator did. The
 *     verdict is always computed from facts, so a client cannot simply claim
 *     "passed".
 *
 * `schemaVersion` on the snapshot lets old stored evidence stay readable when
 * its shape changes.
 */
import type { Lesson } from "@/content/schema";

export interface Snapshot {
  schemaVersion: 1;
  /** "<discipline>/<lesson>" */
  lessonKey: string;
  /** Part ids the student opened */
  examined: string[];
  /** Identification answers: round index -> the part id they finally chose, plus attempts */
  answers?: Record<string, { partId: string; attempts: number }>;
  /** Source code the student wrote (software and mechatronics lessons) */
  code?: string;
  /** Anything else a discipline needs to record, as plain JSON */
  facts?: Record<string, unknown>;
}

export interface Check {
  id: string;
  label: string;
  passed: boolean;
  /** Short explanation shown when a check fails */
  detail?: string;
}

export interface Verdict {
  passed: boolean;
  checks: Check[];
}

export type Validator = (lesson: Lesson, snapshot: Snapshot) => Verdict;

/** Combines checks into a verdict: passed only if every check passed. */
export function verdict(checks: Check[]): Verdict {
  return { passed: checks.length > 0 && checks.every((c) => c.passed), checks };
}
