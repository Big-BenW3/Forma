"use client";
/**
 * Architecture-only transient UI state. Selection, cut and layers stay in the
 * shared workspace store; this holds only what no other discipline has.
 */
import { create } from "zustand";

interface ArchState {
  /** Walls drawn as thin outlines (so rooms read like the plan) instead of solid */
  outline: boolean;
  setOutline: (v: boolean) => void;
}

export const useArch = create<ArchState>((set) => ({ outline: false, setOutline: (outline) => set({ outline }) }));
