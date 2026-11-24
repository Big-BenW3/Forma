/**
 * Lesson 4: Push a button.
 *
 * The student reads an input and drives an output from it. The scene has a push
 * button on pin 2 wired to ground, so the sketch uses INPUT_PULLUP: the pin reads
 * HIGH at rest and LOW while pressed.
 *
 * The validator (`button_led`) is not run against clicks. It replays a fixed
 * script of presses (practice.params.script) against the compiled sketch, in
 * the emulator, and checks the LED idle / pressed / released. The toolbar's Hold
 * / Toggle control only changes how the student presses the button on screen.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

const STARTER = `// A button joins pin 2 to ground when pressed.
// Make the LED on pin 13 light while the button is held down.

const int BUTTON = 2;
const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);  // idle reads HIGH, pressed reads LOW
}

void loop() {
  // Read the button, then set the LED to match.
}
`;

const SOLUTION = `const int BUTTON = 2;
const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {   // pressed pulls the pin to ground
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}
`;

export const pushAButton: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "push_a_button",
  disciplineId: "mechatronics",
  order: 4,
  title: "Push a button",
  blurb: "Read a button and make the LED answer it.",
  layout: "canvas",
  scene: { id: "mechatronics_button" },
  options: {
    tallPractice: true,
    floating: true, // the breadboard hovers above the Uno, so no ground shadow
    ledPin: 13,
    buttonPin: 2,
    buttonPart: "btn_switch",
    starterCode: STARTER,
    hint:
      "With INPUT_PULLUP the pin reads HIGH until the button joins it to ground, so a press reads LOW. Use digitalRead(BUTTON) == LOW to detect a press, and write the LED to match.",
    solution: SOLUTION,
  },

  parts: [
    {
      id: "btn_uno",
      name: "Arduino Uno",
      group: "controller",
      summary: "Reads the button and drives the LED.",
      does:
        "Your loop() runs thousands of times a second. Each time it asks digitalRead what pin 2 is doing and, depending on the answer, sets pin 13. The checking is called polling, and it is so fast that the LED seems to answer instantly.",
      consequenceLabel: "In practice",
      consequence: "Because the loop is so fast, a long delay() in it makes the board miss presses. Avoid long delays when waiting for input.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "btn_led_onboard",
      name: "Onboard L light",
      group: "controller",
      summary: "The board's own light, wired to pin 13.",
      does: "It follows pin 13 like the LED on the breadboard does, with no wiring, so you always have a second view of what the output pin is doing.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "btn_breadboard",
      name: "Breadboard",
      group: "circuit",
      summary: "Holds the LED circuit and the button.",
      does: "The button sits across its own column pairs, and ground reaches both the LED and the button through the rails.",
      featured: true,
      calloutSide: "top",
    },
    {
      id: "btn_resistor",
      name: "220 Ω resistor",
      group: "circuit",
      summary: "Limits the current in the LED, as in lesson 3.",
      does: "The LED half of this circuit is the one you built before: pin 13, resistor, LED, ground.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "btn_led",
      name: "LED",
      group: "circuit",
      summary: "Lights when pin 13 is HIGH.",
      does: "In this lesson the button decides when the pin goes HIGH, so the LED shows what your code decided.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "btn_switch",
      name: "Push button",
      group: "circuit",
      summary: "A switch that makes a connection only while it is pressed.",
      does:
        "Inside, a metal dome joins two contacts when you press down, and springs apart when you let go. One side goes to pin 2 and the other to ground. Pressed, it joins pin 2 to ground, which reads LOW.",
      consequenceLabel: "In practice",
      consequence:
        "A real button bounces: the contact flickers for a few milliseconds when pressed. For counting presses, code has to ignore that, called debouncing. This lesson only needs the level.",
      facts: [
        { label: "Legs", value: "four, joined in pairs inside" },
        { label: "Pin used", value: "digital pin 2" },
      ],
      control: {
        key: "mode",
        label: "Press mode",
        options: [
          {
            value: "hold",
            label: "Hold",
            effect: "The button is pressed only while you hold it down, like a real one.",
          },
          {
            value: "toggle",
            label: "Toggle",
            effect: "Each tap latches the button down or lets it up, handy on a phone where you cannot hold and watch at once.",
          },
        ],
        default: "hold",
      },
      featured: true,
      calloutSide: "right",
    },
    {
      id: "btn_wire_signal",
      name: "LED signal wire (pin 13)",
      group: "wiring",
      summary: "Carries pin 13's signal to the LED circuit.",
      does: "The output side: pin 13 switches between 5 V and 0 V and this wire takes the signal to the resistor.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "btn_wire_input",
      name: "Button input wire (pin 2)",
      group: "wiring",
      summary: "Brings the button's state to pin 2.",
      does:
        "It joins one side of the button to digital pin 2. The pin is an input, so it senses a voltage and does not supply one. With INPUT_PULLUP, a weak resistor inside the chip (about 20 to 50 kΩ) holds the pin at 5 V until the button connects it to ground.",
      consequenceLabel: "If it fails",
      consequence: "Without a pull-up an input is left floating and reads random values. This is why INPUT_PULLUP, or an external resistor, matters.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "btn_wires_ground",
      name: "Ground wires",
      group: "wiring",
      summary: "Return paths for the LED and the button.",
      does: "Both the LED and the button end at ground. The button's other side is ground, which is what makes pin 2 go LOW on a press.",
      featured: true,
      calloutSide: "bottom",
    },
  ],

  tabs: {
    overview: {
      heading: "Input and output",
      blocks: [
        {
          type: "paragraph",
          text:
            "So far the board only sent signals out. Now it listens too. A button is the simplest input: it is either connected or not, and the sketch checks which.",
        },
        {
          type: "bullets",
          items: [
            { text: "Hold or tap the button in the scene; use the toolbar to switch between Hold and Toggle." },
            { text: "Write the sketch so the LED lights while the button is pressed." },
            { text: "When you press Compile & run, the check replays two presses automatically." },
          ],
        },
      ],
    },
    pinout: {
      heading: "The wiring",
      blocks: [
        {
          type: "table",
          head: ["Pin", "Role", "Rests at"],
          rows: [
            { group: "wiring", cells: ["13", "Output to the LED", "LOW (off)"] },
            { group: "wiring", cells: ["2", "Input from the button", "HIGH (pull-up)"] },
            { group: "wiring", cells: ["GND", "Button and LED return", "0 V"] },
          ],
        },
        {
          type: "paragraph",
          text: "The button reads LOW when it is pressed. That feels backwards at first: pressed means LOW, not pressed means HIGH.",
        },
      ],
    },
    example: {
      heading: "Reading a pin",
      blocks: [
        {
          type: "code",
          language: "cpp",
          code: SOLUTION,
        },
        {
          type: "steps",
          items: [
            "pinMode(BUTTON, INPUT_PULLUP) makes pin 2 an input and turns on its internal pull-up, so it rests at HIGH.",
            "digitalRead(BUTTON) returns HIGH or LOW.",
            "When the button joins the pin to ground, digitalRead returns LOW.",
            "The if statement turns that into the LED's state, over and over, thousands of times a second.",
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
            { label: "Internal pull-up", value: "about 20 to 50 kΩ" },
            { label: "Idle reading", value: "HIGH" },
            { label: "Pressed reading", value: "LOW" },
            { label: "Typical bounce", value: "a few milliseconds" },
          ],
        },
        {
          type: "paragraph",
          text: "Pull-ups can also be external resistors (often 10 kΩ). The internal one saves a part.",
        },
      ],
    },
  },

  practice: {
    validator: "button_led",
    title: "Write it",
    prompt: "Light the LED on pin 13 while the button on pin 2 is pressed, and turn it off when released.",
    params: {
      led: 13,
      durationMs: 1800,
      script: [
        { t: 300, pin: 2, value: 0 },
        { t: 800, pin: 2, value: 1 },
        { t: 1100, pin: 2, value: 0 },
        { t: 1500, pin: 2, value: 1 },
      ],
    },
  },
};
