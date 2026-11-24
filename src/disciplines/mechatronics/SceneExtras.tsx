"use client";
/**
 * Lights the 3D circuit from the emulator's pin state: the LED dome glows (with
 * a soft halo), the onboard "L" LED glows, and the button cap sinks when pressed.
 *
 * SemanticScene clones each mesh's material and remembers a "base look" it
 * restores after hover and selection. We write the glow into that base look as
 * well as the live material, so hovering the LED never turns it off.
 */
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { SceneProps } from "../types";
import { useSceneContext } from "@/engine/SemanticScene";
import { useMech } from "./store";

const LED_PARTS = ["bb_led", "blink_led", "btn_led"];
const ONBOARD_PARTS = ["blink_led_onboard", "btn_led_onboard"];

interface Glow {
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  color: THREE.Color;
}

function setGlow(g: Glow, on: boolean) {
  const m = g.mesh.material as THREE.MeshStandardMaterial;
  const base = m.userData.base as { emissive: THREE.Color; emissiveIntensity: number } | undefined;
  const e = on ? g.color : new THREE.Color(0, 0, 0);
  const k = on ? 1.6 : 1;
  m.emissive.copy(e);
  m.emissiveIntensity = k;
  if (base) {
    base.emissive.copy(e);
    base.emissiveIntensity = k;
  }
  g.halo.visible = on;
}

export function MechSceneExtras({ lesson }: SceneProps) {
  const ctx = useSceneContext();
  const invalidate = useThree((s) => s.invalidate);
  const ledPin = (lesson.options.ledPin as number | undefined) ?? 13;
  const on = useMech((s) => s.pins[ledPin] === 1);
  const pressed = useMech((s) => s.pressed);

  // Build glow targets and halos once per scene.
  useEffect(() => {
    if (!ctx) return;
    const glows: Glow[] = [];
    const add = (partId: string, meshName: string | null, color: string, radius: number, up: number) => {
      const entry = ctx.index.get(partId);
      if (!entry) return;
      let target: THREE.Mesh | undefined;
      entry.obj.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!target && m.isMesh && (meshName ? m.name === meshName : true)) target = m;
      });
      if (!target) return;
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      // Centre the halo on the glowing mesh, in the mesh's parent space.
      const box = new THREE.Box3().setFromObject(target);
      const c = box.getCenter(new THREE.Vector3());
      target.parent?.worldToLocal(c);
      halo.position.set(c.x, c.y + up, c.z);
      halo.visible = false;
      halo.raycast = () => {};
      target.parent?.add(halo);
      glows.push({ mesh: target, halo, color: new THREE.Color(color) });
    };
    for (const id of LED_PARTS) add(id, "led_dome", "#ff4a36", 0.045, 0.012);
    for (const id of ONBOARD_PARTS) add(id, null, "#ffd23a", 0.02, 0.004);
    (ctx.root.userData.__glows as Glow[] | undefined) ??= undefined;
    ctx.root.userData.__glows = glows;
    return () => {
      for (const g of glows) {
        g.halo.parent?.remove(g.halo);
        g.halo.geometry.dispose();
        (g.halo.material as THREE.Material).dispose();
      }
      ctx.root.userData.__glows = undefined;
    };
  }, [ctx]);

  // Apply the LED state.
  useEffect(() => {
    const glows = ctx?.root.userData.__glows as Glow[] | undefined;
    if (!glows) return;
    for (const g of glows) setGlow(g, on);
    invalidate();
  }, [ctx, on, invalidate]);

  // Sink the button cap while pressed.
  useEffect(() => {
    const entry = ctx?.index.get("btn_switch");
    if (!entry) return;
    entry.obj.traverse((o) => {
      if (o.name === "switch_cap") {
        if (o.userData.__y === undefined) o.userData.__y = o.position.y;
        o.position.y = (o.userData.__y as number) - (pressed ? 0.0018 : 0);
      }
    });
    invalidate();
  }, [ctx, pressed, invalidate]);

  return null;
}
