"use client";
/**
 * One form for both sign in and sign up. Email + password only (v1).
 * After sign up we send the student to /welcome; after sign in, back to where
 * they were headed (`next`, only if it is a same-site path) or /home.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { refreshAccount, useAccount } from "@/lib/useAccount";

const field = "mt-1 w-full rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[14px] text-ink outline-none focus:border-ink";

/** Only same-site relative paths; anything else would be an open redirect. */
const safeNext = (n: string | null) => (n && /^\/(?!\/)[\w\-./]*$/.test(n) ? n : null);

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, accounts } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const name = String(f.get("name") ?? "").trim();
    if (password.length < 8) return setError("Use at least 8 characters for the password.");
    setBusy(true);
    const res = signup ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] }) : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      // Same wording for wrong password and unknown email, so the form does not reveal which accounts exist.
      setError(signup ? (res.error.message ?? "Could not create the account.") : "That email and password do not match.");
      return;
    }
    await refreshAccount();
    router.push(signup ? "/welcome" : (safeNext(params.get("next")) ?? "/home"));
    router.refresh();
  }

  if (ready && !accounts) {
    return (
      <p className="mt-4 rounded-[10px] border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink-2">
        Accounts are not switched on for this server yet. Every lesson still works without one, and your progress is kept in this browser.
        <Link href="/home" className="ml-1 font-semibold text-ink underline">Go to the lessons</Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
      {signup && (
        <label className="text-[12.5px] font-semibold text-ink-2">
          Name
          <input name="name" autoComplete="name" className={field} placeholder="What should we call you?" />
        </label>
      )}
      <label className="text-[12.5px] font-semibold text-ink-2">
        Email
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="text-[12.5px] font-semibold text-ink-2">
        Password
        <input name="password" type="password" required minLength={8} autoComplete={signup ? "new-password" : "current-password"} className={field} />
        {signup && <span className="mt-1 block text-[12px] font-normal text-ink-3">At least 8 characters.</span>}
      </label>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-accent-strong">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !ready}
        className="rounded-[9px] bg-ink px-4 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] text-surface disabled:opacity-50"
      >
        {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
      </button>
      <p className="text-[13px] text-ink-2">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={signup ? "/signin" : "/signup"} className="font-semibold text-ink underline">
          {signup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
