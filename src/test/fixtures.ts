/** Shared helpers for UI tests: real lessons and manifests, not mocks. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getLesson } from "@/content/registry";
import type { Manifest } from "@/content/schema";
import { useWorkspace } from "@/engine/store";
import { usePractice } from "@/engine/practice";

export const lesson = (discipline: string, id: string) => {
  const l = getLesson(discipline, id);
  if (!l) throw new Error(`no lesson ${discipline}/${id}`);
  return l;
};

export const manifest = (scene: string): Manifest => JSON.parse(readFileSync(path.join(process.cwd(), "public/models", `${scene}.manifest.json`), "utf8"));

/** Put the shared stores back to their starting state between tests. */
export function resetStores() {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  usePractice.setState(usePractice.getInitialState(), true);
}
