"use client";
/**
 * Signed-in/out home: where to continue, and every discipline with progress.
 * Receives plain data from the server page; progress is read on the client.
 */
import { useAccount } from "@/lib/useAccount";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCompleted } from "@/lib/useCompleted";

export interface HomeLesson {
  id: string;
  title: string;
  blurb: string;
  href: string;
  thumb: string;
  key: string;
}
export interface HomeDiscipline {
  id: string;
  name: string;
  tagline: string;
  href: string;
  lessons: HomeLesson[];
}

export function HomeView({ disciplines }: { disciplines: HomeDiscipline[] }) {
  const { ready, keys } = useCompleted();
  const done = new Set(keys);
  const all = disciplines.flatMap((d) => d.lessons);
  const next = all.find((l) => !done.has(l.key)) ?? all[0];
  const total = all.length;
  const finished = all.filter((l) => done.has(l.key)).length;

  const nextDiscipline = next ? disciplines.find((d) => d.lessons.some((l) => l.id === next.id)) : undefined;
  const nextIndex = nextDiscipline && next ? nextDiscipline.lessons.findIndex((l) => l.id === next.id) + 1 : 1;

  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
      <section className="grid items-center gap-6 pb-2 pt-4 md:grid-cols-[1.15fr_1fr] md:pt-10">
        {next && (
          <div className="order-2 md:order-1">
            <span className="micro flex items-center gap-2 !text-teal-strong">
              <span className="h-[7px] w-[7px] rounded-full bg-teal" aria-hidden />
              {ready && finished > 0 ? "Continue" : "Start here"} · {nextDiscipline?.name} · Lesson {nextIndex}
            </span>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.02] text-ink sm:text-[56px]">{next.title}</h1>
            <p className="mt-4 max-w-[460px] text-[17px] leading-relaxed text-ink-2">{next.blurb}</p>
            <div className="mt-5 flex max-w-[420px] items-center gap-3">
              <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={ready ? finished : 0} aria-label="Lessons completed">
                <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${ready ? (finished / Math.max(total, 1)) * 100 : 0}%` }} />
              </div>
              <span className="font-mono text-[12.5px] text-ink-2">
                {ready ? finished : "–"} of {total} completed
              </span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={next.href} className="inline-flex h-[48px] items-center gap-2 rounded-[9px] bg-ink px-6 text-[14px] font-semibold uppercase tracking-[0.1em] text-surface hover:bg-ink/85" style={{ fontFamily: "var(--font-display)" }}>
                {ready && finished > 0 ? "Resume lesson" : "Open lesson"} <Icon name="chevR" size={16} />
              </Link>
              {nextDiscipline && (
                <Link href={nextDiscipline.href} className="inline-flex h-[48px] items-center rounded-[9px] border border-line-strong px-5 text-[14px] font-semibold text-ink hover:bg-ground-deep">
                  All {nextDiscipline.name} lessons
                </Link>
              )}
            </div>
            <div className="mt-3"><ProgressNote /></div>
          </div>
        )}
        {next && (
          <Link href={next.href} aria-label={`Open ${next.title}`} className="order-1 overflow-hidden rounded-[12px] border border-line bg-surface md:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.thumb} alt="" width={480} height={480} className="aspect-square max-h-[480px] w-full object-cover" />
          </Link>
        )}
      </section>

      {disciplines.map((d) => {
        const n = d.lessons.filter((l) => done.has(l.key)).length;
        return (
          <section key={d.id} className="mt-10">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <Link href={d.href} className="text-[24px] font-bold leading-none hover:text-teal-strong">
                  {d.name}
                </Link>
                <p className="text-[13px] text-ink-2">{d.tagline}</p>
              </div>
              <span className="micro shrink-0">
                {ready ? n : "–"} / {d.lessons.length} done
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.lessons.map((l, i) => (
                <Link key={l.id} href={l.href} className="flex items-center gap-3 rounded-[10px] border border-line bg-surface p-2.5 transition-colors hover:border-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.thumb} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-[7px] bg-ground-deep object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="micro block">Lesson {i + 1}</span>
                    <span className="block truncate text-[16px] font-semibold text-ink">{l.title}</span>
                  </span>
                  {ready && done.has(l.key) ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-white" aria-label="Completed">
                      <Icon name="check" size={13} />
                    </span>
                  ) : (
                    <Icon name="chevR" size={15} className="text-ink-3" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Where progress is kept, worded for the student's actual situation. */
export function ProgressNote() {
  const { ready, accounts, user } = useAccount();
  let text = "Saved in this browser.";
  if (ready && accounts && user) text = "Saved to your account, so it follows you to any device.";
  else if (ready && accounts) text = "Saved in this browser. Sign in to keep it across devices.";
  return <p className="text-[12px] leading-snug text-ink-3">{text}</p>;
}
