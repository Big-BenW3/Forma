/**
 * Where the pointer last touched the model, in world space.
 *
 * Written by SemanticScene's picking on every pointer move and click, read by
 * TouchLabel in its frame loop. It is a plain mutable object, not store state,
 * because it changes on every mouse move and nothing else needs to re-render.
 */
import * as THREE from "three";

export const touch = {
  /** The point under the pointer on the hovered part */
  hover: null as { id: string; point: THREE.Vector3 } | null,
  /** The point that was clicked to select each part (most recent per part) */
  selected: new Map<string, THREE.Vector3>(),
};

