"use client";
/** Right-hand header control: Sign in when signed out, name + Sign out when signed in, nothing when accounts are off. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { refreshAccount, useAccount } from "@/lib/useAccount";

export function AccountMenu() {
  const { ready, accounts, user } = useAccount();
  const router = useRouter();
  if (!ready || !accounts) return null;
  if (!user) {
    return (
      <Link href="/signin" className="rounded-[8px] border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-ground-deep">
        Sign in
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[12.5px]">
      <span className="hidden max-w-[140px] truncate text-ink-2 sm:inline">{user.name}</span>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          await refreshAccount();
          router.refresh();
        }}
        className="rounded-[8px] border border-line-strong px-3 py-1.5 font-semibold text-ink hover:bg-ground-deep"
      >
        Sign out
      </button>
    </span>
  );
}
