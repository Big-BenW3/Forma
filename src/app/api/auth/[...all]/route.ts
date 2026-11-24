/** Better Auth's endpoints (/api/auth/sign-in/email, /sign-up/email, /get-session, ...). */
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, type NextRequest } from "next/server";
import { dbConfigured } from "@/server/db";
import { getAuth } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unavailable = () => NextResponse.json({ message: "Accounts are not enabled on this server." }, { status: 503 });

export async function GET(req: NextRequest) {
  if (!dbConfigured()) return unavailable();
  return toNextJsHandler(getAuth()).GET(req);
}

export async function POST(req: NextRequest) {
  if (!dbConfigured()) return unavailable();
  return toNextJsHandler(getAuth()).POST(req);
}
