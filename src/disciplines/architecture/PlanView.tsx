"use client";
/**
 * The floor plan, drawn from the SAME layout the 3D model is built from
 * (src/content/disciplines/architecture/house.ts), furniture included. It is not
 * an image: every room is a button, and selecting one here selects it in 3D (and
 * the reverse), because both read the one workspace selection.
 *
 * Drafting conventions, kept because they are what the lesson teaches:
 *   - north is up; structural grid lines (1-4, A-D) on the wall centre-lines
 *   - cut walls are solid poché: exterior walls darkest, partitions a shade lighter
 *   - windows: frame lines inside the wall and a sill line outside
 *   - doors: the leaf drawn open at 90 degrees and its swing arc
 *   - archways: dashed lintel lines (the opening has a wall above it)
 *   - chained dimensions in millimetres with 45-degree ticks, overall dimension outside
 *   - section line A-A marks where the Section drawing is cut
 */
import { useWorkspace } from "@/engine/store";
import type { BlockProps } from "../types";
import {
  EXT_T, FOOTPRINT, INT_T, OPENINGS, ROOMS, WALLS, roomNetArea, wallById, type Opening, type Wall,
} from "@/content/disciplines/architecture/house";
import { Dim, GridLine, INK, INK_2, LW, PAPER, Sheet, TXT, Title } from "./drawing";
import { FurnitureLayer } from "./furnitureSymbols";
import { SECTION_X } from "./ProjectionViews";

const GROUP_FILL: Record<string, string> = { sleeping: "#6f86d8", living: "#e0a23a", service: "#3f9f8f" };
const M = 2.1; // drawing margin in metres (room for dimensions and grid bubbles)
const { w: FW, d: FD } = FOOTPRINT;

const isX = (w: Wall) => w.a[1] === w.b[1];
const thick = (w: Wall) => (w.kind === "ext" ? EXT_T : INT_T);

/** Rectangle (x, z, w, d) of the wall piece between two distances along it. */
function seg(w: Wall, s0: number, s1: number) {
  const t = thick(w);
  return isX(w) ? { x: w.a[0] + s0, y: w.a[1] - t / 2, w: s1 - s0, h: t } : { x: w.a[0] - t / 2, y: w.a[1] + s0, w: t, h: s1 - s0 };
}

/** Wall pieces between openings, as plan rectangles (solid poché). */
function wallRects(w: Wall) {
  const len = isX(w) ? Math.abs(w.b[0] - w.a[0]) : Math.abs(w.b[1] - w.a[1]);
  const ext = w.kind === "ext" ? EXT_T / 2 : 0;
  const ops = OPENINGS.filter((o) => o.wall === w.id).sort((a, b) => a.at - b.at);
  const out: Array<ReturnType<typeof seg>> = [];
  let cur = -ext;
  for (const o of ops) {
    if (o.at > cur) out.push(seg(w, cur, o.at));
    cur = o.at + o.w;
  }
  if (cur < len + ext) out.push(seg(w, cur, len + ext));
  return out;
}

/** Outward direction of an exterior wall on the plan (unit, in x/z). */
const outward = (w: Wall): [number, number] => (w.id === "ext_n" ? [0, -1] : w.id === "ext_s" ? [0, 1] : w.id === "ext_w" ? [-1, 0] : [1, 0]);

function Window({ o }: { o: Opening }) {
  const w = wallById(o.wall);
  const s = seg(w, o.at, o.at + o.w);
  const t = thick(w);
  const [ox, oz] = outward(w);
  const lines = isX(w)
    ? [s.y + t * 0.38, s.y + t * 0.62].map((y) => <line key={y} x1={s.x} y1={y} x2={s.x + s.w} y2={y} />)
    : [s.x + t * 0.38, s.x + t * 0.62].map((x) => <line key={x} x1={x} y1={s.y} x2={x} y2={s.y + s.h} />);
  // sill: a thin line just outside the wall, slightly longer than the opening
  const sill = isX(w)
    ? { x1: s.x - 0.05, x2: s.x + s.w + 0.05, y1: w.a[1] + oz * (t / 2 + 0.06), y2: w.a[1] + oz * (t / 2 + 0.06) }
    : { y1: s.y - 0.05, y2: s.y + s.h + 0.05, x1: w.a[0] + ox * (t / 2 + 0.06), x2: w.a[0] + ox * (t / 2 + 0.06) };
  return (
    <g stroke={INK} strokeWidth={LW.light}>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={PAPER} stroke={INK} strokeWidth={LW.seen} />
      {lines}
      {w.kind === "ext" && <line {...sill} strokeWidth={LW.light} />}
    </g>
  );
}

/** Door: leaf drawn open at 90 degrees and its swing arc, hinged at the opening's start edge. */
function Door({ o }: { o: Opening }) {
  const w = wallById(o.wall);
  const into = o.swing === "in-b" ? -1 : 1;
  const r = o.w - 0.06;
  const x = isX(w);
  const hx = x ? w.a[0] + o.at + 0.03 : w.a[0];
  const hz = x ? w.a[1] : w.a[1] + o.at + 0.03;
  const leafEnd: [number, number] = x ? [hx, hz + into * r] : [hx + into * r, hz];
  const arcEnd: [number, number] = x ? [hx + r, hz] : [hx, hz + r];
  const sweep = x ? (into > 0 ? 0 : 1) : into > 0 ? 1 : 0;
  const lw = 0.045; // leaf thickness on the drawing
  const leaf = x
    ? { x: hx - lw / 2, y: Math.min(hz, leafEnd[1]), width: lw, height: r }
    : { x: Math.min(hx, leafEnd[0]), y: hz - lw / 2, width: r, height: lw };
  return (
    <g stroke={INK} fill="none">
      <rect {...leaf} fill="#ffffff" strokeWidth={LW.light} />
      <path d={`M ${leafEnd[0]} ${leafEnd[1]} A ${r} ${r} 0 0 ${sweep} ${arcEnd[0]} ${arcEnd[1]}`} strokeWidth={LW.hair} />
    </g>
  );
}

/** Archway: two dashed lines across the opening (the wall continues overhead). */
function Archway({ o }: { o: Opening }) {
  const w = wallById(o.wall);
  const s = seg(w, o.at, o.at + o.w);
  return (
    <g stroke={INK_2} strokeWidth={LW.hair} strokeDasharray="0.1 0.06">
      {isX(w) ? (
        <>
          <line x1={s.x} y1={s.y} x2={s.x + s.w} y2={s.y} />
          <line x1={s.x} y1={s.y + s.h} x2={s.x + s.w} y2={s.y + s.h} />
        </>
      ) : (
        <>
          <line x1={s.x} y1={s.y} x2={s.x} y2={s.y + s.h} />
          <line x1={s.x + s.w} y1={s.y} x2={s.x + s.w} y2={s.y + s.h} />
        </>
      )}
    </g>
  );
}

// Grid lines on the main wall centre-lines
const GRID_X = [0, 4.2, 9.2, 12];
const GRID_Z = [0, 3.8, 4.8, 9];

export function PlanBlock({ lesson, manifest }: BlockProps) {
  const selectedId = useWorkspace((s) => s.selectedId);
  const hoveredId = useWorkspace((s) => s.hoveredId);
  const select = useWorkspace((s) => s.select);
  const hover = useWorkspace((s) => s.hover);

  const view = { x: -M, y: -M, w: FW + 2 * M, h: FD + 2 * M + 0.9 };
  const isRoom = (id: string | null) => !!id && ROOMS.some((r) => r.id === id);
  const focus = isRoom(selectedId) ? selectedId : null;

  const go = (id: string) => {
    const st = useWorkspace.getState();
    // The roof covers the rooms in 3D; take it off so the selection is visible.
    if (manifest.layers.length && st.layerStep < 1) st.setLayerStep(1);
    select(id, { fly: manifest.nodes[id]?.camera });
  };

  return (
    <Sheet view={view} label="Ground floor plan of the house. Rooms are buttons." caption="Tap a room to find it in 3D. Dimensions are in millimetres between wall centre-lines.">
      {/* grid */}
      <g style={{ pointerEvents: "none" }}>
        {GRID_X.map((x, i) => <GridLine key={`gx${i}`} from={[x, -1.75]} to={[x, FD + 0.4]} label={String(i + 1)} bubbleAt={[x, -1.75]} />)}
        {GRID_Z.map((z, i) => <GridLine key={`gz${i}`} from={[-1.75, z]} to={[FW + 0.4, z]} label={"ABCD"[i]} bubbleAt={[-1.75, z]} />)}
      </g>

      {/* rooms: tinted fills that are also the buttons */}
      {ROOMS.map((r) => {
        const sel = selectedId === r.id;
        const hov = hoveredId === r.id;
        return (
          <rect
            key={r.id}
            role="button"
            tabIndex={0}
            aria-label={`${r.name}, ${roomNetArea(r)} square metres`}
            aria-pressed={sel}
            className="cursor-pointer outline-none"
            x={r.x0}
            y={r.z0}
            width={r.x1 - r.x0}
            height={r.z1 - r.z0}
            fill={GROUP_FILL[r.group]}
            fillOpacity={sel ? 0.34 : hov ? 0.2 : 0.06}
            onClick={() => go(r.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go(r.id))}
            onPointerEnter={() => hover(r.id)}
            onPointerLeave={() => hover(null)}
          />
        );
      })}

      <FurnitureLayer dim={(room) => !!focus && room !== focus} />

      {/* walls: exterior solid ink, partitions a shade lighter; outlines keep them crisp */}
      <g style={{ pointerEvents: "none" }}>
        {WALLS.flatMap((w) =>
          wallRects(w).map((r, i) => <rect key={`${w.id}${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={w.kind === "ext" ? INK : "#5b6474"} stroke={INK} strokeWidth={LW.hair} />),
        )}
      </g>

      <g style={{ pointerEvents: "none" }}>
        {OPENINGS.filter((o) => o.kind === "window").map((o, i) => <Window key={`w${i}`} o={o} />)}
        {OPENINGS.filter((o) => o.kind === "door").map((o, i) => <Door key={`d${i}`} o={o} />)}
        {OPENINGS.filter((o) => o.kind === "opening").map((o, i) => <Archway key={`a${i}`} o={o} />)}
      </g>

      {/* room labels */}
      <g style={{ pointerEvents: "none" }} textAnchor="middle">
        {ROOMS.map((r) => {
          const part = lesson.parts.find((p) => p.id === r.id);
          const hall = r.id === "room_hall";
          const cx = hall ? 6.4 : r.id === "room_bedroom_3" ? 10.4 : r.id === "room_living" ? 10.2 : (r.x0 + r.x1) / 2;
          const cz = hall ? (r.z0 + r.z1) / 2 + 0.05 : r.id === "room_living" ? 8.35 : r.id === "room_kitchen" ? 7.6 : r.id === "room_bedroom_3" ? 3.45 : r.z1 - 0.75;
          return (
            <g key={r.id}>
              <rect x={cx - 1.05} y={cz - 0.3} width={2.1} height={hall ? 0.42 : 0.62} rx={0.05} fill={PAPER} fillOpacity={0.88} />
              <text x={cx} y={cz} fontSize={TXT.small} fontWeight={800} fill={INK} letterSpacing={0.01}>{(part?.name ?? r.name).toUpperCase()}</text>
              {!hall && <text x={cx} y={cz + 0.25} fontSize={TXT.tiny} fill={INK_2} fontFamily="var(--font-mono)">{roomNetArea(r)} m²</text>}
            </g>
          );
        })}
      </g>

      {/* chained and overall dimensions */}
      <g style={{ pointerEvents: "none" }}>
        {GRID_X.slice(1).map((x, i) => <Dim key={`cx${i}`} a={[GRID_X[i], -EXT_T / 2]} b={[x, -EXT_T / 2]} at={-0.6} />)}
        <Dim a={[0, -EXT_T / 2]} b={[FW, -EXT_T / 2]} at={-1.05} />
        {GRID_Z.slice(1).map((z, i) => <Dim key={`cz${i}`} a={[FW + EXT_T / 2, GRID_Z[i]]} b={[FW + EXT_T / 2, z]} at={FW + 0.6} side="right" />)}
        <Dim a={[FW + EXT_T / 2, 0]} b={[FW + EXT_T / 2, FD]} at={FW + 1.05} side="right" />
      </g>

      {/* section line A-A */}
      <g style={{ pointerEvents: "none" }} stroke={INK} fill={INK}>
        <line x1={SECTION_X} y1={-0.4} x2={SECTION_X} y2={FD + 0.4} strokeWidth={LW.light} strokeDasharray="0.5 0.1 0.08 0.1" />
        {[-0.4, FD + 0.4].map((z) => (
          <g key={z}>
            <path d={`M ${SECTION_X} ${z} l -0.38 0`} strokeWidth={LW.cut} />
            <path d={`M ${SECTION_X - 0.38} ${z} l 0.14 -0.09 l 0 0.18 Z`} stroke="none" />
            <text x={SECTION_X + 0.12} y={z + (z < 0 ? -0.08 : 0.24)} fontSize={TXT.small} fontWeight={800} stroke="none">A</text>
          </g>
        ))}
      </g>

      {/* north arrow, scale bar and title */}
      <g style={{ pointerEvents: "none" }} fill={INK}>
        <g transform={`translate(${FW + 1.35}, ${FD + 1.35})`}>
          <circle r={0.32} fill="none" stroke={INK} strokeWidth={LW.light} />
          <path d="M 0 -0.42 L 0.14 0.12 L 0 0.04 L -0.14 0.12 Z" />
          <text y={-0.5} textAnchor="middle" fontSize={TXT.tiny} fontWeight={800}>N</text>
        </g>
        <g transform={`translate(${FW - 2.6}, ${FD + 1.55})`} fontSize={TXT.tiny} fontFamily="var(--font-mono)">
          {[0, 1, 2, 3].map((k) => <rect key={k} x={k * 0.5} y={-0.07} width={0.5} height={0.07} fill={k % 2 ? PAPER : INK} stroke={INK} strokeWidth={LW.hair} />)}
          <text x={0} y={0.26}>0</text>
          <text x={1} y={0.26} textAnchor="middle">1</text>
          <text x={2} y={0.26} textAnchor="end">2 m</text>
        </g>
        <Title x={0} y={FD + 1.35} name="GROUND FLOOR PLAN" />
      </g>
    </Sheet>
  );
}
