/**
 * Discipline index: what the discipline covers and its lessons in order.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { allDisciplines, getDiscipline, lessonsOf } from "@/content/registry";

type Params = { discipline: string };

export function generateStaticParams(): Params[] {
  return allDisciplines.map((d) => ({ discipline: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const d = getDiscipline((await params).discipline);
  return d ? { title: d.name, description: d.description } : {};
}

export default async function DisciplinePage({ params }: { params: Promise<Params> }) {
  const d = getDiscipline((await params).discipline);
  if (!d) notFound();
  const lessons = lessonsOf(d);
  return (
    <div className="paper min-h-screen">
      <SiteHeader current="/home" />
      <main className="mx-auto w-full max-w-[1120px] px-5 pt-6 sm:px-8">
        <Link href="/home" className="micro hover:text-ink">← All disciplines</Link>
        <h1 className="mt-3 text-[44px] font-bold leading-none text-ink sm:text-[56px]">{d.name}</h1>
        <p className="mt-3 text-[18px] font-semibold text-teal-strong">{d.tagline}</p>
        <p className="mt-2 max-w-[620px] text-[16px] leading-relaxed text-ink-2">{d.description}</p>
        <ol className="relative mt-10 flex flex-col gap-4">
          <span className="absolute bottom-6 left-[19px] top-6 w-[2px] bg-line" aria-hidden />
          {lessons.map((l) => (
            <li key={l.id} className="relative flex items-stretch gap-4">
              <span className="relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface text-[15px] font-semibold text-ink">{l.order}</span>
              <Link href={`/learn/${d.id}/${l.id}`} className="group flex min-w-0 flex-1 items-center gap-4 overflow-hidden rounded-[10px] border border-line bg-surface transition-colors hover:border-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/thumbs/${d.id}_${l.id}.webp`} alt="" width={148} height={148} loading="lazy" className="h-[104px] w-[104px] shrink-0 bg-ground-deep object-cover sm:h-[132px] sm:w-[148px]" />
                <div className="min-w-0 flex-1 py-3 pr-4">
                  <span className="micro">Lesson {l.order}</span>
                  <h2 className="mt-1 text-[22px] font-bold leading-tight text-ink">{l.title}</h2>
                  <p className="mt-1 text-[14.5px] leading-snug text-ink-2">{l.blurb}</p>
                  <span className="mt-2 inline-block text-[13px] font-semibold text-teal-strong group-hover:underline">Open lesson →</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
