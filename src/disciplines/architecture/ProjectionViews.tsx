"use client";
/**
 * The other two orthographic projections of the same house, generated from the
 * same data as the plan and the 3D model (house.ts):
 *
 *   SOUTH ELEVATION  the front face, looking north: what you SEE, nothing is cut.
 *                    Roof, chimney beyond, windows with their casements, the
 *                    door, the plinth, ground line and level markers.
 *   SECTION A-A      a vertical slice at x = SECTION_X (marked on the plan),
 *                    looking west: walls, slab and roof the slice CUTS are drawn
 *                    solid; the window and the archway it passes through show as
 *                    gaps with their sill and head.
 *
 * Drawing y is height, flipped (SVG y grows downward), so a point at height h is
 * drawn at y = -h.
 */
import {
  EAVE, EXT_T, FOOTPRINT, INT_T, OPENINGS, ROOF_RISE, ROOMS, SLAB_T, WALLS, WALL_H,
} from "@/content/disciplines/architecture/house";
import { Dim, INK, INK_2, INK_3, LW, Level, PAPER, Sheet, TXT, Title } from "./drawing";

const { w: FW, d: FD } = FOOTPRINT;
/** Where the section is cut (x, metres): through the bathroom, the hall and the living room. */
export const SECTION_X = 6.0;
const T_ROOF = 0.18;
const roofTop = (z: number) => WALL_H + 0.04 + (ROOF_RISE * Math.min(z, FD - z)) / (FD / 2); // matches the 3D model
const RIDGE = WALL_H + 0.04 + ROOF_RISE;
const EAVE_Y = roofTop(-EAVE);

// ------------------------------------------------------------- elevation
export function ElevationBlock() {
  const view = { x: -1.8, y: -(RIDGE + 1.35), w: FW + 5.9, h: RIDGE + 3.0 };
  const ops = OPENINGS.filter((o) => o.wall === "ext_s");
  return (
    <Sheet view={view} label="South elevation of the house" caption="What you see from the front garden. Nothing is cut, so there is no solid fill.">
      {/* roof: the south slope seen face-on, with tile courses */}
      <g stroke={INK} strokeWidth={LW.seen}>
        <rect x={-EAVE - 0.05} y={-RIDGE - 0.1} width={FW + 2 * EAVE + 0.1} height={RIDGE + 0.1 - EAVE_Y + T_ROOF} fill="#efe1d6" />
        {Array.from({ length: 13 }, (_, i) => -EAVE_Y - 0.12 - i * ((RIDGE - EAVE_Y) / 13)).map((y) => (
          <line key={y} x1={-EAVE - 0.05} y1={y} x2={FW + EAVE + 0.05} y2={y} strokeWidth={LW.hair} stroke={INK_3} />
        ))}
        <rect x={-EAVE - 0.05} y={-RIDGE - 0.13} width={FW + 2 * EAVE + 0.1} height={0.13} fill="#d9c1b2" strokeWidth={LW.light} />
        {/* fascia and gutter */}
        <rect x={-EAVE - 0.05} y={-(EAVE_Y - T_ROOF + 0.04)} width={FW + 2 * EAVE + 0.1} height={0.2} fill={PAPER} strokeWidth={LW.light} />
        <rect x={-EAVE - 0.05} y={-(EAVE_Y - T_ROOF - 0.08)} width={FW + 2 * EAVE + 0.1} height={0.1} fill="#d8dadc" strokeWidth={LW.light} />
        {/* chimney beyond the ridge */}
        <rect x={6.9} y={-(RIDGE + 0.7)} width={0.6} height={0.6} fill="#e3cfc4" strokeWidth={LW.light} />
        <rect x={6.84} y={-(RIDGE + 0.78)} width={0.72} height={0.08} fill={PAPER} strokeWidth={LW.light} />
        {[7.07, 7.33].map((x) => <rect key={x} x={x - 0.07} y={-(RIDGE + 1.06)} width={0.14} height={0.28} fill="#e8c9b3" strokeWidth={LW.light} />)}
      </g>
      {/* wall face, plinth and downpipes */}
      <g stroke={INK} strokeWidth={LW.seen}>
        <rect x={-EXT_T / 2} y={-(EAVE_Y - T_ROOF - 0.04)} width={FW + EXT_T} height={EAVE_Y - T_ROOF - 0.04} fill="#fbf8f1" />
        <rect x={-EXT_T / 2 - 0.02} y={-0.45} width={FW + EXT_T + 0.04} height={0.45} fill="#e1ddd5" strokeWidth={LW.light} />
        {[0.2, FW - 0.2].map((x) => <rect key={x} x={x - 0.035} y={-(EAVE_Y - T_ROOF)} width={0.07} height={EAVE_Y - T_ROOF} fill="#d8dadc" strokeWidth={LW.hair} />)}
      </g>
      {/* openings */}
      <g stroke={INK} strokeWidth={LW.light}>
        {ops.map((o, i) => {
          const x0 = o.at, x1 = o.at + o.w;
          if (o.kind === "door") {
            const pw = (o.w - 0.14 - 0.24) / 2;
            return (
              <g key={i}>
                <rect x={x0 - 0.35} y={-(o.head + 0.33)} width={o.w + 0.7} height={0.08} fill={PAPER} />
                <rect x={x0} y={-o.head} width={o.w} height={o.head} fill="#cfe0d9" strokeWidth={LW.seen} />
                {[[0.15, 0.85], [1.0, o.head - 0.22]].map(([a, b]) => [0, 1].map((k) => <rect key={`${a}${k}`} x={x0 + 0.15 + k * (pw + 0.08)} y={-b} width={pw} height={b - a} fill="none" />))}
                <circle cx={x1 - 0.15} cy={-1.0} r={0.03} fill={INK} />
                <rect x={x0 - 0.3} y={0} width={o.w + 0.6} height={0.15} fill="#e1ddd5" />
              </g>
            );
          }
          const n = o.w >= 1.9 ? 3 : o.w >= 1.2 ? 2 : 1;
          const tall = o.head - o.sill > 1.3;
          return (
            <g key={i}>
              <rect x={x0} y={-o.head} width={o.w} height={o.head - o.sill} fill="#e3eef4" strokeWidth={LW.seen} />
              {Array.from({ length: n - 1 }, (_, k) => x0 + (o.w * (k + 1)) / n).map((x) => <line key={x} x1={x} y1={-o.head} x2={x} y2={-o.sill} />)}
              {tall && <line x1={x0} y1={-(o.head - 0.42)} x2={x1} y2={-(o.head - 0.42)} />}
              {/* casement opening marks: the apex points to the hinge side */}
              {Array.from({ length: n }, (_, k) => [x0 + (o.w * k) / n, x0 + (o.w * (k + 1)) / n]).map(([a, b], k) => (
                <path key={k} d={`M ${a} ${-o.sill} L ${b} ${-(o.sill + (tall ? o.head - 0.42 - o.sill : o.head - o.sill) / 2)} L ${a} ${-(tall ? o.head - 0.42 : o.head)}`} fill="none" stroke={INK_3} strokeWidth={LW.hair} strokeDasharray="0.06 0.04" />
              ))}
              <rect x={x0 - 0.06} y={-o.sill} width={o.w + 0.12} height={0.06} fill="#e6e1d6" />
            </g>
          );
        })}
      </g>
      {/* ground */}
      <line x1={-1.6} y1={0.15} x2={FW + 1.6} y2={0.15} stroke={INK} strokeWidth={LW.cut} />
      <g>
        <Level x={FW + EXT_T / 2 + 0.2} y={0} name="FFL" value={0} />
        <Level x={FW + EXT_T / 2 + 0.2} y={-WALL_H} name="EAVES" value={WALL_H} />
        <Level x={FW + EXT_T / 2 + 0.2} y={-RIDGE} name="RIDGE" value={RIDGE} />
      </g>
      <Dim a={[0, 0.15]} b={[FW, 0.15]} at={0.75} side="below" />
      <Title x={-1.6} y={1.35} name="SOUTH ELEVATION" />
    </Sheet>
  );
}

// --------------------------------------------------------------- section
export function SectionBlock() {
  const view = { x: -1.8, y: -(RIDGE + 1.0), w: FD + 6.0, h: RIDGE + 2.75 };
  // Walls crossed by the section plane (x = SECTION_X), with any opening at that x
  const cuts = WALLS.filter((w) => w.a[1] === w.b[1] && Math.min(w.a[0], w.b[0]) <= SECTION_X && Math.max(w.a[0], w.b[0]) >= SECTION_X).map((w) => {
    const t = w.kind === "ext" ? EXT_T : INT_T;
    const op = OPENINGS.find((o) => o.wall === w.id && w.a[0] + o.at <= SECTION_X && w.a[0] + o.at + o.w >= SECTION_X);
    return { z: w.a[1], t, op };
  });
  const rooms = ROOMS.filter((r) => r.x0 <= SECTION_X && r.x1 >= SECTION_X);
  // Roof profile cut by the plane: the gable outline with thickness
  const roofOuter = `M ${-EAVE} ${-roofTop(-EAVE)} L ${FD / 2} ${-RIDGE} L ${FD + EAVE} ${-roofTop(-EAVE)} L ${FD + EAVE} ${-(roofTop(-EAVE) - T_ROOF)} L ${FD / 2} ${-(RIDGE - T_ROOF)} L ${-EAVE} ${-(roofTop(-EAVE) - T_ROOF)} Z`;
  return (
    <Sheet view={view} label="Section A-A through the house" caption="A vertical slice where line A-A crosses the plan, looking west. Solid black is what the slice cuts.">
      {/* the inside of the roof space and rooms, lightly toned */}
      <path d={`M 0 ${-WALL_H} L ${FD / 2} ${-(RIDGE - T_ROOF)} L ${FD} ${-WALL_H} Z`} fill="#efe9dc" />
      {/* cut: slab */}
      <rect x={-EXT_T / 2 - 0.35} y={0} width={FD + EXT_T + 0.7} height={SLAB_T} fill={INK} />
      {/* cut: roof */}
      <path d={roofOuter} fill={INK} />
      {/* ceiling line */}
      <line x1={0} y1={-WALL_H} x2={FD} y2={-WALL_H} stroke={INK_2} strokeWidth={LW.seen} />
      {/* cut: walls, with the openings the plane passes through */}
      {cuts.map(({ z, t, op }, i) => {
        const x = z - t / 2;
        if (!op) return <rect key={i} x={x} y={-WALL_H} width={t} height={WALL_H} fill={INK} />;
        return (
          <g key={i}>
            <rect x={x} y={-WALL_H} width={t} height={WALL_H - op.head} fill={INK} />
            {op.sill > 0 && <rect x={x} y={-op.sill} width={t} height={op.sill} fill={INK} />}
            {op.kind === "window" && (
              <g stroke={INK} strokeWidth={LW.light}>
                <line x1={x + t / 2} y1={-op.head} x2={x + t / 2} y2={-op.sill} />
                <rect x={x - 0.04} y={-op.sill} width={t + 0.08} height={0.05} fill={PAPER} />
              </g>
            )}
          </g>
        );
      })}
      {/* room names and heights */}
      {rooms.map((r) => {
        const cz = (r.z0 + r.z1) / 2;
        return (
          <g key={r.id} textAnchor="middle">
            <text x={cz} y={-1.35} fontSize={TXT.small} fontWeight={800} fill={INK}>{r.name.toUpperCase()}</text>
          </g>
        );
      })}
      <Dim a={[0.4, 0]} b={[0.4, -WALL_H]} at={0.75} side="right" />
      {/* ground and levels */}
      <line x1={-1.6} y1={SLAB_T} x2={FD + 1.6} y2={SLAB_T} stroke={INK} strokeWidth={LW.seen} />
      <g>
        <Level x={FD + EXT_T / 2 + 0.25} y={0} name="FFL" value={0} />
        <Level x={FD + EXT_T / 2 + 0.25} y={-WALL_H} name="CEILING" value={WALL_H} />
        <Level x={FD + EXT_T / 2 + 0.25} y={-RIDGE} name="RIDGE" value={RIDGE} />
      </g>
      <text x={-0.2} y={-0.25} fontSize={TXT.tiny} fill={INK_2} textAnchor="end">N</text>
      <text x={FD + 0.2} y={-0.25} fontSize={TXT.tiny} fill={INK_2}>S</text>
      <Title x={-1.6} y={1.05} name="SECTION A-A" />
      <g fontSize={TXT.tiny} fill={INK_2} fontFamily="var(--font-mono)">
        <text x={FD / 2} y={-(RIDGE + 0.35)} textAnchor="middle">roof pitch {Math.round((Math.atan2(ROOF_RISE, FD / 2) * 180) / Math.PI)}°</text>
      </g>
    </Sheet>
  );
}
