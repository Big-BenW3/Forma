"use client";
/**
 * The landing page's live 3D object: the real brain model in the real engine,
 * so what a visitor sees is what the lessons are. It loads its own manifest on
 * the client, hides labels, and stays still until the visitor touches it
 * (the canvas renders on demand, so it costs nothing at rest).
 */
import { useEffect, useState } from "react";
import { Stage } from "@/engine/Stage";
import { useWorkspace } from "@/engine/store";
import { Manifest, type Lesson } from "@/content/schema";

export default function HeroStage({ lesson }: { lesson: Lesson }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => {
    useWorkspace.getState().setLabels(false);
    let live = true;
    fetch(`/models/${lesson.scene!.id}.manifest.json`)
      .then((r) => r.json())
      .then((j) => live && setManifest(Manifest.parse(j)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lesson.scene]);
  if (!manifest) return null;
  return <Stage lesson={lesson} manifest={manifest} quality="balanced" />;
}
