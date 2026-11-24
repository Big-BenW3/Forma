/**
 * Better Auth setup (email + password, sessions in Postgres).
 *
 * Built lazily on first use so that importing this file never fails when the
 * environment has no database. Required env when accounts are on:
 *   DATABASE_URL         Neon connection string
 *   BETTER_AUTH_SECRET   32+ random characters
 *   BETTER_AUTH_URL      the public origin, e.g. https://forma.onrender.com
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb, schema } from "./db";

let instance: ReturnType<typeof create> | null = null;

function create() {
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // v1 sends no email, so there is nothing to verify against. Revisit with a mail provider.
      requireEmailVerification: false,
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    // Better Auth rate-limits sign-in and sign-up per IP by default in production.
    plugins: [nextCookies()],
  });
}

export function getAuth() {
  return (instance ??= create());
}
