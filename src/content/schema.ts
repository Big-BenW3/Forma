/**
 * FORMA content schema (version 1)
 * ================================
 *
 * Everything a student sees in a lesson is DATA described by these schemas:
 * the discipline, its lessons, every clickable part, every panel tab, and the
 * practice check. The workspace shell never hard-codes any of it. That is what
 * lets v2 and v3 add disciplines and lessons without touching the shell:
 *
 *   new lesson      -> one record + one GLB (no code change)
 *   new discipline  -> content + a GLB + registering one adapter
 *
 * Every record carries `schemaVersion`. When this shape changes, bump it and
 * write a migration instead of editing old records in place.
 *
 * The contract that ties 3D to content is the SEMANTIC ID: a part's `id` is
 * the name of its node in the glTF file. Never bind to a mesh index, a
 * material name or a hierarchy position; those change the next time someone
 * touches the asset. A test (see __tests__/content.test.ts) fails the build if
 * a part id is missing from its GLB or its manifest.
 */
import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;

/** snake_case identifier, used for every id so they are safe in URLs and node names */
export const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, "ids must be snake_case");
export type Id = z.infer<typeof Id>;

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

// ---------------------------------------------------------------------------
// Panel content: the blocks that make up a reference tab
// ---------------------------------------------------------------------------

const Fact = z.object({ label: z.string(), value: z.string() });

export const Block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("bullets"),
    items: z.array(z.object({ icon: z.string().optional(), text: z.string() })),
  }),
  z.object({ type: z.literal("facts"), items: z.array(Fact) }),
  z.object({
    type: z.literal("table"),
    head: z.array(z.string()),
    /** `group` is a key from the scene manifest's `groups`; it draws the colour dot */
    rows: z.array(z.object({ cells: z.array(z.string()), group: Id.optional() })),
    caption: z.string().optional(),
  }),
  z.object({ type: z.literal("code"), language: z.string(), code: z.string() }),
  z.object({ type: z.literal("steps"), items: z.array(z.string()) }),
  /** Escape hatch: a discipline adapter supplies the renderer (e.g. architecture drawings) */
  z.object({
    type: z.literal("custom"),
    renderer: Id,
    props: z.record(z.string(), z.unknown()).optional(),
  }),
]);
export type Block = z.infer<typeof Block>;

export const Tab = z.object({
  /** Short heading shown inside the tab body */
  heading: z.string(),
  blocks: z.array(Block),
});
export type Tab = z.infer<typeof Tab>;

// ---------------------------------------------------------------------------
// Parts: one record per clickable thing in a scene
// ---------------------------------------------------------------------------

/**
 * A behaviour the student can change from the inspector (e.g. a button's
 * Hold/Toggle mode). Each option carries its own `effect` sentence, so the
 * "what this means" line updates live with the control.
 */
export const Control = z.object({
  key: Id,
  label: z.string(),
  options: z
    .array(z.object({ value: z.string(), label: z.string(), effect: z.string() }))
    .min(2),
  default: z.string(),
});
export type Control = z.infer<typeof Control>;

export const Part = z.object({
  /** The glTF node name. This is the contract with the 3D asset. */
  id: Id,
  name: z.string(),
  /** Key into the manifest's `groups`; sets the highlight colour and table dots */
  group: Id.optional(),
  /** One plain sentence: what it is, understandable by someone who has never seen it */
  summary: z.string(),
  /** Two or three sentences: what it does and why it matters */
  does: z.string(),
  /** What goes wrong when it fails / the clinical or practical consequence */
  consequence: z.string().optional(),
  /** Label for the consequence line, e.g. "If damaged", "If it fails", "In practice" */
  consequenceLabel: z.string().optional(),
  facts: z.array(Fact).optional(),
  control: Control.optional(),
  /** Featured parts get a callout at rest; the rest appear in the Parts flyout */
  featured: z.boolean().default(false),
  calloutSide: z.enum(["left", "right", "top", "bottom"]).default("right"),
});
export type Part = z.infer<typeof Part>;

// ---------------------------------------------------------------------------
// Practice: the check the student does with their hands
// ---------------------------------------------------------------------------

/**
 * Practice is described by a validator id plus parameters. The validator
 * itself is a pure function (see src/validators) that runs identically in the
 * browser and on the server. It is handed a serialisable snapshot of FACTS
 * (what the student examined, answered, typed, what the emulator did) and
 * returns the verdict. Snapshots never contain verdicts.
 */
export const Practice = z.object({
  validator: Id,
  title: z.string(),
  prompt: z.string(),
  params: z.record(z.string(), z.unknown()).default({}),
});
export type Practice = z.infer<typeof Practice>;

// ---------------------------------------------------------------------------
// Lessons and disciplines
// ---------------------------------------------------------------------------

export const SceneRef = z.object({
  /** e.g. "medicine_brain"; manifest lives at /models/<id>.manifest.json */
  id: Id,
});

export const Lesson = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: Id,
  disciplineId: Id,
  order: z.number().int().positive(),
  title: z.string(),
  /** One line under the title in lesson cards */
  blurb: z.string(),
  /** "canvas": 3D stage in the centre. "terminal": simulated terminal in the centre. */
  layout: z.enum(["canvas", "terminal"]).default("canvas"),
  /** Scene to render. Terminal lessons may omit it. */
  scene: SceneRef.nullable(),
  parts: z.array(Part),
  /** Keyed by the discipline's tab ids. Every discipline tab must have content. */
  tabs: z.record(Id, Tab),
  practice: Practice,
  /** Free-form per-lesson options read by the discipline adapter */
  options: z.record(z.string(), z.unknown()).default({}),
});
export type Lesson = z.infer<typeof Lesson>;

export const Discipline = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: Id,
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  order: z.number().int().positive(),
  /** Which adapter (src/disciplines) supplies discipline-specific behaviour */
  adapter: Id,
  /** Exactly the four reference tabs this discipline shows, in order */
  tabs: z.array(z.object({ id: Id, label: z.string() })).length(4),
  /** Lesson ids in teaching order */
  lessonIds: z.array(Id).min(1),
});
export type Discipline = z.infer<typeof Discipline>;

// ---------------------------------------------------------------------------
// Scene manifest: ships beside each GLB and is what the app actually reads
// ---------------------------------------------------------------------------

const CameraShot = z.object({ position: Vec3, target: Vec3 });

export const ManifestNode = z.object({
  /** Display name (the lesson content has the final say; this is the fallback) */
  name: z.string(),
  group: Id.optional(),
  /** Layer this node belongs to, for peel/explode views */
  layer: Id.optional(),
  /** Camera framing for "Zoom to it" */
  camera: CameraShot,
  /** World-space point where the callout dot sits */
  anchor: Vec3,
  /** Offset applied in exploded/stacked view */
  explode: Vec3.optional(),
  /** True for decoration that is in the file but is not interactive */
  decor: z.boolean().optional(),
});
export type ManifestNode = z.infer<typeof ManifestNode>;

export const Manifest = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  sceneId: Id,
  glb: z.string(),
  camera: CameraShot.extend({
    fov: z.number().default(34),
    minDistance: z.number(),
    maxDistance: z.number(),
  }),
  groups: z.record(Id, z.object({ label: z.string(), color: z.string() })).default({}),
  /**
   * Peel layers, OUTERMOST FIRST. `covers` marks a layer that is opaque enough to
   * hide what lies beneath it (muscle over bone). Callouts and the Parts list
   * only offer parts that are not hidden behind a covering layer; a translucent
   * layer (skin drawn as glass) does not set it.
   */
  layers: z.array(z.object({ id: Id, label: z.string(), covers: z.boolean().optional() })).default([]),
  /** Axis-aligned bounds of the whole scene, used to place cutaway planes */
  bounds: z.object({ min: Vec3, max: Vec3 }),
  nodes: z.record(Id, ManifestNode),
});
export type Manifest = z.infer<typeof Manifest>;

/**
 * Authoring types. Records are written WITHOUT the fields Zod fills in as
 * defaults (e.g. a part's `featured`), so content files use the *input* types;
 * the registry parses them into the full `Lesson` / `Discipline` shapes above.
 */
export type LessonInput = z.input<typeof Lesson>;
export type DisciplineInput = z.input<typeof Discipline>;
