/**
 * Lesson 3: Blink an LED.
 *
 * The student writes a real Arduino sketch. The server compiles it with
 * arduino-cli (src/server/compile.ts) and the HEX runs in the AVR8js emulator in a
 * Web Worker (src/lib/emulator). The `blink_led` validator then reads the pin-13
 * trace the emulator produced. On the server the same chain is re-derived from the
 * submitted source, so a client cannot claim a trace it did not earn.
 *
 * The scene shows the LED on the breadboard and the board's own L light. Both
 * follow pin 13 (see MechSceneExtras).
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

const STARTER = `// Pin 13 drives the L light on the board and the LED on the breadboard.
// Right now the light turns on and stays on. Make it blink.

void setup() {
  pinMode(13, OUTPUT);      // pin 13 sends power out
}

void loop() {
  digitalWrite(13, HIGH);   // LED on
  // Add a delay, then turn the LED off, then another delay.
}
`;

const SOLUTION = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);   // on
  delay(500);               // wait half a second
  digitalWrite(13, LOW);    // off
  delay(500);               // wait half a second
}
`;

export const blinkAnLed: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "blink_an_led",
  disciplineId: "mechatronics",
  order: 3,
  title: "Blink an LED",
  blurb: "Write a real Arduino sketch and watch the light blink.",
  layout: "canvas",
  scene: { id: "mechatronics_blink" },
  options: {
    tallPractice: true,
    floating: true, // the breadboard hovers above the Uno, so no ground shadow
    ledPin: 13,
    starterCode: STARTER,
    hint:
      "Each digitalWrite sets the pin for as long as nothing changes it. To blink, turn it on, wait with delay(), turn it off, and wait again. delay(500) waits 500 milliseconds.",
    solution: SOLUTION,
  },

  parts: [
    {
      id: "blink_uno",
      name: "Arduino Uno",
      group: "controller",
      summary: "The board running your sketch.",
      does:
        "Your code is compiled into machine code for the ATmega328P chip and run on it. When the sketch calls digitalWrite(13, HIGH), the chip drives pin 13 to 5 volts; with LOW it drives the pin to 0 volts.",
      consequenceLabel: "In practice",
      consequence:
        "The chip does exactly what the code says and nothing more. If the LED does not blink, the cause is in the code or in the wiring, never in 'the computer' being confused.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "blink_led_onboard",
      name: "Onboard L light",
      group: "controller",
      summary: "The small light on the board, also wired to pin 13.",
      does:
        "It copies the state of pin 13 with no wiring, so it blinks exactly when the LED on the breadboard does. If the board light blinks and your LED does not, the sketch is fine and the wiring is the problem.",
      consequenceLabel: "In practice",
      consequence: "This is the quickest way to tell a code fault from a wiring fault.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "blink_breadboard",
      name: "Breadboard",
      group: "circuit",
      summary: "The solderless board that holds the circuit.",
      does:
        "Its columns of five joined holes link the resistor and the LED, and its − rail carries the return path to ground. You met how it works in lesson 2.",
      featured: true,
      calloutSide: "top",
    },
    {
      id: "blink_resistor",
      name: "220 Ω resistor",
      group: "circuit",
      summary: "Limits the current that flows through the LED.",
      does:
        "With a 5 V pin, a red LED (about 2 V across it) and a 220 Ω resistor, the current is about (5 − 2) ÷ 220 = 14 mA: bright, and safe for the pin, which can supply up to 20 mA comfortably.",
      consequenceLabel: "If it fails",
      consequence: "Leave the resistor out and the LED tries to draw far more than the pin can supply. The LED or the pin can fail.",
      facts: [
        { label: "Value", value: "220 Ω (red, red, brown)" },
        { label: "Current", value: "about 14 mA with a red LED" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "blink_led",
      name: "LED",
      group: "circuit",
      summary: "The light you are blinking.",
      does:
        "Current flows in through the long leg when pin 13 is HIGH, and the LED lights. When the pin is LOW there is no voltage across it and it goes dark. In the scene it glows while pin 13 is HIGH, so you can see the program's effect.",
      consequenceLabel: "If it fails",
      consequence: "If it never lights, flip it round: LEDs only conduct in one direction.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "blink_wire_signal",
      name: "Signal wire (pin 13)",
      group: "wiring",
      summary: "Carries the pin's on and off signal to the circuit.",
      does:
        "It runs from digital pin 13 to the breadboard, where it meets the resistor's column. The pin itself supplies the LED's current, switching between 5 V and 0 V.",
      consequenceLabel: "If it fails",
      consequence: "The sketch must use the same pin number as the wire. A wire in pin 12 and code that writes pin 13 gives a dark LED.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "blink_wires_ground",
      name: "Ground wires",
      group: "wiring",
      summary: "Complete the loop back to the board.",
      does:
        "One wire joins the Arduino's GND pin to the − rail, and another joins the LED's short leg to that rail. Current leaves pin 13, goes through the resistor and LED, and returns through ground.",
      consequenceLabel: "In practice",
      consequence: "A circuit is a loop. Break the loop anywhere and the current stops.",
      featured: true,
      calloutSide: "bottom",
    },
  ],

  tabs: {
    overview: {
      heading: "Your first real sketch",
      blocks: [
        {
          type: "paragraph",
          text:
            "This is not a simulation of what a sketch might do. Your code is compiled by the same tools used for a real Arduino, and the machine code runs on an emulator of the real ATmega328P chip inside your browser. The LED in the scene follows what pin 13 does.",
        },
        {
          type: "bullets",
          items: [
            { text: "Edit the sketch in the editor." },
            { text: "Compile & run builds it and starts the board." },
            { text: "Make the LED turn on and off, at least twice, with a pause between 0.1 and 3 seconds." },
          ],
        },
      ],
    },
    pinout: {
      heading: "The wiring",
      blocks: [
        {
          type: "table",
          head: ["From", "To", "Why"],
          rows: [
            { group: "wiring", cells: ["Pin 13", "Resistor", "The signal that switches the LED"] },
            { group: "circuit", cells: ["Resistor", "LED long leg", "Limits the current"] },
            { group: "circuit", cells: ["LED short leg", "− rail", "The way back"] },
            { group: "wiring", cells: ["− rail", "Arduino GND", "Closes the loop"] },
          ],
        },
      ],
    },
    example: {
      heading: "How the sketch works",
      blocks: [
        {
          type: "code",
          language: "cpp",
          code: SOLUTION,
        },
        {
          type: "steps",
          items: [
            "setup() runs once: pinMode tells the chip that pin 13 sends signals out.",
            "loop() starts and runs forever.",
            "digitalWrite(13, HIGH) sets the pin to 5 V and the LED lights.",
            "delay(500) does nothing for half a second, so the LED stays lit.",
            "digitalWrite(13, LOW) sets the pin to 0 V and the LED goes dark.",
            "A second delay, then loop() starts again from the top.",
          ],
        },
      ],
    },
    specifications: {
      heading: "Numbers to know",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "HIGH", value: "5 V on the pin" },
            { label: "LOW", value: "0 V on the pin" },
            { label: "delay(1000)", value: "waits 1000 milliseconds, one second" },
            { label: "Current per pin", value: "20 mA recommended, 40 mA maximum" },
            { label: "LED current here", value: "about 14 mA" },
          ],
        },
        {
          type: "paragraph",
          text:
            "The emulator reproduces the chip's instructions and timing. The scene is a model of the circuit, so a real board's LED brightness will vary with the LED and the resistor you choose.",
        },
      ],
    },
  },

  practice: {
    validator: "blink_led",
    title: "Write it",
    prompt: "Make the LED on pin 13 blink: on, off, on, off, with a pause between 0.1 and 3 seconds.",
    params: { pin: 13, minMs: 100, maxMs: 3000, minIntervals: 2, durationMs: 5000 },
  },
};
