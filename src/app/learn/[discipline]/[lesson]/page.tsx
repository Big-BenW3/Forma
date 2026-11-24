/**
 * Lesson workspace route. A server component: it resolves the lesson from the
 * content registry, loads and validates the scene manifests, and hands plain
 * data to the client Workspace. Unknown ids 404.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allLessons, getDiscipline, getLesson, lessonsOf } from "@/content/registry";
import { loadManifests } from "@/content/load";
import { Workspace } from "@/components/workspace/Workspace";

type Params = { discipline: string; lesson: string };

export function generateStaticParams(): Params[] {
  return allLessons.map((l) => ({ discipline: l.disciplineId, lesson: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { discipline, lesson } = await params;
  const l = getLesson(discipline, lesson);
  return l ? { title: `${l.title} · FORMA`, description: l.blurb } : {};
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { discipline: dId, lesson: lId } = await params;
  const discipline = getDiscipline(dId);
  const lesson = getLesson(dId, lId);
  if (!discipline || !lesson) notFound();

  const manifests = await loadManifests(lesson);
  const cards = lessonsOf(discipline).map((l) => ({
    id: l.id,
    title: l.title,
    order: l.order,
    href: `/learn/${discipline.id}/${l.id}`,
    thumb: `/thumbs/${discipline.id}_${l.id}.webp`,
  }));

  return <Workspace discipline={discipline} lesson={lesson} manifests={manifests} cards={cards} />;
}
