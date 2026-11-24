/**
 * Lesson 1: Meet the board (Arduino Uno R3).
 *
 * Part ids equal node names in public/models/mechatronics_uno.glb. Figures follow
 * Arduino's published Uno R3 specification. Some details vary between board
 * makers and revisions (clones often use a different USB chip), and the model is
 * a recognisable schematic rather than a measured scan.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const meetTheBoard: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "meet_the_board",
  disciplineId: "mechatronics",
  order: 1,
  title: "Meet the board",
  blurb: "Find the brain, the power parts and the pins on an Arduino Uno.",
  layout: "canvas",
  scene: { id: "mechatronics_uno" },
  options: {},

  parts: [
    {
      id: "uno_pcb",
      name: "Circuit board",
      group: "board",
      summary: "The flat board that holds every part and the copper paths between them.",
      does:
        "It is made of fibreglass with thin copper traces printed on it. The traces are the wires: they join the chip to the pins, the power parts and the lights. The board is about 68.6 by 53.4 mm, the size of a credit card cut in half.",
      consequenceLabel: "In practice",
      consequence:
        "Because the wiring is inside the board, you never solder a Uno to program it. You plug in a USB cable and send code.",
      facts: [
        { label: "Size", value: "68.6 × 53.4 mm" },
        { label: "Mounting holes", value: "four, for screws" },
      ],
      featured: false,
    },
    {
      id: "uno_usb",
      name: "USB connector",
      group: "power",
      summary: "The square socket where the USB cable plugs in.",
      does:
        "It does two jobs. It supplies 5 volts of power from your computer, and it carries the code you upload and any messages the board prints back. The board can run from USB alone.",
      consequenceLabel: "If it fails",
      consequence:
        "A cable that only charges and carries no data is a very common reason an upload fails. If the board has power but the computer cannot see it, try a different cable.",
      facts: [{ label: "Type", value: "USB-B" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "uno_barrel",
      name: "Power jack",
      group: "power",
      summary: "The round black socket for a wall adapter or battery pack.",
      does:
        "It lets the board run without a computer. The recommended input is 7 to 12 volts. The board then lowers it to the 5 volts the chip needs.",
      consequenceLabel: "If it fails",
      consequence:
        "A supply above about 12 V makes the regulator hot and can damage the board. Below 7 V the 5 V line can sag and the board behaves unpredictably.",
      facts: [
        { label: "Recommended input", value: "7 to 12 V" },
        { label: "Plug", value: "2.1 mm, centre positive" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "uno_regulator",
      name: "Voltage regulator",
      group: "power",
      summary: "A small chip that turns a higher voltage into a steady 5 volts.",
      does:
        "Everything on the board runs at 5 V, but a wall adapter might give 9 V. The regulator burns off the extra voltage as heat. The two silver cans beside it are capacitors that smooth the power.",
      consequenceLabel: "If it fails",
      consequence:
        "The higher the input voltage, the more heat the regulator makes. If it is too hot to touch, lower the supply voltage.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "uno_power_header",
      name: "Power header",
      group: "power",
      summary: "The row of sockets along the bottom edge that give you power and ground.",
      does:
        "From left to right it offers 3.3 V, 5 V, two ground pins (GND) and VIN, the input voltage. Ground is the return path every circuit needs. You will wire the LED's return path to a GND pin.",
      consequenceLabel: "Careful",
      consequence:
        "Never join 5 V directly to GND with a wire. That is a short circuit, and a short can overheat the regulator or the USB port.",
      facts: [
        { label: "Outputs", value: "3.3 V and 5 V" },
        { label: "Ground pins", value: "GND, in more than one place" },
      ],
      featured: true,
      calloutSide: "bottom",
    },
    {
      id: "uno_mcu",
      name: "ATmega328P microcontroller",
      group: "brain",
      summary: "The long black chip: the computer that runs your program.",
      does:
        "It contains a processor, memory and the pin controllers on one chip. Your program lives in its flash memory and starts running whenever the board gets power. Unlike a laptop it runs just that one program, forever, until you upload another.",
      consequenceLabel: "In practice",
      consequence:
        "Because it has only 2 KB of working memory, a sketch must be small and careful. This is why Arduino programs look so different from phone apps.",
      facts: [
        { label: "Flash (program)", value: "32 KB" },
        { label: "SRAM (working memory)", value: "2 KB" },
        { label: "EEPROM (kept without power)", value: "1 KB" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "uno_crystal",
      name: "16 MHz clock",
      group: "brain",
      summary: "The silver part that sets the board's heartbeat, 16 million beats a second.",
      does:
        "The chip does a step of work on each beat. A crystal is a sliver of quartz that vibrates at a very precise rate when powered. This precision is why delay(1000) really lasts a second. Some Uno boards use a ceramic resonator, a cheaper part that does the same job.",
      consequenceLabel: "In practice",
      consequence:
        "Everything timed in a sketch, from a blink to a servo, is counted in these beats. A wrong clock makes every delay too long or too short.",
      facts: [{ label: "Speed", value: "16 MHz = 16 million cycles a second" }],
      featured: false,
      calloutSide: "right",
    },
    {
      id: "uno_usb_chip",
      name: "USB-to-serial chip",
      group: "brain",
      summary: "A second, smaller chip that talks to your computer on behalf of the first.",
      does:
        "The main chip speaks a simple serial language, not USB. This chip translates between the two, so the computer can upload code and read messages. Genuine Uno boards use an ATmega16U2 here; many clones use a different chip such as the CH340.",
      consequenceLabel: "If it fails",
      consequence:
        "When a board does not show up on your computer at all, a missing driver for this chip is the usual cause, particularly on clones.",
      featured: false,
      calloutSide: "left",
    },
    {
      id: "uno_reset",
      name: "Reset button",
      group: "brain",
      summary: "The small red button that restarts your program from the beginning.",
      does:
        "Pressing it pulls the chip's reset line low, which stops the program and starts it again from the top. It does not erase your program. The RESET pin on the power header does the same thing when it is joined to GND.",
      consequenceLabel: "In practice",
      consequence:
        "When a sketch seems stuck, or a wire was moved while it ran, a press of reset gives you a clean start.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "uno_digital_header",
      name: "Digital pin header",
      group: "io",
      summary: "The two rows of sockets along the top edge, numbered 0 to 13.",
      does:
        "Each digital pin can be set as an output, to turn something on or off, or as an input, to read a switch. Six of them (3, 5, 6, 9, 10 and 11) can also fake in-between levels with PWM. Pins 0 and 1 are shared with the USB connection, so leave them alone at first.",
      consequenceLabel: "Careful",
      consequence:
        "A pin can safely supply about 20 mA (40 mA is the absolute limit). An LED without a resistor can ask for more and damage the pin.",
      facts: [
        { label: "Digital pins", value: "14, numbered 0 to 13" },
        { label: "PWM pins", value: "3, 5, 6, 9, 10, 11" },
        { label: "Current per pin", value: "20 mA recommended, 40 mA maximum" },
      ],
      featured: true,
      calloutSide: "top",
    },
    {
      id: "uno_analog_header",
      name: "Analog pin header",
      group: "io",
      summary: "The six sockets A0 to A5 at the bottom right.",
      does:
        "They measure a voltage between 0 and 5 V and turn it into a number from 0 to 1023. That is how a sensor, a dial or a light-dependent resistor talks to the board. They can also work as extra digital pins.",
      consequenceLabel: "In practice",
      consequence:
        "A reading of 512 means about 2.5 V, half of the range. Two of the pins double as the I2C bus used by many sensors (A4 and A5).",
      facts: [
        { label: "Inputs", value: "6 (A0 to A5)" },
        { label: "Resolution", value: "10 bits: 0 to 1023" },
      ],
      featured: true,
      calloutSide: "bottom",
    },
    {
      id: "uno_icsp",
      name: "ICSP header",
      group: "io",
      summary: "A small block of six gold pins near the right edge.",
      does:
        "ICSP stands for in-circuit serial programming. It lets a separate programmer write directly into the main chip, bypassing USB. It is mostly used to install a bootloader on a blank chip.",
      consequenceLabel: "In practice",
      consequence: "You can ignore it for now. Most people never use it, but it can rescue a board whose bootloader was erased.",
      featured: false,
      calloutSide: "right",
    },
    {
      id: "uno_led_l",
      name: "Pin 13 LED",
      group: "io",
      summary: "A tiny yellow light, marked L, wired to digital pin 13.",
      does:
        "It lights whenever pin 13 is HIGH (5 V). That makes it the easiest first output: you can blink a light without wiring anything. The next lessons add a real LED to the same pin.",
      consequenceLabel: "In practice",
      consequence: "A board with a blinking L light at power-up usually has the factory Blink program installed, which shows the chip is alive.",
      featured: true,
      calloutSide: "right",
    },
  ],

  tabs: {
    overview: {
      heading: "A small computer on a board",
      blocks: [
        {
          type: "paragraph",
          text:
            "An Arduino Uno is a microcontroller board. It has one chip that runs one program, and a row of pins it can switch on and off or read. It cannot browse the web or play video; it is built to sense things and make them move or light up.",
        },
        {
          type: "paragraph",
          text:
            "The parts fall into four groups: the board itself, the power parts that make 5 volts, the control parts that run the program, and the pins that connect it to the world. The colours in the Parts list show the groups.",
        },
        {
          type: "bullets",
          items: [
            { text: "Tap a part for its card; tap again for the next one." },
            { text: "Use the Parts list to fly to a small part like the reset button." },
            { text: "Finish with Find it to check that you know where things are." },
          ],
        },
      ],
    },
    pinout: {
      heading: "The pins",
      blocks: [
        {
          type: "table",
          head: ["Pins", "What they do"],
          caption: "Dot colours match the groups in the scene.",
          rows: [
            { group: "io", cells: ["0 to 13", "Digital input or output. 0 and 1 are shared with USB serial."] },
            { group: "io", cells: ["3, 5, 6, 9, 10, 11", "Can also give PWM (a fast on-off that looks like a dimmer level)."] },
            { group: "io", cells: ["A0 to A5", "Analog input, 0 to 1023. Can also be digital pins."] },
            { group: "power", cells: ["5V and 3.3V", "Power out for your circuit."] },
            { group: "power", cells: ["GND", "Ground: the return path. Several GND pins are joined together."] },
            { group: "power", cells: ["VIN", "The voltage coming in from the power jack."] },
            { group: "brain", cells: ["RESET", "Joined to GND, restarts the board."] },
          ],
        },
        {
          type: "paragraph",
          text: "Pin 13 also drives the L light, so it is the one pin you can see working with no wiring at all.",
        },
      ],
    },
    example: {
      heading: "A first look at a sketch",
      blocks: [
        {
          type: "paragraph",
          text:
            "Arduino programs are called sketches. Every sketch has two functions. setup() runs once at power-up and loop() runs again and again for as long as the board has power.",
        },
        {
          type: "code",
          language: "cpp",
          code: "void setup() {\n  pinMode(13, OUTPUT);   // pin 13 will send power out\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // pin 13 to 5 V: the L light turns on\n}",
        },
        { type: "paragraph", text: "That sketch switches the L light on and leaves it on. In lesson 3 you will make it blink." },
      ],
    },
    specifications: {
      heading: "Arduino Uno R3",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "Microcontroller", value: "ATmega328P" },
            { label: "Operating voltage", value: "5 V" },
            { label: "Input voltage (recommended)", value: "7 to 12 V" },
            { label: "Clock speed", value: "16 MHz" },
            { label: "Flash memory", value: "32 KB (0.5 KB used by the bootloader)" },
            { label: "SRAM / EEPROM", value: "2 KB / 1 KB" },
            { label: "Digital I/O pins", value: "14 (6 with PWM)" },
            { label: "Analog inputs", value: "6" },
            { label: "DC current per I/O pin", value: "20 mA recommended" },
          ],
        },
        {
          type: "paragraph",
          text: "The 3D model is a stylised drawing of an Uno R3. Details such as the exact USB chip differ between makers and revisions.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Find four parts from what they do.",
    params: {
      rounds: [
        { prompt: "Find the chip that runs your program.", answer: "uno_mcu" },
        { prompt: "Find the button that restarts the program.", answer: "uno_reset" },
        { prompt: "Find the header that holds pins 0 to 13.", answer: "uno_digital_header" },
        { prompt: "Find the light that is wired to pin 13.", answer: "uno_led_l" },
      ],
    },
  },
};
