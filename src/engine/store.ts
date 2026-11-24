"use client";
/**
 * Workspace store
 * ===============
 * One Zustand store holds all TRANSIENT workspace state: what is selected,
 * which layers are peeled, how far the cut-away is open, and so on.
 *
 * The important property: selection lives here and nowhere else. The 3D
 * highlight, the callouts, the inspector card, the context panel and the Parts
 * flyout all read the same `selectedId`, so selecting in any one of them
 * selects in all of them. Nothing else may keep its own copy of "what is
 * selected".
 *
 * This store knows nothing about brains, breadboards or houses. Discipline
 * specifics live in adapters (src/disciplines) and read/write it generically.
 *
 * Persistent state (progress, preferences) is NOT here; it goes to the server.
 */
import { create } from "zustand";

/** A camera move request. `nonce` makes repeating the same request fire again. */
export type CameraRequest =
  | { kind: "goto"; position: [number, number, number]; target: [number, number, number]; nonce: number }
  | { kind: "reset"; nonce: number }
  | { kind: "dolly"; amount: number; nonce: number };

/** CameraRequest without its nonce (distributes over the union so each member keeps its own fields). */
export type CameraRequestInput = CameraRequest extends infer T ? (T extends unknown ? Omit<T, "nonce"> : never) : never;

/** Everything the undo/redo stack restores. Camera is deliberately excluded. */
interface HistoryState {
  selectedId: string | null;
  isolate: boolean;
  cutaway: number;
  layerStep: number;
  explode: number;
  controls: Record<string, Record<string, string>>;
}

export type Flyout = null | "lessons" | "parts" | "settings";
export type SheetDetent = "peek" | "half" | "full";

export interface WorkspaceState extends HistoryState {
  /** "<discipline>/<lesson>" of the lesson currently loaded */
  lessonKey: string | null;
  hoveredId: string | null;
  /** Parts the student has opened, in order. This is a FACT fed to validators. */
  examined: string[];
  /**
   * Which scene variant of the lesson is showing (null = the main scene). A
   * lesson can declare variants in `options.variants`, e.g. the skeleton lesson
   * opens a bone's own cross-section as a second scene.
   */
  variant: string | null;
  labels: boolean;
  /** Reference-panel tab. Persists when the lesson changes, if the tab still exists. */
  activeTab: string;
  flyout: Flyout;
  railOpen: boolean;
  sheet: SheetDetent;
  /** True while the camera is closer than the whole-object framing */
  zoomedIn: boolean;
  camera: CameraRequest | null;
  past: HistoryState[];
  future: HistoryState[];

  // --- actions
  startLesson: (key: string, defaults?: { controls?: Record<string, Record<string, string>> }) => void;
  select: (id: string | null, opts?: { fly?: { position: [number, number, number]; target: [number, number, number] } }) => void;
  hover: (id: string | null) => void;
  setIsolate: (v: boolean) => void;
  setCutaway: (v: number, commit?: boolean) => void;
  setLayerStep: (v: number) => void;
  setExplode: (v: number, commit?: boolean) => void;
  setControl: (partId: string, key: string, value: string) => void;
  setVariant: (v: string | null) => void;
  setLabels: (v: boolean) => void;
  setActiveTab: (id: string) => void;
  setFlyout: (f: Flyout) => void;
  setRailOpen: (v: boolean) => void;
  setSheet: (d: SheetDetent) => void;
  setZoomedIn: (v: boolean) => void;
  requestCamera: (r: CameraRequestInput) => void;
  /** Snapshot the current state onto the undo stack (call after a discrete change) */
  commit: () => void;
  undo: () => void;
  redo: () => void;
  resetView: () => void;
}

const HISTORY_LIMIT = 50;
let nonce = 0;

const snap = (s: WorkspaceState): HistoryState => ({
  selectedId: s.selectedId,
  isolate: s.isolate,
  cutaway: s.cutaway,
  layerStep: s.layerStep,
  explode: s.explode,
  controls: s.controls,
});

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  lessonKey: null,
  selectedId: null,
  hoveredId: null,
  examined: [],
  variant: null,
  isolate: false,
  labels: true,
  cutaway: 0,
  layerStep: 0,
  explode: 0,
  controls: {},
  activeTab: "",
  flyout: null,
  railOpen: false,
  sheet: "peek",
  zoomedIn: false,
  camera: null,
  past: [],
  future: [],

  startLesson: (key, defaults) =>
    set((s) =>
      s.lessonKey === key
        ? s
        : {
            lessonKey: key,
            selectedId: null,
            hoveredId: null,
            examined: [],
            variant: null,
            isolate: false,
            cutaway: 0,
            layerStep: 0,
            explode: 0,
            controls: defaults?.controls ?? {},
            flyout: null,
            zoomedIn: false,
            camera: null,
            past: [],
            future: [],
            // `activeTab`, `labels` and `railOpen` deliberately survive a lesson change
          },
    ),

  select: (id, opts) => {
    const s = get();
    if (id === s.selectedId && !opts?.fly) return;
    set({
      past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
      future: [],
      selectedId: id,
      // Opening a part counts as examining it. Only the first time is recorded.
      examined: id && !s.examined.includes(id) ? [...s.examined, id] : s.examined,
      flyout: null,
      camera: opts?.fly ? { kind: "goto", ...opts.fly, nonce: ++nonce } : s.camera,
    });
  },

  hover: (id) => set((s) => (s.hoveredId === id ? s : { hoveredId: id })),
  setIsolate: (v) => {
    get().commit();
    set({ isolate: v });
  },
  setCutaway: (v, commit) => {
    if (commit) get().commit();
    set({ cutaway: v });
  },
  setLayerStep: (v) => {
    get().commit();
    set({ layerStep: v });
  },
  setExplode: (v, commit) => {
    if (commit) get().commit();
    set({ explode: v });
  },
  setControl: (partId, key, value) => {
    get().commit();
    set((s) => ({ controls: { ...s.controls, [partId]: { ...s.controls[partId], [key]: value } } }));
  },
  setVariant: (v) =>
    set((s) =>
      s.variant === v
        ? s
        : { variant: v, selectedId: null, hoveredId: null, isolate: false, cutaway: 0, layerStep: 0, explode: 0, camera: { kind: "reset", nonce: ++nonce } },
    ),
  setLabels: (v) => set({ labels: v }),
  setActiveTab: (id) => set({ activeTab: id }),
  setFlyout: (f) => set({ flyout: f }),
  setRailOpen: (v) => set({ railOpen: v }),
  setSheet: (d) => set({ sheet: d }),
  setZoomedIn: (v) => set((s) => (s.zoomedIn === v ? s : { zoomedIn: v })),
  requestCamera: (r) => set({ camera: { ...r, nonce: ++nonce } as CameraRequest }),

  commit: () => {
    const s = get();
    set({ past: [...s.past, snap(s)].slice(-HISTORY_LIMIT), future: [] });
  },
  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({ ...prev, past: s.past.slice(0, -1), future: [snap(s), ...s.future] });
  },
  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({ ...next, future: s.future.slice(1), past: [...s.past, snap(s)] });
  },
  resetView: () => {
    get().commit();
    set({ selectedId: null, isolate: false, cutaway: 0, layerStep: 0, explode: 0 });
    get().requestCamera({ kind: "reset" });
  },
}));
