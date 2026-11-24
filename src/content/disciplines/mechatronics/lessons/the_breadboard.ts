/**
 * Lesson 2: The breadboard.
 *
 * Part ids equal node names in public/models/mechatronics_breadboard.glb. The
 * model is a half-size solderless breadboard (30 columns). Peeling the plastic
 * layer shows the metal clips that actually join the holes, which is the whole
 * idea of the lesson.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const theBreadboard: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "the_breadboard",
  disciplineId: "mechatronics",
  order: 2,
  title: "The breadboard",
  blurb: "See which holes are joined inside, so you can build circuits without solder.",
  layout: "canvas",
  scene: { id: "mechatronics_breadboard" },
  options: {},

  parts: [
    {
      id: "bb_body",
      name: "Plastic body",
      group: "plastic",
      summary: "The white plastic block with a grid of tiny holes.",
      does:
        "The plastic holds everything in place and keeps the metal inside apart. The holes are 2.54 mm (0.1 inch) apart, which is the spacing of the legs on most electronic parts, so components push straight in.",
      consequenceLabel: "In practice",
      consequence:
        "Push parts in gently and straight. Thick or bent wires stretch the clips inside, and a loose clip gives circuits that work only when you wiggle them.",
      facts: [{ label: "Hole spacing", value: "2.54 mm (0.1 in)" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bb_strips_top",
      name: "Terminal strips, rows a to e",
      group: "plastic",
      summary: "The upper block of holes, in five rows named a to e.",
      does:
        "Each column of five holes (a, b, c, d and e) is joined inside by one metal clip. Anything plugged into the same column is connected. Columns are not joined to their neighbours.",
      consequenceLabel: "In practice",
      consequence:
        "Two legs in the same column are wired together. Put a resistor leg and an LED leg in column 13 and they are connected without any other wire.",
      facts: [{ label: "Joined together", value: "a to e in the same column" }],
      featured: true,
      calloutSide: "top",
    },
    {
      id: "bb_strips_bottom",
      name: "Terminal strips, rows f to j",
      group: "plastic",
      summary: "The lower block of holes, in five rows named f to j.",
      does:
        "It works exactly like the upper block: f to j in one column are joined. The two blocks are separate. Column 10 in the upper block is not connected to column 10 in the lower block.",
      consequenceLabel: "If it fails",
      consequence:
        "A very common mistake is to put two parts across the centre gap and expect them to connect. They only connect if they share a column on the same side.",
      facts: [{ label: "Joined together", value: "f to j in the same column" }],
      featured: false,
      calloutSide: "bottom",
    },
    {
      id: "bb_rails",
      name: "Power rails",
      group: "plastic",
      summary: "The two long lines of holes along each edge, marked + and −.",
      does:
        "Along a rail every hole is joined, unlike the columns. You connect 5 V to the + rail and GND to the − rail once, then take power from anywhere along it. Red usually marks +, blue or black marks −.",
      consequenceLabel: "Careful",
      consequence:
        "On some full-size boards the rail is split in the middle, so the far half has no power until you bridge the gap. This half-size board has an unbroken rail.",
      facts: [{ label: "Rail holes", value: "25 per rail, all joined" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bb_channel",
      name: "Centre channel",
      group: "plastic",
      summary: "The groove that runs along the middle, between rows e and f.",
      does:
        "It keeps the upper and lower blocks electrically apart. It is 7.62 mm (0.3 inch) wide so that a chip with two rows of legs can straddle it, with each leg on its own set of columns.",
      consequenceLabel: "In practice",
      consequence:
        "This is why chips go across the gap: every leg then has its own column of four free holes to connect to.",
      facts: [{ label: "Width", value: "7.62 mm (0.3 in)" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bb_clips",
      name: "Metal clips",
      group: "metal",
      summary: "Thin springy metal strips hidden under the plastic.",
      does:
        "Each clip grips a part's leg when you push it in and carries current to every other hole in its strip. This is what makes the breadboard work. Peel the plastic layer away to see them: short vertical clips for the columns and long horizontal clips for the rails.",
      consequenceLabel: "If it fails",
      consequence:
        "Clips wear out. A hole that has held a thick wire may no longer grip a thin leg, which shows up as a circuit that cuts out.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bb_wire_power",
      name: "Power wire",
      group: "parts",
      summary: "A red jumper wire taking power to a rail.",
      does:
        "Jumper wires carry current between two holes. Here a wire runs from the Arduino's 5 V pin to the + rail so the whole rail has power. Using a red wire for power and a dark one for ground makes a circuit much easier to read.",
      consequenceLabel: "In practice",
      consequence: "Colour is a convention only; the electricity does not care. But a tidy colour code saves hours of debugging.",
      featured: true,
      calloutSide: "top",
    },
    {
      id: "bb_resistor",
      name: "Resistor",
      group: "parts",
      summary: "A small tube with coloured bands that limits how much current flows.",
      does:
        "It resists current. In series with an LED it keeps the current to a safe level. The coloured bands give the value: red, red, brown means 220 ohms. Resistors have no direction; either way round works.",
      consequenceLabel: "If it fails",
      consequence: "Without a resistor an LED draws as much current as it can and burns out, sometimes taking the Arduino pin with it.",
      facts: [{ label: "Common LED resistor", value: "220 Ω to 330 Ω at 5 V" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bb_led",
      name: "LED",
      group: "parts",
      summary: "A light-emitting diode: a small lamp that lets current through one way only.",
      does:
        "An LED lights when current flows through it from the long leg (the anode, +) to the short leg (the cathode, −). The flat edge on the plastic marks the short leg. Wrong way round and it stays dark, and a strong enough reverse voltage can damage it.",
      consequenceLabel: "In practice",
      consequence: "If an LED does not light, flip it round before you check anything else.",
      facts: [
        { label: "Long leg", value: "anode (+), towards the resistor and pin" },
        { label: "Short leg", value: "cathode (−), towards ground" },
        { label: "Typical current", value: "about 10 to 20 mA" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bb_wire_ground",
      name: "Ground wire",
      group: "parts",
      summary: "A dark jumper wire joining the − rail to the circuit.",
      does:
        "Current needs a way back to where it came from. This wire joins the LED's short leg to the − rail, which is joined to the Arduino's GND pin. With no path back, nothing flows.",
      consequenceLabel: "In practice",
      consequence: "A circuit that does nothing is very often missing its ground connection. Check ground first.",
      featured: false,
      calloutSide: "bottom",
    },
  ],

  tabs: {
    overview: {
      heading: "Build without solder",
      blocks: [
        {
          type: "paragraph",
          text:
            "A breadboard lets you try a circuit by pushing parts into holes and moving them if you are wrong. No solder and no tools. The trick is to know which holes are secretly connected.",
        },
        {
          type: "bullets",
          items: [
            { text: "Short columns: five holes in the same column are joined." },
            { text: "Long rails: every hole along a rail is joined." },
            { text: "The centre gap separates the top half from the bottom half." },
          ],
        },
        {
          type: "paragraph",
          text: "Use the Layers control to peel the plastic and see the metal that does the joining. Then check yourself with Find it.",
        },
      ],
    },
    pinout: {
      heading: "Which holes are joined",
      blocks: [
        {
          type: "table",
          head: ["Holes", "Joined?"],
          rows: [
            { group: "plastic", cells: ["a1, b1, c1, d1, e1", "Yes: one column of five"] },
            { group: "plastic", cells: ["f1, g1, h1, i1, j1", "Yes: one column of five"] },
            { group: "plastic", cells: ["e1 and f1", "No: the centre gap is between them"] },
            { group: "plastic", cells: ["a1 and a2", "No: neighbouring columns are separate"] },
            { group: "plastic", cells: ["Any two holes on one + rail", "Yes: the whole rail is joined"] },
            { group: "plastic", cells: ["+ rail and − rail", "No: they are separate rails"] },
          ],
        },
        {
          type: "paragraph",
          text: "When you build, ask of every leg: which column is this in, and what else is in that column?",
        },
      ],
    },
    example: {
      heading: "Reading a small circuit",
      blocks: [
        {
          type: "paragraph",
          text: "The scene shows a resistor and an LED sharing a column, with power and ground wires. Follow the current:",
        },
        {
          type: "steps",
          items: [
            "Power arrives through a wire on the + rail.",
            "The resistor links the signal to a column that the LED's long leg also sits in.",
            "The current passes through the LED, which lights.",
            "The LED's short leg shares a column with the ground wire, which carries the current to the − rail and back to the Arduino.",
          ],
        },
      ],
    },
    specifications: {
      heading: "This breadboard",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "Size", value: "half-size, about 82 × 55 mm" },
            { label: "Columns", value: "30, each with two groups of five" },
            { label: "Rows", value: "a to e above the gap, f to j below" },
            { label: "Power rails", value: "two on each long side, 25 holes each" },
            { label: "Hole pitch", value: "2.54 mm (0.1 in)" },
            { label: "Wire size", value: "about 0.8 mm; 22 AWG solid core is standard" },
          ],
        },
        {
          type: "paragraph",
          text:
            "Full-size boards have 63 columns and 830 holes. Boards differ in the length of their rails, and some split them in the middle; always test with a meter if in doubt.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Find four parts from what they do. The metal is under the plastic, so peel the layer to reach it.",
    params: {
      rounds: [
        { prompt: "Find the part that joins a column of five holes.", answer: "bb_clips" },
        { prompt: "Find the groove that a chip straddles.", answer: "bb_channel" },
        { prompt: "Find the long lines of holes that carry power.", answer: "bb_rails" },
        { prompt: "Find the part that stops too much current reaching the LED.", answer: "bb_resistor" },
      ],
    },
  },
};
