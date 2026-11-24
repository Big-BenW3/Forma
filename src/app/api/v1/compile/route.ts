/**
 * POST /api/v1/compile  { source: string }  ->  { hex } | { message, diagnostics }
 * Public, so it is rate limited per client address. See src/server/compile.ts.
 */
import { NextResponse, type NextRequest } from "next/server";
import { compileSketch } from "@/server/compile";
import { RateLimiter } from "@/server/compile-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new RateLimiter(10, 60_000);

export async function POST(req: NextRequest) {
  // Behind Render's proxy the client address is the first X-Forwarded-For entry.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!limiter.allow(ip)) {
    return NextResponse.json({ message: "Too many compiles. Wait a minute and try again.", diagnostics: [] }, { status: 429, headers: { "Retry-After": "30" } });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Send JSON.", diagnostics: [] }, { status: 400 });
  }
  const result = await compileSketch((body as { source?: unknown } | null)?.source);
  if (result.ok) return NextResponse.json({ hex: result.hex, cached: result.cached });
  return NextResponse.json({ message: result.message, diagnostics: result.diagnostics }, { status: result.status });
}
