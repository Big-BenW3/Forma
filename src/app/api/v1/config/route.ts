/** GET /api/v1/config -> { accounts: boolean }. Lets the UI hide sign-in when no database is attached. */
import { NextResponse } from "next/server";
import { dbConfigured } from "@/server/db";

export const dynamic = "force-dynamic";

export const GET = () => NextResponse.json({ accounts: dbConfigured() });
