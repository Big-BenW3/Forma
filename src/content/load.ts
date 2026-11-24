import "server-only";
/**
 * Server-side manifest loader. Manifests ship in /public/models next to their
 * GLBs; we read and validate them on the server so the browser receives a
 * checked object and never has to fetch JSON before it can start the GLB.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Manifest, type Lesson } from "./schema";

async function readManifest(sceneId: string): Promise<Manifest> {
  const file = path.join(process.cwd(), "public", "models", `${sceneId}.manifest.json`);
  return Manifest.parse(JSON.parse(await readFile(file, "utf8")));
}

/** Manifests for the lesson's main scene (key "main") and each declared variant scene. */
export async function loadManifests(lesson: Lesson): Promise<Record<string, Manifest>> {
  const out: Record<string, Manifest> = {};
  if (lesson.scene) out.main = await readManifest(lesson.scene.id);
  const variants = (lesson.options.variants ?? {}) as Record<string, { scene: string }>;
  for (const [key, v] of Object.entries(variants)) out[key] = await readManifest(v.scene);
  return out;
}
