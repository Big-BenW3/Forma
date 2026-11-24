/**
 * Test setup shared by every test file. Only does UI work when a DOM exists
 * (UI test files opt into jsdom with a `@vitest-environment jsdom` comment).
 */
import { afterEach } from "vitest";

if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => cleanup());
  // jsdom lacks these; components touch them on mount
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}
