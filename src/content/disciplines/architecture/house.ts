/**
 * The 3-bedroom house: ONE source of truth for geometry.
 *
 * The 3D model (scripts/models/architecture_house.ts) and the floor-plan drawing
 * (src/disciplines/architecture/PlanView.tsx) are both generated from this file,
 * so the plan and the model cannot disagree. Change a wall here and both move.
 *
 * Units are metres. Plan axes: x runs east (left to right on the drawing),
 * z runs south (top to bottom on the drawing), so north is up. y is height.
 */

export const WALL_H = 2.7;
export const EXT_T = 0.3; // exterior wall thickness (brick cavity wall, typical)
export const INT_T = 0.12; // interior partition thickness
export const ROOF_RISE = 2.0; // ridge height above the wall top
export const EAVE = 0.5; // roof overhang past the walls
export const SLAB_T = 0.2;

export const FOOTPRINT = { w: 12, d: 9 };

export interface Room {
  id: string; // also the 3D part id
  name: string;
  /** Plan rectangle between wall centre-lines */
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  group: "sleeping" | "living" | "service";
  floor: string; // finish colour in the model
  finish: string; // finish name for the cards
}

export const ROOMS: Room[] = [
  { id: "room_bedroom_1", name: "Bedroom 1", x0: 0, z0: 0, x1: 4.2, z1: 3.8, group: "sleeping", floor: "#c9a06b", finish: "Timber floor" },
  { id: "room_bathroom", name: "Bathroom", x0: 4.2, z0: 0, x1: 6.4, z1: 3.8, group: "service", floor: "#b7ccd2", finish: "Ceramic tile" },
  { id: "room_bedroom_2", name: "Bedroom 2", x0: 6.4, z0: 0, x1: 9.2, z1: 3.8, group: "sleeping", floor: "#c9a06b", finish: "Timber floor" },
  { id: "room_bedroom_3", name: "Bedroom 3", x0: 9.2, z0: 0, x1: 12, z1: 4.8, group: "sleeping", floor: "#c9a06b", finish: "Timber floor" },
  { id: "room_hall", name: "Hall", x0: 0, z0: 3.8, x1: 9.2, z1: 4.8, group: "service", floor: "#b99a73", finish: "Timber floor" },
  { id: "room_kitchen", name: "Kitchen", x0: 0, z0: 4.8, x1: 4.4, z1: 9, group: "service", floor: "#d8c9ac", finish: "Ceramic tile" },
  { id: "room_living", name: "Living and dining", x0: 4.4, z0: 4.8, x1: 12, z1: 9, group: "living", floor: "#cfa774", finish: "Timber floor" },
];

export interface Wall {
  id: string;
  kind: "ext" | "int";
  /** Centre-line start and end (axis-aligned) */
  a: [number, number];
  b: [number, number];
}

export const WALLS: Wall[] = [
  { id: "ext_n", kind: "ext", a: [0, 0], b: [12, 0] },
  { id: "ext_s", kind: "ext", a: [0, 9], b: [12, 9] },
  { id: "ext_w", kind: "ext", a: [0, 0], b: [0, 9] },
  { id: "ext_e", kind: "ext", a: [12, 0], b: [12, 9] },
  { id: "int_1", kind: "int", a: [4.2, 0], b: [4.2, 3.8] },
  { id: "int_2", kind: "int", a: [6.4, 0], b: [6.4, 3.8] },
  { id: "int_3", kind: "int", a: [9.2, 0], b: [9.2, 4.8] },
  { id: "int_4", kind: "int", a: [0, 3.8], b: [9.2, 3.8] },
  { id: "int_5", kind: "int", a: [0, 4.8], b: [12, 4.8] },
  { id: "int_6", kind: "int", a: [4.4, 4.8], b: [4.4, 9] },
];

export interface Opening {
  wall: string;
  /** Distance from the wall's start to the opening's near edge */
  at: number;
  w: number;
  kind: "door" | "window" | "opening";
  sill: number; // height of the bottom edge
  head: number; // height of the top edge
  /** Doors: which way the leaf swings on the plan, for the drawing only */
  swing?: "in-a" | "in-b";
}

const win = (wall: string, at: number, w: number, sill = 0.9, head = 2.1): Opening => ({ wall, at, w, kind: "window", sill, head });
const door = (wall: string, at: number, w = 0.9, swing: "in-a" | "in-b" = "in-a"): Opening => ({ wall, at, w, kind: "door", sill: 0, head: 2.1, swing });

export const OPENINGS: Opening[] = [
  // north (street-back) windows
  win("ext_n", 1.2, 1.8),
  win("ext_n", 4.9, 0.8, 1.5),
  win("ext_n", 7.2, 1.2),
  win("ext_n", 10, 1.4),
  // east
  win("ext_e", 1.2, 1.4),
  win("ext_e", 6.0, 1.6),
  // west
  win("ext_w", 1.2, 1.4),
  win("ext_w", 6.2, 1.4),
  // south (front)
  win("ext_s", 1.0, 1.4),
  win("ext_s", 5.2, 2.0, 0.6, 2.1),
  door("ext_s", 8.0, 1.0, "in-b"), // front door opens inward, into the living room
  win("ext_s", 9.6, 1.6, 0.6, 2.1),
  // interior doors
  door("int_4", 1.2, 0.9, "in-a"),
  door("int_4", 5.0, 0.8, "in-a"),
  door("int_4", 7.2, 0.9, "in-a"),
  door("int_3", 3.9, 0.8, "in-b"),
  door("int_5", 1.0, 0.9, "in-b"),
  { wall: "int_5", at: 5.4, w: 1.2, kind: "opening", sill: 0, head: 2.1 },
  { wall: "int_6", at: 1.2, w: 1.6, kind: "opening", sill: 0, head: 2.1 },
];

export const wallById = (id: string) => WALLS.find((w) => w.id === id)!;
export const roomById = (id: string) => ROOMS.find((r) => r.id === id)!;
export const roomArea = (r: Room) => Math.round((r.x1 - r.x0) * (r.z1 - r.z0) * 100) / 100;
/** Net floor area of a room: centre-line rectangle minus half the wall thicknesses. */
export function roomNetArea(r: Room) {
  const t = (side: "w" | "e" | "n" | "s") => {
    const ext = (side === "w" && r.x0 === 0) || (side === "e" && r.x1 === FOOTPRINT.w) || (side === "n" && r.z0 === 0) || (side === "s" && r.z1 === FOOTPRINT.d);
    return (ext ? EXT_T : INT_T) / 2;
  };
  const w = r.x1 - r.x0 - t("w") - t("e");
  const d = r.z1 - r.z0 - t("n") - t("s");
  return Math.round(w * d * 10) / 10;
}
export const TOTAL_NET_AREA = Math.round(ROOMS.reduce((s, r) => s + roomNetArea(r), 0) * 10) / 10;

// ---------------------------------------------------------------- furniture
// Also one source of truth: the 3D model builds each item from its kind, and the
// plan drawing draws the matching symbol at the same place.

export type FurnitureKind =
  | "bed_double" | "bed_single" | "nightstand" | "wardrobe" | "desk" | "chair" | "rug"
  | "bath" | "toilet" | "basin" | "counter" | "hob" | "sink" | "fridge" | "table" | "sofa"
  | "armchair" | "coffee_table" | "tv_unit" | "plant" | "lamp";

export interface Furniture {
  kind: FurnitureKind;
  room: string;
  /** Centre on the plan */
  x: number;
  z: number;
  /** Width along the item's front, depth front-to-back, both in metres */
  w: number;
  d: number;
  /** The direction the item's front faces: toward the room, the seat, the user */
  face: "n" | "s" | "e" | "w";
}

const F = (kind: FurnitureKind, room: string, x: number, z: number, w: number, d: number, face: Furniture["face"] = "s"): Furniture => ({ kind, room, x, z, w, d, face });

export const FURNITURE: Furniture[] = [
  // Bedroom 1: double bed against the north wall
  F("rug", "room_bedroom_1", 2.1, 2.0, 2.0, 1.3),
  F("bed_double", "room_bedroom_1", 2.1, 1.17, 1.6, 2.05),
  F("nightstand", "room_bedroom_1", 0.95, 0.4, 0.45, 0.4),
  F("nightstand", "room_bedroom_1", 3.25, 0.4, 0.45, 0.4),
  F("wardrobe", "room_bedroom_1", 3.73, 2.6, 1.8, 0.6, "w"),
  F("lamp", "room_bedroom_1", 0.5, 3.3, 0.35, 0.35),
  // Bathroom
  F("bath", "room_bathroom", 5.93, 1.05, 0.75, 1.7),
  F("toilet", "room_bathroom", 4.75, 0.48, 0.4, 0.65),
  F("basin", "room_bathroom", 4.5, 2.3, 0.55, 0.45, "e"),
  // Bedroom 2: double bed and a desk
  F("bed_double", "room_bedroom_2", 7.95, 1.17, 1.4, 2.05),
  F("nightstand", "room_bedroom_2", 8.9, 0.4, 0.4, 0.38),
  F("desk", "room_bedroom_2", 6.78, 2.6, 1.3, 0.6, "e"),
  F("chair", "room_bedroom_2", 7.35, 2.6, 0.45, 0.45, "w"),
  // Bedroom 3: single bed and wardrobe
  F("bed_single", "room_bedroom_3", 10.2, 1.17, 0.9, 2.0),
  F("nightstand", "room_bedroom_3", 11.0, 0.35, 0.4, 0.38),
  F("wardrobe", "room_bedroom_3", 10.95, 4.4, 1.5, 0.6, "n"),
  F("desk", "room_bedroom_3", 11.55, 2.6, 1.1, 0.55, "w"),
  F("chair", "room_bedroom_3", 11.05, 2.6, 0.45, 0.45, "e"),
  // Hall
  F("rug", "room_hall", 3.0, 4.3, 2.6, 0.7),
  F("plant", "room_hall", 0.42, 4.3, 0.4, 0.4), // west end of the hall, clear of every door
  // Kitchen: L-shaped run along the west and south walls, table in the middle
  F("counter", "room_kitchen", 0.45, 6.2, 2.4, 0.6, "e"),
  F("hob", "room_kitchen", 0.45, 5.6, 0.6, 0.52, "e"),
  F("fridge", "room_kitchen", 0.47, 8.5, 0.62, 0.65, "e"),
  F("counter", "room_kitchen", 2.35, 8.55, 2.7, 0.6, "n"),
  F("sink", "room_kitchen", 2.1, 8.55, 0.8, 0.46, "n"),
  F("table", "room_kitchen", 2.75, 6.3, 0.9, 0.9),
  F("chair", "room_kitchen", 2.75, 5.62, 0.42, 0.42, "s"),
  F("chair", "room_kitchen", 2.75, 6.98, 0.42, 0.42, "n"),
  // Living and dining
  F("rug", "room_living", 8.3, 6.35, 2.8, 2.0),
  F("tv_unit", "room_living", 8.3, 5.15, 1.6, 0.42, "s"),
  F("sofa", "room_living", 8.3, 7.4, 2.2, 0.95, "n"),
  F("coffee_table", "room_living", 8.3, 6.35, 1.0, 0.55),
  F("armchair", "room_living", 6.5, 6.35, 0.85, 0.85, "e"),
  F("table", "room_living", 10.6, 6.6, 1.6, 0.9),
  F("chair", "room_living", 10.2, 5.95, 0.45, 0.45, "s"),
  F("chair", "room_living", 11.0, 5.95, 0.45, 0.45, "s"),
  F("chair", "room_living", 10.2, 7.25, 0.45, 0.45, "n"),
  F("chair", "room_living", 11.0, 7.25, 0.45, 0.45, "n"),
  F("plant", "room_living", 11.5, 8.5, 0.45, 0.45),
  F("lamp", "room_living", 6.0, 8.45, 0.4, 0.4),
];

/** Rotation (radians about +y) that turns an item authored facing +z (south) to face `f`. */
export const faceAngle = (f: Furniture["face"]) => ({ s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 })[f];
