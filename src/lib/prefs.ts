"use client";
/**
 * Device preferences (graphics quality). Stored on the device, not the
 * account: the right setting depends on the phone, not the person.
 *
 * "auto" lets the Stage pick a pixel ratio from the device; "battery" caps it
 * low for older phones.
 */
import { useEffect, useState } from "react";
import type { Quality } from "@/engine/Stage";

const KEY = "forma.quality.v1";
export const QUALITIES: Array<{ id: Quality; label: string; hint: string }> = [
  { id: "auto", label: "Auto", hint: "Matches your device" },
  { id: "high", label: "High", hint: "Sharpest, uses more battery" },
  { id: "balanced", label: "Balanced", hint: "Good on most phones" },
  { id: "battery", label: "Battery saver", hint: "Lowest resolution" },
];

export function useQuality(): [Quality, (q: Quality) => void] {
  const [q, setQ] = useState<Quality>("auto");
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY) as Quality | null;
      if (v && QUALITIES.some((x) => x.id === v)) setQ(v);
    } catch {
      /* ignore */
    }
  }, []);
  return [
    q,
    (next) => {
      setQ(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
    },
  ];
}
