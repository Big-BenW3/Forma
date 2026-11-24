/**
 * Writes the logo files from the same paths the app draws (src/components/brand/Logo.tsx):
 *
 *   public/brand/forma-mark.svg        the mark, for light backgrounds
 *   public/brand/forma-mark-dark.svg   the mark, for dark backgrounds
 *   public/brand/forma-mark-512.png    raster of the mark (transparent)
 *   src/app/icon.svg                   favicon: the mark on a rounded paper tile, so it
 *                                      stays visible on dark browser tab bars
 *   src/app/apple-icon.png             180 px home-screen icon
 *
 * Run: npx tsx scripts/brand.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { MARK, TONES } from "../src/components/brand/Logo";

const faces = (tone: keyof typeof TONES, transform = "") => {
  const t = TONES[tone];
  const p = (d: string, f: string) => `<path d="${d}" fill="${f}"/>`;
  return `<g${transform ? ` transform="${transform}"` : ""}>${p(MARK.top, t.top)}${p(MARK.right, t.right)}${p(MARK.left, t.left)}${p(MARK.cutUp, t.cutUp)}${p(MARK.cutRight, t.cutRight)}${p(MARK.cutLeft, t.cutLeft)}</g>`;
};
const svg = (body: string, title = "FORMA") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

// The tile: the mark at 80% on the paper colour, corners rounded like an app icon.
const tile = svg(`<rect width="64" height="64" rx="14" fill="#f9f2e5"/>${faces("light", "translate(6.4 6.4) scale(0.8)")}`);

(async () => {
  mkdirSync("public/brand", { recursive: true });
  writeFileSync("public/brand/forma-mark.svg", svg(faces("light")));
  writeFileSync("public/brand/forma-mark-dark.svg", svg(faces("dark")));
  writeFileSync("src/app/icon.svg", tile);
  await sharp(Buffer.from(svg(faces("light")))).resize(512, 512).png().toFile("public/brand/forma-mark-512.png");
  await sharp(Buffer.from(tile)).resize(180, 180).png().toFile("src/app/apple-icon.png");
  console.log("brand files written");
})();
