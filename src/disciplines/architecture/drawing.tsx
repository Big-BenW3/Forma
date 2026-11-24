/**
 * Shared drawing kit for the architecture drawings (plan, elevation, section).
 *
 * Everything is in METRES in SVG user space, so the drawings are generated
 * straight from the house data with no scaling arithmetic. Line weights follow
 * drafting practice: what is CUT is heaviest, what is seen beyond is medium,
 * furniture and hatching are light, dimensions are hairline.
 */
import type { ReactNode } from "react";

export const INK = "#1a2230";
export const INK_2 = "#4b5666";
export const INK_3 = "#8a93a0";
export const PAPER = "#f8f4ea";

export const LW = { cut: 0.035, seen: 0.022, light: 0.013, hair: 0.008 } as const;
export const TXT = { title: 0.36, label: 0.3, small: 0.22, tiny: 0.18 } as const;

/** A dimension string: extension lines, a dimension line with 45-degree ticks, and the value in mm. */
export function Dim({ a, b, at, side = "above", offset = 0.0 }: { a: [number, number]; b: [number, number]; at: number; side?: "above" | "below" | "left" | "right"; offset?: number }) {
  const horiz = a[1] === b[1];
  const len = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1000);
  const t = 0.09; // tick half-length
  const gap = 0.12; // gap between the building and the extension line
  if (horiz) {
    const y = at;
    const dir = side === "above" ? -1 : 1;
    return (
      <g stroke={INK_2} strokeWidth={LW.hair} fill={INK_2} fontSize={TXT.tiny} fontFamily="var(--font-mono)">
        <line x1={a[0]} y1={a[1] + dir * gap} x2={a[0]} y2={y + dir * 0.08} />
        <line x1={b[0]} y1={b[1] + dir * gap} x2={b[0]} y2={y + dir * 0.08} />
        <line x1={a[0] - 0.08} y1={y} x2={b[0] + 0.08} y2={y} />
        <line x1={a[0] - t} y1={y + t} x2={a[0] + t} y2={y - t} strokeWidth={LW.light} stroke={INK} />
        <line x1={b[0] - t} y1={y + t} x2={b[0] + t} y2={y - t} strokeWidth={LW.light} stroke={INK} />
        <text x={(a[0] + b[0]) / 2 + offset} y={y - 0.07} textAnchor="middle" stroke="none">{len}</text>
      </g>
    );
  }
  const x = at;
  const dir = side === "left" ? -1 : 1;
  const my = (a[1] + b[1]) / 2;
  return (
    <g stroke={INK_2} strokeWidth={LW.hair} fill={INK_2} fontSize={TXT.tiny} fontFamily="var(--font-mono)">
      <line x1={a[0] + dir * gap} y1={a[1]} x2={x + dir * 0.08} y2={a[1]} />
      <line x1={b[0] + dir * gap} y1={b[1]} x2={x + dir * 0.08} y2={b[1]} />
      <line x1={x} y1={a[1] - 0.08} x2={x} y2={b[1] + 0.08} />
      <line x1={x - t} y1={a[1] + t} x2={x + t} y2={a[1] - t} strokeWidth={LW.light} stroke={INK} />
      <line x1={x - t} y1={b[1] + t} x2={x + t} y2={b[1] - t} strokeWidth={LW.light} stroke={INK} />
      <text x={x - 0.07} y={my} textAnchor="middle" stroke="none" transform={`rotate(-90 ${x - 0.07} ${my})`}>{len}</text>
    </g>
  );
}

/** Grid bubble: a circle with a grid reference, at the end of a dash-dot grid line. */
export function GridLine({ from, to, label, bubbleAt }: { from: [number, number]; to: [number, number]; label: string; bubbleAt: [number, number] }) {
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK_3} strokeWidth={LW.hair} strokeDasharray="0.4 0.08 0.04 0.08" />
      <circle cx={bubbleAt[0]} cy={bubbleAt[1]} r={0.22} fill={PAPER} stroke={INK_2} strokeWidth={LW.light} />
      <text x={bubbleAt[0]} y={bubbleAt[1] + 0.075} textAnchor="middle" fontSize={TXT.small} fontWeight={700} fill={INK}>{label}</text>
    </g>
  );
}

/** A level marker for elevations and sections: a filled/empty triangle, the name and the height in mm. */
export function Level({ x, y, name, value, flip = false }: { x: number; y: number; name: string; value: number; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <g stroke={INK} strokeWidth={LW.light} fontSize={TXT.tiny} fontFamily="var(--font-mono)">
      <line x1={x} y1={y} x2={x + d * 1.4} y2={y} strokeDasharray="0.06 0.05" stroke={INK_3} />
      <path d={`M ${x + d * 1.4} ${y} l ${-0.1 * d} ${-0.16} l ${0.2 * d} 0 Z`} fill={INK} />
      <text x={x + d * 1.6} y={y - 0.04} textAnchor={flip ? "end" : "start"} stroke="none" fill={INK_2}>
        {name} {value >= 0 ? "+" : ""}{(value).toFixed(3)}
      </text>
    </g>
  );
}

/** The drawing's title, under the drawing: name, a rule, and the scale. */
export function Title({ x, y, name, scale = "1 : 100" }: { x: number; y: number; name: string; scale?: string }) {
  return (
    <g>
      <text x={x} y={y} fontSize={TXT.title} fontWeight={800} fill={INK} letterSpacing={0.02}>{name}</text>
      <line x1={x} y1={y + 0.12} x2={x + name.length * 0.24} y2={y + 0.12} stroke={INK} strokeWidth={LW.seen} />
      <text x={x} y={y + 0.45} fontSize={TXT.tiny} fill={INK_2} fontFamily="var(--font-mono)">SCALE {scale}</text>
    </g>
  );
}

export function Sheet({ view, label, children, caption }: { view: { x: number; y: number; w: number; h: number }; label: string; children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="m-0">
      <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="w-full select-none rounded-[6px] border border-line" role="group" aria-label={label}>
        <rect x={view.x} y={view.y} width={view.w} height={view.h} fill={PAPER} />
        {children}
      </svg>
      {caption && <figcaption className="micro mt-1.5">{caption}</figcaption>}
    </figure>
  );
}
