/**
 * Database client. Lazy and optional: with no DATABASE_URL (the test sandbox) the app
 * still runs, accounts are simply unavailable and progress stays in the browser.
 * `dbConfigured()` is how every caller asks.
 *
 * Driver choice: a Neon URL uses Neon's HTTP driver (no connection to hold open, right
 * for serverless); any other Postgres URL (local development, CI) uses node-postgres.
 * Both expose the same Drizzle query API, so nothing else in the app knows which is in use.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/** Typed as the Neon flavour; the node-postgres client is query-compatible for everything we use. */
type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

let cached: Db | null = null;

export const isNeonUrl = (url: string) => /(^|[@.])neon\.tech([:/]|$)/.test(url) || process.env.DB_DRIVER === "neon";

function make(url: string): Db {
  if (isNeonUrl(url)) return drizzleNeon(neon(url), { schema });
  return drizzlePg(new Pool({ connectionString: url, max: 5 }), { schema }) as unknown as Db;
}

export const dbConfigured = () => Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (cached ??= make(process.env.DATABASE_URL));
}

export { schema };
