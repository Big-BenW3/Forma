import { defineConfig } from "drizzle-kit";

// `npm run db:generate` turns src/server/db/schema.ts into SQL under ./drizzle.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
