/**
 * Discipline record: Medicine & Surgery.
 * The four tab ids are fixed per discipline; each lesson supplies the content.
 */
import { SCHEMA_VERSION, type Discipline } from "@/content/schema";

export const medicine: Discipline = {
  schemaVersion: SCHEMA_VERSION,
  id: "medicine",
  name: "Medicine & Surgery",
  tagline: "Learn the body from the inside out.",
  description: "Start with a single cell, peel the body layer by layer, then open the brain. Every structure is a part you can click.",
  order: 1,
  adapter: "medicine",
  tabs: [
    { id: "overview", label: "Overview" },
    { id: "structures", label: "Structures" },
    { id: "clinical", label: "Clinical" },
    { id: "specifications", label: "Specifications" },
  ],
  // Lessons are appended here as they ship; order is teaching order.
  lessonIds: ["the_cell", "the_skeleton", "the_brain"],
};
