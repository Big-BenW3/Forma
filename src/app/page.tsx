import Link from "next/link";
import { Hero } from "@/components/site/Hero";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { allDisciplines, getLesson, lessonsOf } from "@/content/registry";

export default function Landing() {
  const heroLesson = getLesson("medicine", "the_brain")!;
  return (
    <div className="paper min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <section className="grid items-center gap-8 pb-4 pt-6 md:grid-cols-[1fr_1.15fr] md:pt-12">
          <div>
            <span className="micro">Free · works on your phone</span>
            <h1 className="mt-3 text-[40px] font-extrabold leading-[1.04] tracking-tight sm:text-[52px]">
              Learn by taking things apart.
            </h1>
            <p className="mt-4 max-w-[460px] text-[16.5px] leading-relaxed text-ink-2">
              Interactive 3D lessons in medicine, mechatronics, architecture and software. Tap any part and it explains what it is,
              what it does and what happens when it fails.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/learn/medicine/the_cell" className="rounded-[9px] bg-ink px-5 py-3 text-[14px] font-bold uppercase tracking-[0.08em] text-surface hover:bg-ink/85">
                Start with the cell
              </Link>
              <Link href="/home" className="rounded-[10px] border border-line-strong px-5 py-3 text-[14px] font-bold text-ink hover:bg-ground-deep">
                See all lessons
              </Link>
            </div>
          </div>
          <Hero lesson={heroLesson} />
        </section>

        <section className="mt-14">
          <span className="micro">Disciplines</span>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {allDisciplines.map((d) => (
              <Link key={d.id} href={`/learn/${d.id}`} className="rounded-[14px] border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                <h2 className="text-[19px] font-extrabold tracking-tight">{d.name}</h2>
                <p className="mt-1 text-[14px] text-ink-2">{d.description}</p>
                <p className="micro mt-3">{lessonsOf(d).length} lessons</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            ["Click anything", "Every part of every model is a real, named object. Open its card, isolate it, or zoom to it."],
            ["Check yourself", "Each lesson ends with a short practice that is checked by the same rules in your browser and on our server."],
            ["Honest models", "Models are stylised for teaching and say so. Sizes and clinical notes are typical values with sources named on the About page."],
          ].map(([h, t]) => (
            <div key={h}>
              <h3 className="text-[15px] font-extrabold">{h}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{t}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
