/**
 * Discipline record: Software Engineering.
 *
 * It starts from the machine, not from a language: what a computer is made of,
 * where a program's data lives, then writing a first program for a tiny CPU
 * that runs in the browser.
 */
import { SCHEMA_VERSION, type Discipline } from "@/content/schema";

export const software: Discipline = {
  schemaVersion: SCHEMA_VERSION,
  id: "software",
  name: "Software Engineering",
  tagline: "Start from the machine, then write for it.",
  description: "Take a computer apart in layers, look inside its memory down to a single cell, then write your first program for a small CPU that runs in your browser.",
  order: 4,
  adapter: "software",
  tabs: [
    { id: "overview", label: "Overview" },
    { id: "layers", label: "Layers" },
    { id: "instructions", label: "Instructions" },
    { id: "reference", label: "Reference" },
  ],
  lessonIds: ["what_makes_a_computer", "memory", "your_first_program"],
};
