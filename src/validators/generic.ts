/**
 * Generic validators used by several disciplines.
 *
 *  - `explore`   : the student must open a set of parts.
 *  - `identify`  : the student must find named parts with labels off.
 *
 * Discipline-specific validators (firmware behaviour, plan-to-3D linking,
 * program output) live beside their adapter and register in ./index.ts.
 */
import { verdict, type Validator } from "./types";

interface ExploreParams {
  /** Part ids that must all be examined */
  required: string[];
}

/** The student must open every required part. */
export const explore: Validator = (lesson, snap) => {
  const p = lesson.practice.params as unknown as ExploreParams;
  const names = new Map(lesson.parts.map((x) => [x.id, x.name]));
  return verdict(
    p.required.map((id) => ({
      id,
      label: `Open the ${names.get(id) ?? id}`,
      passed: snap.examined.includes(id),
    })),
  );
};

interface IdentifyParams {
  rounds: Array<{ prompt: string; answer: string }>;
}

/** The student must find each named part, one round at a time. */
export const identify: Validator = (lesson, snap) => {
  const p = lesson.practice.params as unknown as IdentifyParams;
  return verdict(
    p.rounds.map((r, i) => {
      const a = snap.answers?.[String(i)];
      return {
        id: `round_${i}`,
        label: r.prompt,
        passed: !!a && a.partId === r.answer,
        detail: a && a.partId !== r.answer ? "Not quite. Try again." : undefined,
      };
    }),
  );
};
