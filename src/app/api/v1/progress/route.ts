/**
 * GET  /api/v1/progress                       -> { keys: ["medicine/the_cell", ...], signedIn }
 * POST /api/v1/progress { lessonKey, snapshot } -> 200 { saved: true } | 200 { saved: false, signedIn: false } | 422 not passed
 *
 * Being signed out is a normal state, not an error: progress then lives in the
 * browser, so both calls answer 200 with nothing saved rather than 401.
 *
 * The server never trusts the client's verdict: it re-derives evidence and re-runs the
 * validator (src/server/progress.ts) before it writes anything.
 */
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/server/auth";
import { dbConfigured, getDb, schema } from "@/server/db";
import { judge } from "@/server/progress";
import { RateLimiter } from "@/server/compile-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Judging a sketch compiles and emulates, so cap submissions per user.
const limiter = new RateLimiter(20, 60_000);

async function currentUserId(req: NextRequest): Promise<string | null> {
  if (!dbConfigured()) return null;
  const s = await getAuth().api.getSession({ headers: req.headers });
  return s?.user.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return NextResponse.json({ keys: [], signedIn: false });
  const rows = await getDb().select({ k: schema.progress.lessonKey }).from(schema.progress).where(eq(schema.progress.userId, userId));
  return NextResponse.json({ keys: rows.map((r) => r.k), signedIn: true });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return NextResponse.json({ saved: false, signedIn: false });
  if (!limiter.allow(userId)) return NextResponse.json({ message: "Slow down a little." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Send JSON." }, { status: 400 });
  }
  const result = await judge(body);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });

  const db = getDb();
  const existing = await db
    .select({ id: schema.progress.id })
    .from(schema.progress)
    .where(and(eq(schema.progress.userId, userId), eq(schema.progress.lessonKey, result.lessonKey)))
    .limit(1);
  if (existing.length === 0) {
    await db
      .insert(schema.progress)
      .values({ id: crypto.randomUUID(), userId, lessonKey: result.lessonKey, checks: result.verdict.checks.map((c) => ({ id: c.id, passed: c.passed })) })
      .onConflictDoNothing();
  }
  return NextResponse.json({ saved: true });
}
