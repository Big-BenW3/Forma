/**
 * Reads FORMA's design tokens from the CSS variables defined in globals.css.
 *
 * Why this exists: the 3D scenes need colours as numbers (three.js Color), but
 * the palette lives in CSS so there is a single source of truth. This reads the
 * live computed value once and caches it, so a palette change in globals.css
 * repaints both the interface and the highlights inside the canvas.
 */
const cache = new Map<string, string>();

/** Returns a CSS variable's value, e.g. readToken("--accent") -> "#e4532b". */
export function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const hit = cache.get(name);
  if (hit) return hit;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = raw || fallback;
  cache.set(name, value);
  return value;
}

/** The handful of colours the 3D layer cares about. */
export function sceneColors() {
  return {
    accent: readToken("--accent", "#e4532b"),
    signal: readToken("--signal", "#e8a317"),
    ground: readToken("--ground", "#f6eddd"),
    ink: readToken("--ink", "#18213d"),
    teal: readToken("--teal", "#1aa3a1"),
    floor: readToken("--floor", "#ece1cf"),
    floorPad: readToken("--floor-pad", "#e4d8c5"),
    floorLine: readToken("--floor-line", "#c9baa5"),
  };
}
