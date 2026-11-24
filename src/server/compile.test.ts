import path from "node:path";
import { describe, expect, it } from "vitest";
import { Gate, HexCache, RateLimiter, checkSource, parseDiagnostics, sanitise } from "./compile-guard";
import { compileSketch } from "./compile";

const stub = path.join(__dirname, "__stubs__", "fake-arduino-cli.sh");
const OK = "void setup() { pinMode(13, OUTPUT); }\nvoid loop() { digitalWrite(13, HIGH); }\n";

describe("checkSource", () => {
  it("accepts a normal sketch and allowed includes", () => {
    expect(checkSource(OK).ok).toBe(true);
    expect(checkSource('#include <Arduino.h>\n#include "Servo.h"\n' + OK).ok).toBe(true);
  });
  it("rejects non-text, empty and oversized sketches", () => {
    expect(checkSource(42)).toMatchObject({ ok: false, status: 400 });
    expect(checkSource("   ")).toMatchObject({ ok: false, status: 400 });
    expect(checkSource("x".repeat(17 * 1024))).toMatchObject({ ok: false, status: 413 });
  });
  it("rejects includes outside the allowlist, including path tricks and macros", () => {
    for (const inc of ['#include "/etc/passwd"', "#include <../../etc/passwd>", '#include "secret.h"', "#include FOO", "#  include <stdio.h>", "#include_next <x.h>", "#import <x.h>"]) {
      expect(checkSource(inc + "\n" + OK).ok, inc).toBe(false);
    }
  });
  it("rejects inline assembly and file embedding", () => {
    for (const bad of ['asm(".incbin \\"/etc/passwd\\"");', '__asm__ volatile("nop");', 'int x = __has_include("a");']) expect(checkSource(OK + bad).ok, bad).toBe(false);
  });
  it("rejects an include continued onto the next line", () => {
    expect(checkSource('#include <Arduino.h> \\\n' + OK).ok).toBe(false);
  });
});

describe("diagnostics", () => {
  it("keeps sketch errors, drops other files and paths", () => {
    const out = "/tmp/forma-abc123/sketch/sketch.ino:3:5: error: 'foo' was not declared in this scope\n/usr/share/arduino/Arduino.h:1:1: note: secret path\nsketch.ino:9:1: warning: unused variable";
    const d = parseDiagnostics(out);
    expect(d).toEqual([
      { line: 3, col: 5, severity: "error", message: "'foo' was not declared in this scope" },
      { line: 9, col: 1, severity: "warning", message: "unused variable" },
    ]);
  });
  it("sanitise removes server paths", () => {
    expect(sanitise("cannot open /home/render/project/x/y.h")).not.toMatch(/render/);
  });
});

describe("limits", () => {
  it("rate limiter allows N per window then recovers", () => {
    let t = 0;
    const r = new RateLimiter(2, 1000, () => t);
    expect([r.allow("a"), r.allow("a"), r.allow("a"), r.allow("b")]).toEqual([true, true, false, true]);
    t = 1001;
    expect(r.allow("a")).toBe(true);
  });
  it("gate allows one holder at a time", () => {
    const g = new Gate();
    const rel = g.tryAcquire();
    expect(rel).not.toBeNull();
    expect(g.tryAcquire()).toBeNull();
    rel!();
    expect(g.tryAcquire()).not.toBeNull();
  });
  it("cache evicts the least recently used entry", () => {
    const c = new HexCache(2);
    c.set("a", "1"); c.set("b", "2"); c.get("a"); c.set("c", "3");
    expect([c.get("a"), c.get("b"), c.get("c")]).toEqual(["1", undefined, "3"]);
  });
});

describe("compileSketch (against a stub arduino-cli)", () => {
  it("returns HEX, then serves the same sketch from cache", async () => {
    const a = await compileSketch(OK + "// unique-1", { bin: stub });
    expect(a).toMatchObject({ ok: true, cached: false });
    const b = await compileSketch(OK + "// unique-1", { bin: stub });
    expect(b).toMatchObject({ ok: true, cached: true });
  });
  it("returns sanitised diagnostics for a failing sketch", async () => {
    const r = await compileSketch(OK + "// BROKEN", { bin: stub });
    expect(r).toMatchObject({ ok: false, status: 422 });
    if (!r.ok) {
      expect(r.diagnostics).toEqual([{ line: 3, col: 5, severity: "error", message: "'foo' was not declared in this scope" }]);
      expect(JSON.stringify(r)).not.toMatch(/arduino\/hardware|\/usr\//);
    }
  });
  it("kills a job that runs too long and frees the gate", async () => {
    const r = await compileSketch(OK + "// SLEEP", { bin: stub, timeoutMs: 600 });
    expect(r).toMatchObject({ ok: false, status: 504 });
    expect((await compileSketch(OK + "// after-timeout", { bin: stub })).ok).toBe(true);
  }, 15000);
  it("refuses a second job while one is running", async () => {
    const slow = compileSketch(OK + "// SLEEP busy", { bin: stub, timeoutMs: 1500 });
    await new Promise((r) => setTimeout(r, 150));
    const second = await compileSketch(OK + "// other", { bin: stub });
    expect(second).toMatchObject({ ok: false, status: 503 });
    await slow;
  }, 15000);
  it("reports a missing compiler without leaking details", async () => {
    const r = await compileSketch(OK + "// nobin", { bin: "/nonexistent/arduino-cli" });
    expect(r).toMatchObject({ ok: false, status: 503 });
  });
});
