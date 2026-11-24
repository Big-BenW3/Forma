/**
 * Copies Monaco's prebuilt AMD bundle into public/monaco so the editor is
 * served from our own origin (no CDN: works offline and on a locked-down
 * school network). Runs before dev and build; the copy is git-ignored.
 * Monaco is only fetched when a lesson with an editor is opened.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const from = resolve("node_modules/monaco-editor/min/vs");
const to = resolve("public/monaco/vs");
if (!existsSync(from)) {
  console.warn("monaco-editor not installed; skipping copy");
  process.exit(0);
}
if (existsSync(resolve(to, "loader.js"))) process.exit(0); // already copied
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("monaco copied to public/monaco/vs");
