/**
 * Compile guard: everything about a compile request that can be decided WITHOUT
 * running the compiler. Pure and unit-tested, because this is the front line of
 * the one endpoint that runs a child process on behalf of anonymous visitors.
 *
 * Threat model: a visitor sends C++ and we run a compiler on it. A compiler is
 * not a sandbox, so we (a) cap size, (b) allow only known headers, (c) refuse
 * constructs that read files into the output (inline assembly, .incbin) and
 * (d) never return raw compiler output, only sanitised diagnostics.
 */
export const MAX_SOURCE_BYTES = 16 * 1024;

/** Headers a beginner sketch legitimately needs. Anything else is refused. */
export const ALLOWED_INCLUDES = new Set([
  "Arduino.h", "Servo.h", "avr/io.h", "avr/interrupt.h", "avr/pgmspace.h", "util/delay.h",
  "math.h", "stdint.h", "stdlib.h", "string.h", "stdbool.h", "limits.h",
]);

export type GuardResult = { ok: true } | { ok: false; status: number; message: string };

export function checkSource(source: unknown): GuardResult {
  if (typeof source !== "string") return { ok: false, status: 400, message: "Send the sketch as text." };
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
    return { ok: false, status: 413, message: `The sketch is too long. The limit is ${MAX_SOURCE_BYTES / 1024} KB.` };
  }
  if (source.trim().length === 0) return { ok: false, status: 400, message: "The sketch is empty." };
  if (source.includes("\0")) return { ok: false, status: 400, message: "The sketch contains a null character." };

  // Every #include must be a literal, allowed header. (Macros cannot hide one: `#include FOO` fails the pattern.)
  for (const line of source.split(/\r?\n/)) {
    if (!/^\s*#\s*(include|include_next|import)\b/.test(line)) continue;
    const m = /^\s*#\s*include\s*[<"]([^>"]+)[>"]\s*(\/\/.*|\/\*.*)?$/.exec(line);
    if (!m || !ALLOWED_INCLUDES.has(m[1])) {
      return { ok: false, status: 400, message: `That #include is not available here. Allowed: ${[...ALLOWED_INCLUDES].join(", ")}.` };
    }
  }
  // Line continuations could split a directive across lines past the check above.
  if (/^\s*#\s*include[^\n]*\\\s*$/m.test(source)) return { ok: false, status: 400, message: "An #include cannot continue onto another line." };
  // Constructs that can embed arbitrary files in the binary, or run raw assembly.
  if (/\b(asm|__asm__|__asm|incbin|__has_include)\b/.test(source)) {
    return { ok: false, status: 400, message: "Inline assembly and file embedding are not available in this editor." };
  }
  return { ok: true };
}

export interface Diagnostic {
  line: number;
  col: number;
  severity: "error" | "warning";
  message: string;
}

/**
 * Turns arduino-cli / avr-gcc output into structured diagnostics for the editor.
 * Only lines for the student's sketch are kept; absolute paths and toolchain
 * noise never reach the client.
 */
export function parseDiagnostics(output: string, max = 12): Diagnostic[] {
  const out: Diagnostic[] = [];
  const re = /(?:^|[\\/])sketch\.ino:(\d+):(\d+):\s*(error|warning|fatal error):\s*(.+)$/gm;
  for (const m of output.matchAll(re)) {
    out.push({
      line: Math.max(1, +m[1]),
      col: Math.max(1, +m[2]),
      severity: m[3] === "warning" ? "warning" : "error",
      message: sanitise(m[4]).slice(0, 240),
    });
    if (out.length >= max) break;
  }
  return out;
}

/** Strips anything that looks like a server path or a temp directory name. */
export function sanitise(text: string): string {
  return text
    .replace(/(?:\/[\w.@+-]+){2,}/g, "…")
    .replace(/[A-Za-z]:\\[^\s]+/g, "…")
    .replace(/forma-[a-z0-9]{6,}/gi, "…");
}

// ---------------------------------------------------------------------------
// Rate limit, cache and the one-job gate
// ---------------------------------------------------------------------------

/** Fixed-window limiter per key (IP). In-memory: one Render instance, so no shared store is needed. */
export class RateLimiter {
  private hits = new Map<string, { n: number; reset: number }>();
  constructor(private limit = 10, private windowMs = 60_000, private now: () => number = Date.now) {}
  allow(key: string): boolean {
    const t = this.now();
    const h = this.hits.get(key);
    if (!h || t >= h.reset) {
      this.hits.set(key, { n: 1, reset: t + this.windowMs });
      // Keep the map from growing without bound.
      if (this.hits.size > 5000) for (const [k, v] of this.hits) if (t >= v.reset) this.hits.delete(k);
      return true;
    }
    if (h.n >= this.limit) return false;
    h.n++;
    return true;
  }
}

/** Tiny LRU for compiled HEX, keyed by a hash of the normalised source. */
export class HexCache {
  private m = new Map<string, string>();
  constructor(private max = 200) {}
  get(k: string) {
    const v = this.m.get(k);
    if (v !== undefined) {
      this.m.delete(k);
      this.m.set(k, v);
    }
    return v;
  }
  set(k: string, v: string) {
    this.m.delete(k);
    this.m.set(k, v);
    if (this.m.size > this.max) this.m.delete(this.m.keys().next().value as string);
  }
}

/** Allows one job at a time. `tryAcquire` returns a release function, or null if busy. */
export class Gate {
  private busy = false;
  tryAcquire(): (() => void) | null {
    if (this.busy) return null;
    this.busy = true;
    return () => {
      this.busy = false;
    };
  }
}

/** Normalises line endings and trailing whitespace so trivially different sources share a cache entry. */
export const normaliseSource = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim() + "\n";
