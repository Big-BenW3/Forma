"use client";
/** Browser-side Better Auth client. Talks to /api/auth/*. */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
