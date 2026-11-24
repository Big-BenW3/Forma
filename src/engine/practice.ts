"use client";
/**
 * Practice store
 * ==============
 * Holds the FACTS a validator needs that are not "which parts were opened":
 * identification answers, typed code, and discipline-specific facts such as an
 * emulator trace. The workspace composes a Snapshot from this plus the
 * workspace store. It never holds a verdict.
 */
import { create } from "zustand";
import type { Snapshot } from "@/validators";

interface PracticeState {
  lessonKey: string | null;
  /** Identification mode: labels are hidden and the next click answers the current round */
  active: boolean;
  round: number;
  answers: NonNullable<Snapshot["answers"]>;
  code: string;
  facts: Record<string, unknown>;
  start: (key: string, code?: string) => void;
  setActive: (v: boolean) => void;
  answer: (round: number, partId: string) => void;
  nextRound: () => void;
  setCode: (code: string) => void;
  setFacts: (facts: Record<string, unknown>) => void;
}

export const usePractice = create<PracticeState>((set) => ({
  lessonKey: null,
  active: false,
  round: 0,
  answers: {},
  code: "",
  facts: {},
  start: (key, code = "") =>
    set((s) => (s.lessonKey === key ? s : { lessonKey: key, active: false, round: 0, answers: {}, code, facts: {} })),
  setActive: (v) => set({ active: v }),
  answer: (round, partId) =>
    set((s) => {
      const prev = s.answers[String(round)];
      return { answers: { ...s.answers, [String(round)]: { partId, attempts: (prev?.attempts ?? 0) + 1 } } };
    }),
  nextRound: () => set((s) => ({ round: s.round + 1 })),
  setCode: (code) => set({ code }),
  setFacts: (facts) => set((s) => ({ facts: { ...s.facts, ...facts } })),
}));
