/**
 * Compile service: runs arduino-cli for an Arduino Uno sketch and returns the HEX.
 * Server-only. The guard (compile-guard.ts) decides what may be compiled; this
 * file decides how it runs: one job at a time, a hard timeout, a private temp
 * directory per job, a scrubbed environment, and sanitised output.
 *
 * ARDUINO_CLI_BIN overrides the binary (the Docker image has it on PATH; tests
 * point it at a stub).
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile, mkdir, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Gate, HexCache, checkSource, normaliseSource, parseDiagnostics, type Diagnostic } from "./compile-guard";

export const COMPILE_TIMEOUT_MS = 25_000;

export type CompileResult =
  | { ok: true; hex: string; cached: boolean }
  | { ok: false; status: number; message: string; diagnostics: Diagnostic[] };

const gate = new Gate();
const cache = new HexCache(200);

export async function compileSketch(source: unknown, opts: { bin?: string; timeoutMs?: number } = {}): Promise<CompileResult> {
  const guard = checkSource(source);
  if (!guard.ok) return { ok: false, status: guard.status, message: guard.message, diagnostics: [] };

  const text = normaliseSource(source as string);
  const key = createHash("sha256").update(text).digest("hex");
  const hit = cache.get(key);
  if (hit) return { ok: true, hex: hit, cached: true };

  const release = gate.tryAcquire();
  if (!release) return { ok: false, status: 503, message: "The compiler is busy. Try again in a few seconds.", diagnostics: [] };

  const work = await mkdtemp(path.join(os.tmpdir(), "forma-"));
  try {
    // arduino-cli wants a folder named after the sketch file.
    const sketchDir = path.join(work, "sketch");
    await mkdir(sketchDir);
    await writeFile(path.join(sketchDir, "sketch.ino"), text, "utf8");
    const out = path.join(work, "out");

    const bin = opts.bin ?? process.env.ARDUINO_CLI_BIN ?? "arduino-cli";
    const run = await new Promise<{ code: number | null; stderr: string; stdout: string; timedOut: boolean }>((resolve) => {
      const child = execFile(
        /*turbopackIgnore: true*/ bin, // the binary is looked up on PATH at run time; not a project file to bundle
        ["compile", "--fqbn", "arduino:avr:uno", "--output-dir", out, "--build-path", path.join(work, "build"), "--warnings", "none", "--no-color", sketchDir],
        {
          timeout: opts.timeoutMs ?? COMPILE_TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: 1024 * 1024,
          // A scrubbed environment: nothing from the server's own secrets reaches the compiler.
          env: { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin", HOME: process.env.ARDUINO_HOME ?? process.env.HOME ?? work, TMPDIR: work, LANG: "C" } as unknown as NodeJS.ProcessEnv,
        },
        (err, stdout, stderr) => {
          const timedOut = !!err && (err as NodeJS.ErrnoException & { killed?: boolean }).killed === true;
          const code = (err as { code?: number | string } | null)?.code;
          // ENOENT/EACCES: the binary is missing or not executable (a deployment problem, not the student's).
          const missing = code === "ENOENT" || code === "EACCES";
          resolve({ code: err ? (missing ? 127 : typeof code === "number" ? code : 1) : 0, stdout: String(stdout), stderr: String(stderr), timedOut });
        },
      );
      child.on("error", () => resolve({ code: 127, stdout: "", stderr: "", timedOut: false }));
    });

    if (run.timedOut) return { ok: false, status: 504, message: "Compiling took too long and was stopped.", diagnostics: [] };
    if (run.code === 127) return { ok: false, status: 503, message: "The compiler is not available right now.", diagnostics: [] };
    if (run.code !== 0) {
      const diagnostics = parseDiagnostics(run.stderr + "\n" + run.stdout);
      return {
        ok: false,
        status: 422,
        message: diagnostics.length ? "The sketch has errors." : "The sketch could not be compiled.",
        diagnostics,
      };
    }
    const files = await readdir(out).catch(() => [] as string[]);
    const hexName = files.find((f) => f.endsWith(".ino.hex")) ?? files.find((f) => f.endsWith(".hex") && !f.includes("with_bootloader"));
    if (!hexName) return { ok: false, status: 500, message: "The compiler produced no output.", diagnostics: [] };
    const hex = await readFile(path.join(out, hexName), "utf8");
    cache.set(key, hex);
    return { ok: true, hex, cached: false };
  } finally {
    release();
    void rm(work, { recursive: true, force: true });
  }
}
