"use client";
/**
 * Client-side progress.
 *
 * Signed-in users: progress is stored on the server, which re-runs the
 * validator on the submitted snapshot before it records a completion (see
 * /api/v1/progress). Signed-out visitors can still use every lesson read-only
 * and keep progress in this browser only; it never claims to be saved.
 *
 * This module is the only place the client talks about completion, so the
 * storage backend can change without touching the workspace.
 */
import type { Snapshot } from "@/validators";

const KEY = "forma.completed.v1";

export function readLocalCompleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function writeLocalCompleted(keys: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(keys))));
  } catch {
    /* private mode / quota: progress simply won't persist, which is fine */
  }
}

/** Completions saved on the server for the signed-in student; [] when signed out or accounts are off. */
export async function fetchServerCompleted(): Promise<string[]> {
  try {
    const res = await fetch("/api/v1/progress", { cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { keys?: unknown };
    return Array.isArray(body.keys) ? body.keys.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export interface CompletionResult {
  /** True when the SERVER accepted the completion (signed-in users only) */
  saved: boolean;
  /** Set when the server rejected it after re-checking */
  rejected?: boolean;
}

/** Submits a completion. The server decides; we never trust the client's own verdict. */
export async function submitCompletion(lessonKey: string, snapshot: Snapshot): Promise<CompletionResult> {
  try {
    const res = await fetch("/api/v1/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonKey, snapshot }),
    });
    if (res.status === 422) return { saved: false, rejected: true };
    if (!res.ok) return { saved: false };
    const body = (await res.json().catch(() => ({}))) as { saved?: boolean };
    return { saved: body.saved === true }; // false when signed out: progress stays local
  } catch {
    return { saved: false };
  }
}
