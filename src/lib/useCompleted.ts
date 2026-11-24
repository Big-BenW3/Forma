"use client";
/**
 * Reads which lessons this browser has completed ("<discipline>/<lesson>" keys).
 * Rendered as empty on the server and first client pass (so HTML matches), then
 * filled in after mount. When accounts are connected the server list is merged
 * in by src/lib/progress.ts; callers do not change.
 */
import { useEffect, useState } from "react";
import { fetchServerCompleted, readLocalCompleted } from "@/lib/progress";

export function useCompleted(): { ready: boolean; keys: string[] } {
  const [state, set] = useState<{ ready: boolean; keys: string[] }>({ ready: false, keys: [] });
  useEffect(() => {
    set({ ready: true, keys: readLocalCompleted() });
    // Signed-in students also have a server list; show the union.
    let alive = true;
    void fetchServerCompleted().then((server) => {
      if (alive && server.length) set({ ready: true, keys: Array.from(new Set([...readLocalCompleted(), ...server])) });
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
