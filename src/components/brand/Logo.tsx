/**
 * The FORMA mark: an isometric cube with its nearest corner cut away, showing the
 * cut faces in teal. It is the product in one picture: take a solid
 * thing, cut into it, and see what is inside.
 *
 * Drawn on a 64 x 64 isometric grid (cube edge 26, centred). Faces are shaded by
 * the direction they face, the same way the models are lit: up-facing lightest,
 * right-facing middle, left-facing darkest. The cut faces follow the same rule in
 * orange, so the notch reads as a solid orange corner set into a grey block.
 *
 * Kept as paths (no text, no filters) so it stays sharp from a 16 px favicon up.
 * The standalone files in /public/brand are generated from the same paths.
 */
import { useId } from "react";

export const MARK = {
  viewBox: "0 0 64 64",
  top: "M32 6 L54.52 19 L43.26 25.5 L32 19 L20.74 25.5 L9.48 19 Z",
  right: "M54.52 19 L54.52 45 L32 58 L32 45 L43.26 38.5 L43.26 25.5 Z",
  left: "M9.48 19 L20.74 25.5 L20.74 38.5 L32 45 L32 58 L9.48 45 Z",
  cutUp: "M32 32 L43.26 38.5 L32 45 L20.74 38.5 Z",
  cutRight: "M32 32 L32 19 L20.74 25.5 L20.74 38.5 Z",
  cutLeft: "M32 32 L32 19 L43.26 25.5 L43.26 38.5 Z",
} as const;

export const TONES = {
  /** on the light paper background */
  light: { top: "#4a5578", right: "#2c3657", left: "#18213d", cutUp: "#5fd0cd", cutRight: "#1aa3a1", cutLeft: "#12807e" },
  /** on the dark ink background */
  dark: { top: "#f9f2e5", right: "#d3cab8", left: "#a9a091", cutUp: "#7fe0dd", cutRight: "#2bb9b6", cutLeft: "#178a88" },
} as const;

export function LogoMark({ size = 22, tone = "light", title }: { size?: number; tone?: keyof typeof TONES; title?: string }) {
  const id = useId();
  const t = TONES[tone];
  return (
    <svg width={size} height={size} viewBox={MARK.viewBox} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-labelledby={title ? id : undefined} className="shrink-0">
      {title && <title id={id}>{title}</title>}
      <path d={MARK.top} fill={t.top} />
      <path d={MARK.right} fill={t.right} />
      <path d={MARK.left} fill={t.left} />
      <path d={MARK.cutUp} fill={t.cutUp} />
      <path d={MARK.cutRight} fill={t.cutRight} />
      <path d={MARK.cutLeft} fill={t.cutLeft} />
    </svg>
  );
}

/** Mark and name together, for headers. The name is set in the app's Barlow Semi Condensed. */
export function Wordmark({ className = "", size = 22, tone = "light" }: { className?: string; size?: number; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span className="text-[14px] font-extrabold tracking-[0.2em]">FORMA</span>
    </span>
  );
}
