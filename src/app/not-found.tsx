import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <div className="paper min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[520px] px-5 pt-16 sm:px-8">
        <p className="micro">404</p>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-tight">That page is not here</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">The link may be old, or the lesson may have moved. The lessons are all one tap away.</p>
        <Link href="/home" className="mt-5 inline-block rounded-[9px] bg-ink px-4 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] text-surface">
          Browse lessons
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
