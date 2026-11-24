/**
 * Applies the SQL migrations in ./drizzle to the database.
 * For local use (`npm run db:migrate`). The deployed server applies the same
 * migrations itself on start (src/server/migrate.ts via src/instrumentation.ts).
 * With no DATABASE_URL it does nothing: accounts are simply off.
 * Same driver rule as src/server/db: Neon URL -> HTTP driver, otherwise node-postgres.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set; skipping (accounts are off).");
  process.exit(0);
}
try {
  if (/(^|[@.])neon\.tech([:/]|$)/.test(url) || process.env.DB_DRIVER === "neon") {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  } else {
    const { default: pg } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new pg.Pool({ connectionString: url, max: 1 });
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    await pool.end();
  }
  console.log("[migrate] database is up to date.");
} catch (e) {
  console.error("[migrate] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
}
