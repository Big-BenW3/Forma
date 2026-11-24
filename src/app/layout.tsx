import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no network call at build time). Barlow carries the body,
// Barlow Semi Condensed the headings and buttons; JetBrains Mono is reserved
// for pins, registers, code and measurements.
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FORMA — learn by taking things apart", template: "%s · FORMA" },
  description:
    "Interactive 3D lessons in medicine, mechatronics, architecture and software. Click any part and it explains itself.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The workspace handles its own pinch-zoom on the canvas, so we stop the
  // browser from zooming the whole page underneath it.
  maximumScale: 1,
  themeColor: "#f6eddd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
