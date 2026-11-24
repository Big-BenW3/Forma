import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { WelcomeGreeting } from "@/components/site/WelcomeGreeting";
import { allDisciplines, lessonsOf } from "@/content/registry";

export const metadata: Metadata = { title: "Welcome" };

/** Shown once after sign-up: pick a first lesson. Reads the registry, so a new discipline appears here with no edit. */
export default function WelcomePage() {
  return (
    <div className="paper min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[760px] px-5 pt-10 sm:px-8">
        <WelcomeGreeting />
        <p className="mt-2 max-w-[560px] text-[14.5px] leading-relaxed text-ink-2">
          Your account is ready. Each lesson is a 3D model you can take apart, with a short practice at the end. Pick any discipline to begin; you can
          switch whenever you like.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {allDisciplines.map((d) => {
            const first = lessonsOf(d)[0];
            if (!first) return null;
            return (
              <li key={d.id}>
                <Link
                  href={`/learn/${d.id}/${first.id}`}
                  className="flex h-full gap-3.5 rounded-[12px] border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
                >
                  <Image src={`/thumbs/${d.id}_${first.id}.webp`} alt="" width={72} height={72} unoptimized className="h-[72px] w-[72px] shrink-0 rounded-[8px] bg-ground-deep object-cover" />
                  <span>
                    <span className="block text-[15px] font-extrabold tracking-tight">{d.name}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{d.tagline}</span>
                    <span className="mt-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-teal-strong">Start: {first.title}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-[13px] leading-relaxed text-ink-3">
          Lessons you finished before signing up stay marked in this browser, but only new completions are saved to your account.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
