/**
 * Plan symbols for the furniture in house.ts FURNITURE, drawn the way an
 * architect draws them on a 1:100 plan: thin outlines, a few inner lines that
 * say what the thing is (pillows on a bed, rings on a hob), no shading.
 *
 * Each symbol is authored centred on the origin with its FRONT toward +y (which
 * is +z, south, on the plan) and its width along x, then rotated to face the way
 * the layout says.
 */
import { FURNITURE, type Furniture } from "@/content/disciplines/architecture/house";
import { INK_2, LW } from "./drawing";

const rot = { s: 0, e: -90, n: 180, w: 90 } as const;

function Symbol({ f }: { f: Furniture }) {
  const { w, d } = f;
  const hw = w / 2, hd = d / 2;
  const R = (x: number, y: number, ww: number, hh: number, rx = 0.03, extra: Record<string, unknown> = {}) => <rect x={x} y={y} width={ww} height={hh} rx={rx} {...extra} />;
  switch (f.kind) {
    case "bed_double":
    case "bed_single": {
      const pillows = f.kind === "bed_double" ? [-hw + 0.1, 0.05] : [-hw + 0.12];
      const pw = f.kind === "bed_double" ? hw - 0.15 : w - 0.24;
      return (
        <g>
          {R(-hw, -hd, w, d, 0.04)}
          {R(-hw, -hd, w, 0.08, 0.02)}
          {pillows.map((x, i) => <g key={i}>{R(x, -hd + 0.14, pw, 0.34, 0.08)}</g>)}
          <path d={`M ${-hw} ${-hd + 0.62} L ${hw} ${-hd + 0.62} M ${hw - 0.45} ${-hd + 0.62} L ${hw} ${-hd + 1.0}`} />
        </g>
      );
    }
    case "nightstand":
      return <g>{R(-hw, -hd, w, d)}<circle r={Math.min(w, d) * 0.28} /></g>;
    case "wardrobe":
      return (
        <g>
          {R(-hw, -hd, w, d, 0.01)}
          <line x1={-hw + 0.08} y1={0} x2={hw - 0.08} y2={0} strokeDasharray="0.08 0.05" />
          {Array.from({ length: Math.round(w / 0.18) }, (_, i) => -hw + 0.15 + i * 0.18).map((x) => <line key={x} x1={x - 0.04} y1={-0.17} x2={x + 0.04} y2={0.17} />)}
        </g>
      );
    case "desk":
      return R(-hw, -hd, w, d, 0.01);
    case "chair":
      return <g>{R(-hw, -hd, w, d, 0.05)}<line x1={-hw} y1={-hd + 0.06} x2={hw} y2={-hd + 0.06} /></g>;
    case "rug":
      return R(-hw, -hd, w, d, 0.04, { strokeDasharray: "0.06 0.04", strokeWidth: LW.hair });
    case "bath":
      return <g>{R(-hw, -hd, w, d, 0.08)}{R(-hw + 0.07, -hd + 0.1, w - 0.14, d - 0.17, 0.2)}<circle cx={0} cy={-hd + 0.22} r={0.03} /></g>;
    case "toilet":
      return <g>{R(-hw, -hd, w, 0.2, 0.03)}<ellipse cx={0} cy={0.07} rx={hw * 0.86} ry={hd * 0.62} /></g>;
    case "basin":
      return <g>{R(-hw, -hd, w, d, 0.07)}<ellipse cx={0} cy={0.03} rx={hw * 0.7} ry={hd * 0.6} /></g>;
    case "counter":
      return <g>{R(-hw, -hd, w, d, 0.0)}<line x1={-hw} y1={-hd + 0.34} x2={hw} y2={-hd + 0.34} strokeDasharray="0.08 0.05" strokeWidth={LW.hair} /></g>;
    case "hob":
      return <g>{R(-hw + 0.02, -hd + 0.02, w - 0.04, d - 0.04, 0.02)}{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => <circle key={i} cx={sx * w * 0.22} cy={sy * d * 0.22} r={0.08} />)}</g>;
    case "sink":
      return <g>{R(-hw, -hd, w, d, 0.04)}{R(-hw + 0.05, -hd + 0.06, w * 0.48, d - 0.12, 0.05)}{R(0.07, -hd + 0.06, w * 0.34, d - 0.12, 0.05)}</g>;
    case "fridge":
      return <g>{R(-hw, -hd, w, d, 0.02)}<line x1={-hw} y1={-hd} x2={hw} y2={hd} strokeWidth={LW.hair} /><line x1={hw} y1={-hd} x2={-hw} y2={hd} strokeWidth={LW.hair} /></g>;
    case "table":
      return R(-hw, -hd, w, d, 0.02);
    case "sofa":
      return <g>{R(-hw, -hd, w, d, 0.06)}{R(-hw + 0.18, -hd, w - 0.36, 0.2, 0.03)}{[1, 2].map((k) => <line key={k} x1={-hw + 0.18 + ((w - 0.36) * k) / 3} y1={-hd + 0.2} x2={-hw + 0.18 + ((w - 0.36) * k) / 3} y2={hd} />)}</g>;
    case "armchair":
      return <g>{R(-hw, -hd, w, d, 0.06)}{R(-hw + 0.15, -hd + 0.16, w - 0.3, d - 0.16, 0.04)}</g>;
    case "coffee_table":
      return R(-hw, -hd, w, d, 0.02);
    case "tv_unit":
      return <g>{R(-hw, -hd, w, d, 0.01)}<line x1={-0.62} y1={-hd + 0.12} x2={0.62} y2={-hd + 0.12} strokeWidth={LW.seen} /></g>;
    case "plant":
      return <g><circle r={w * 0.45} />{[0, 60, 120].map((a) => <line key={a} x1={-w * 0.4} y1={0} x2={w * 0.4} y2={0} transform={`rotate(${a})`} strokeWidth={LW.hair} />)}</g>;
    case "lamp":
      return <g><circle r={w * 0.35} /><line x1={-w * 0.25} y1={-w * 0.25} x2={w * 0.25} y2={w * 0.25} /><line x1={w * 0.25} y1={-w * 0.25} x2={-w * 0.25} y2={w * 0.25} /></g>;
  }
}

export function FurnitureLayer({ dim }: { dim?: (room: string) => boolean }) {
  return (
    <g fill="none" stroke={INK_2} strokeWidth={LW.light} style={{ pointerEvents: "none" }}>
      {FURNITURE.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.z}) rotate(${rot[f.face]})`} opacity={dim?.(f.room) ? 0.35 : 1} fill={f.kind === "rug" ? "none" : "#fbf8f1"}>
          <Symbol f={f} />
        </g>
      ))}
    </g>
  );
}
