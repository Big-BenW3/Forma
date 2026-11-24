/**
 * Content registry. Every discipline and lesson is imported here once and
 * validated against the Zod schema at load, so a malformed record fails loudly
 * (in tests and at build) rather than breaking a lesson page at runtime.
 *
 * Adding a lesson = write the record, add one import and one entry below.
 * Nothing else in the app lists lessons: pages, cards, nav and tests read this.
 */
import { Discipline, Lesson } from "./schema";
import { medicine } from "./disciplines/medicine/discipline";
import { theCell } from "./disciplines/medicine/lessons/the_cell";
import { theSkeleton } from "./disciplines/medicine/lessons/the_skeleton";
import { architecture } from "./disciplines/architecture/discipline";
import { examineAHouse } from "./disciplines/architecture/lessons/examine_a_house";
import { software } from "./disciplines/software/discipline";
import { whatMakesAComputer } from "./disciplines/software/lessons/what_makes_a_computer";
import { memory } from "./disciplines/software/lessons/memory";
import { yourFirstProgram } from "./disciplines/software/lessons/your_first_program";
import { mechatronics } from "./disciplines/mechatronics/discipline";
import { meetTheBoard } from "./disciplines/mechatronics/lessons/meet_the_board";
import { theBreadboard } from "./disciplines/mechatronics/lessons/the_breadboard";
import { blinkAnLed } from "./disciplines/mechatronics/lessons/blink_an_led";
import { pushAButton } from "./disciplines/mechatronics/lessons/push_a_button";
import { theBrain } from "./disciplines/medicine/lessons/the_brain";

const disciplines = [medicine, architecture, software, mechatronics].map((d) => Discipline.parse(d));
const lessons = [theCell, theSkeleton, theBrain, examineAHouse, whatMakesAComputer, memory, yourFirstProgram, meetTheBoard, theBreadboard, blinkAnLed, pushAButton].map((l) => Lesson.parse(l));

export const allDisciplines = [...disciplines].sort((a, b) => a.order - b.order);
export const allLessons = lessons;

export const getDiscipline = (id: string) => disciplines.find((d) => d.id === id);
export const getLesson = (disciplineId: string, lessonId: string) =>
  lessons.find((l) => l.disciplineId === disciplineId && l.id === lessonId);
export const lessonsOf = (d: { id: string; lessonIds: string[] }) =>
  d.lessonIds.map((id) => getLesson(d.id, id)).filter((l): l is NonNullable<typeof l> => !!l);
