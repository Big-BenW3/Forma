/**
 * Discipline record: Mechatronics.
 *
 * Electronics and code together: meet the board, learn the breadboard, then write
 * real Arduino sketches that are compiled by the real toolchain and run in an
 * emulator of the chip in the browser.
 */
import { SCHEMA_VERSION, type Discipline } from "@/content/schema";

export const mechatronics: Discipline = {
  schemaVersion: SCHEMA_VERSION,
  id: "mechatronics",
  name: "Mechatronics",
  tagline: "Make hardware do what your code says.",
  description: "Learn the Arduino Uno and the breadboard, then write real sketches that blink an LED and read a button, running on an emulated chip in your browser.",
  order: 2,
  adapter: "mechatronics",
  tabs: [
    { id: "overview", label: "Overview" },
    { id: "pinout", label: "Pinout" },
    { id: "example", label: "Example" },
    { id: "specifications", label: "Specifications" },
  ],
  lessonIds: ["meet_the_board", "the_breadboard", "blink_an_led", "push_a_button"],
};
