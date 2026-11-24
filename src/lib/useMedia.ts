"use client";
import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Server render returns `serverValue` so the
 * first paint matches on both sides; the real value takes over after hydration.
 */
export function useMedia(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Below this width the workspace switches to the phone layout (bottom bar + sheet). */
export const COMPACT_QUERY = "(max-width: 999px)";
export const useIsCompact = () => useMedia(COMPACT_QUERY, false);
