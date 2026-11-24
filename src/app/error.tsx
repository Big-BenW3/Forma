"use client";
/** Last-resort boundary for a page that throws while rendering. */
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="paper flex min-h-screen items-center justify-center px-5">
      <div className="max-w-[420px]">
        <p className="micro">Something went wrong</p>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-tight">This page could not be shown</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">It is not you. Try again; if it keeps happening, go back to the lessons.</p>
        <div className="mt-5 flex gap-2.5">
          <button type="button" onClick={reset} className="rounded-[9px] bg-ink px-4 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] text-surface">
            Try again
          </button>
          <Link href="/home" className="rounded-[9px] border border-line-strong px-4 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] text-ink">
            Lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
