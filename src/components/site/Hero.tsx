"use client";
import dynamic from "next/dynamic";
import type { Lesson } from "@/content/schema";

// WebGL cannot render on the server, and the landing page text should paint first.
const HeroStage = dynamic(() => import("./HeroStage"), { ssr: false });

export function Hero({ lesson }: { lesson: Lesson }) {
  return (
    <div className="paper relative h-[360px] overflow-hidden rounded-[18px] border border-line sm:h-[460px]" role="img" aria-label="An interactive 3D brain. Drag to turn it.">
      <HeroStage lesson={lesson} />
      <span className="micro pointer-events-none absolute bottom-3 left-4">Drag to turn · tap a lobe</span>
    </div>
  );
}
