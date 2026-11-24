/**
 * Applies the SQL migrations in ./drizzle when the server starts (see
 * src/instrumentation.ts). Doing it here, inside the app, means the production
 * image needs no separate migration step and no dev tooling: the migrator is
 * part of the traced server bundle.
 *
 * With no database configured this does nothing. A failure is logged but does not
 * stop the server: lessons keep working, only accounts are affected.
 */
import path from "node:path";
import { isNeonUrl } from "./db";

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  try {
    if (isNeonUrl(url)) {
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      const { migrate } = await import("drizzle-orm/neon-http/migrator");
      await migrate(drizzle(neon(url)), { migrationsFolder });
    } else {
      const { Pool } = await import("pg");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      const pool = new Pool({ connectionString: url, max: 1 });
      await migrate(drizzle(pool), { migrationsFolder });
      await pool.end();
    }
    console.log("[migrate] database is up to date");
  } catch (e) {
    console.error("[migrate] failed; accounts may not work:", e instanceof Error ? e.message : e);
  }
}
