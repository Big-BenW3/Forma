"use client";
/**
 * Who is using the app, as far as the UI needs to know.
 *
 *   accounts: does this server have a database and auth configured at all?
 *   user:     the signed-in student, or null
 *
 * `ready` is false until both answers are in, so the header does not flash the
 * wrong button. The session is only asked for when accounts exist (otherwise the
 * auth endpoint answers 503 and the console fills with errors). The answer lives
 * in a small shared store so signing in or out updates every component at once:
 * call `refreshAccount()` after either.
 */
import { useEffect } from "react";
import { create } from "zustand";
import { authClient } from "@/lib/auth-client";

interface AccountState {
  accounts: boolean | null;
  user: { id: string; name: string; email: string } | null;
  sessionChecked: boolean;
  loading: boolean;
}

const useAccountStore = create<AccountState>(() => ({ accounts: null, user: null, sessionChecked: false, loading: false }));

async function loadSession() {
  const { data } = await authClient.getSession();
  useAccountStore.setState({ user: data?.user ? { id: data.user.id, name: data.user.name, email: data.user.email } : null, sessionChecked: true });
}

export async function refreshAccount() {
  if (useAccountStore.getState().accounts) await loadSession();
}

async function init() {
  const st = useAccountStore.getState();
  if (st.loading || st.accounts !== null) return;
  useAccountStore.setState({ loading: true });
  let accounts = false;
  try {
    const r = await fetch("/api/v1/config");
    accounts = ((await r.json()) as { accounts: boolean }).accounts === true;
  } catch {
    accounts = false;
  }
  useAccountStore.setState({ accounts, loading: false, sessionChecked: !accounts });
  if (accounts) await loadSession().catch(() => useAccountStore.setState({ sessionChecked: true }));
}

export function useAccount() {
  useEffect(() => {
    void init();
  }, []);
  const accounts = useAccountStore((s) => s.accounts);
  const user = useAccountStore((s) => s.user);
  const sessionChecked = useAccountStore((s) => s.sessionChecked);
  return { ready: accounts !== null && sessionChecked, accounts: accounts === true, user };
}
