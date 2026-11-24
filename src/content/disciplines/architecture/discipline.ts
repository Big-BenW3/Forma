/**
 * Discipline record: Architecture.
 */
import { SCHEMA_VERSION, type Discipline } from "@/content/schema";

export const architecture: Discipline = {
  schemaVersion: SCHEMA_VERSION,
  id: "architecture",
  name: "Architecture",
  tagline: "Read a building the way an architect does.",
  description: "Walk through a three-bedroom house in plan and in 3D, take the roof off, cut a section through the walls and see how the drawings and the building are the same thing.",
  order: 3,
  adapter: "architecture",
  tabs: [
    { id: "overview", label: "Overview" },
    { id: "drawings", label: "Drawings" },
    { id: "rooms", label: "Rooms" },
    { id: "specifications", label: "Specifications" },
  ],
  lessonIds: ["examine_a_house"],
};
