/** Runs once when the Node server starts. Used only to bring the database schema up to date. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/server/migrate");
    await runMigrations();
  }
}
