/**
 * Rebuilds every procedural model (GLB + manifest) into public/models.
 * Usage: npm run models            (all)
 *        npm run models -- brain   (only files whose name contains "brain")
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const filter = process.argv[2];
const dir = path.join(process.cwd(), "scripts/models");
const files = readdirSync(dir).filter((f) => /^[a-z]+_[a-z_]+\.ts$/.test(f) && f !== "build_all.ts" && (!filter || f.includes(filter)));
for (const f of files) {
  process.stdout.write(`${f} ... `);
  const r = spawnSync("npx", ["tsx", path.join(dir, f)], { encoding: "utf8" });
  if (r.status !== 0) {
    console.log("FAILED\n" + (r.stderr || r.stdout));
    process.exit(1);
  }
  console.log(r.stdout.trim().split("\n").pop());
}
