import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { HomeView, type HomeDiscipline } from "@/components/site/HomeView";
import { allDisciplines, lessonsOf } from "@/content/registry";

export const metadata: Metadata = { title: "Learn" };

export default function HomePage() {
  const disciplines: HomeDiscipline[] = allDisciplines.map((d) => ({
    id: d.id,
    name: d.name,
    tagline: d.tagline,
    href: `/learn/${d.id}`,
    lessons: lessonsOf(d).map((l) => ({
      id: l.id,
      title: l.title,
      blurb: l.blurb,
      href: `/learn/${d.id}/${l.id}`,
      thumb: `/thumbs/${d.id}_${l.id}.webp`,
      key: `${d.id}/${l.id}`,
    })),
  }));
  return (
    <div className="paper min-h-screen">
      <SiteHeader current="/home" />
      <main>
        <HomeView disciplines={disciplines} />
      </main>
      <SiteFooter />
    </div>
  );
}
