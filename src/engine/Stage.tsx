"use client";
/**
 * Stage
 * =====
 * The shared 3D stage: canvas, lighting, camera rig, the semantic scene, the
 * optional cut-away, callouts and the loading overlay. Every canvas lesson in
 * every discipline renders through this one component.
 *
 * Look: a plain three-light studio (key, fill, rim) plus a small procedural
 * environment for reflections. No post-processing, no bloom, no filmic
 * tone-mapping (`flat`): materials should read as the real material.
 * The environment is generated from light panels, not downloaded, so it works
 * offline and adds no network request.
 *
 * Rendering is on demand. Nothing animates while the scene is idle.
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  useProgress,
} from "@react-three/drei";
import type { Lesson, Manifest } from "@/content/schema";
import { CameraRig } from "./CameraRig";
import { Callouts } from "./Callouts";
import { TouchLabel } from "./TouchLabel";
import { Cutaway, type CutConfig } from "./Cutaway";
import { SemanticScene } from "./SemanticScene";
import { StageGuard } from "./StageGuard";
import { StageFloor } from "./StageFloor";
import { useWorkspace } from "./store";

export type Quality = "auto" | "high" | "balanced" | "battery";

const DPR: Record<Quality, [number, number]> = {
  auto: [1, 2],
  high: [1, 2],
  balanced: [1, 1.5],
  battery: [1, 1],
};

function Loader({ label }: { label: string }) {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <div className="w-[220px] text-center">
        <div className="micro mb-2">{label}</div>
        <div className="h-[3px] overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-teal transition-[width] duration-200"
            style={{ width: `${Math.max(6, progress)}%` }}
          />
        </div>
        <div className="micro mt-2">
          Loading model · {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}

export function Stage({
  lesson,
  manifest,
  cut,
  ground = true,
  quality = "auto",
  compact = false,
  children,
}: {
  lesson: Lesson;
  manifest: Manifest;
  cut?: CutConfig;
  /** Soft contact shadow under the object. Turn off for things that float (a cell). */
  ground?: boolean;
  quality?: Quality;
  compact?: boolean;
  /** Discipline-specific scene extras (emulator hooks, plan link) */
  children?: React.ReactNode;
}) {
  const b = manifest.bounds;
  const size = Math.max(
    b.max[0] - b.min[0],
    b.max[1] - b.min[1],
    b.max[2] - b.min[2],
  );
  // What the model covers on the floor (never less than 45% of its size, so a standing figure still gets a stage)
  const foot = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], size * 0.45);
  const cx = (b.min[0] + b.max[0]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;

  return (
    <div className="absolute inset-0">
      <StageGuard>
        <Canvas
          frameloop="demand"
          flat
          dpr={DPR[quality]}
          camera={{
            fov: manifest.camera.fov,
            near: size * 0.01,
            far: size * 40,
            position: manifest.camera.position,
          }}
          gl={{
            antialias: true,
            alpha: true,
            stencil: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            // Required for the cut-away's clipping planes to apply per material.
            gl.localClippingEnabled = true;
          }}
          onPointerMissed={() => useWorkspace.getState().select(null)}
        >
          <CameraRig manifest={manifest} />

          {/* three-light studio */}
          <hemisphereLight args={["#fff6e6", "#cdbfa6", 0.7]} />
          <directionalLight
            position={[size * 1.2, size * 1.6, size * 1.1]}
            intensity={2.1}
            color="#fff4e2"
          />
          <directionalLight
            position={[-size * 1.4, size * 0.6, size * 0.7]}
            intensity={0.75}
            color="#dfe8ff"
          />
          <directionalLight
            position={[-size * 0.4, size * 1.0, -size * 1.6]}
            intensity={1.1}
            color="#ffffff"
          />

          {/* procedural environment: reflections without a network request */}
          <Environment frames={1} resolution={128} environmentIntensity={0.55}>
            <Lightformer
              form="rect"
              intensity={2.2}
              position={[0, 5, 4]}
              scale={[10, 4, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.0}
              position={[-6, 2, 0]}
              rotation-y={Math.PI / 2}
              scale={[8, 3, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.4}
              position={[6, 1, -2]}
              rotation-y={-Math.PI / 2}
              scale={[8, 3, 1]}
            />
          </Environment>

          <Suspense fallback={null}>
            <StageFloor center={[cx, cz]} y={b.min[1] - size * (ground ? 0.012 : 0.22)} size={size} foot={foot} />
            <SemanticScene manifest={manifest}>
              {cut && <Cutaway config={cut} />}
              <Callouts lesson={lesson} compact={compact} />
              <TouchLabel lesson={lesson} />
              {children}
            </SemanticScene>
            {ground && (
              <ContactShadows
                position={[cx, b.min[1] - size * 0.004, cz]}
                opacity={0.32}
                scale={size * 2.2}
                blur={2.6}
                far={size * 0.6}
                resolution={512}
                frames={1}
                color="#2b2a3a"
              />
            )}
          </Suspense>
        </Canvas>
        <Loader label={lesson.title} />
      </StageGuard>
    </div>
  );
}
