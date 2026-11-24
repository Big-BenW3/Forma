/**
 * Lesson 1: What makes up a computer.
 *
 * A computer is a stack. Peel it with the Peel slider: applications, then the
 * operating system, then firmware, then the hardware everything runs on.
 *
 * Part ids equal node names in public/models/software_computer.glb. Figures are
 * typical for a current desktop or laptop and are given as ranges; the model is
 * a schematic, not any one machine.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const whatMakesAComputer: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "what_makes_a_computer",
  disciplineId: "software",
  order: 1,
  title: "What makes up a computer",
  blurb: "Peel a computer layer by layer, from the apps down to the chips.",
  layout: "canvas",
  scene: { id: "software_computer" },
  options: { floating: true },

  parts: [
    // ---- Applications ---------------------------------------------------
    {
      id: "app_browser",
      name: "Web browser",
      group: "apps",
      summary: "A program that fetches web pages and draws them on screen.",
      does:
        "It asks the network for a page, reads the HTML, CSS and JavaScript that come back, and turns them into what you see. Like every application it never touches the hardware directly: it asks the operating system for the network, the screen and memory.",
      consequenceLabel: "In practice",
      consequence:
        "Because the browser runs on top of the operating system, the same page works on a laptop, a phone or a TV. Only the layers below change.",
      facts: [{ label: "Layer", value: "application" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "app_editor",
      name: "Code editor",
      group: "apps",
      summary: "A program for writing and changing text files, such as source code.",
      does:
        "It asks the file system to open a file, shows the text, and writes it back when you save. Source code is just text; the editor does not run it. Another program, a compiler or interpreter, turns that text into instructions the CPU can follow.",
      consequenceLabel: "In practice",
      consequence:
        "If you save and nothing changes when you run the program, the editor did its job and the problem is further up the chain: the program was not rebuilt, or you are running an old copy.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "app_terminal",
      name: "Terminal",
      group: "apps",
      summary: "A window where you type commands and read the replies as text.",
      does:
        "It passes what you type to a program called a shell, which starts other programs for you and shows what they print. It is the same kind of program as the browser, only the interface is text.",
      consequenceLabel: "In practice",
      consequence:
        "Engineers use it because a command can be written down, repeated and automated, which clicking cannot.",
      featured: true,
      calloutSide: "right",
    },

    // ---- Operating system ----------------------------------------------
    {
      id: "os_kernel",
      name: "Kernel",
      group: "os",
      summary: "The core of the operating system, which has full control of the machine.",
      does:
        "It runs in a privileged mode of the CPU that applications cannot enter. It owns memory, decides what runs, and is the only code allowed to talk to hardware. An application asks it for things through a system call, such as 'open this file' or 'send these bytes'.",
      consequenceLabel: "If it fails",
      consequence:
        "A crash in an application is contained: the kernel ends that one program. A crash in the kernel takes everything with it, which is the blue screen on Windows or a kernel panic on macOS and Linux.",
      facts: [{ label: "Examples", value: "Linux, Windows NT, XNU (macOS, iOS)" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "os_drivers",
      name: "Drivers",
      group: "os",
      summary: "Small pieces of code that know how to talk to one particular device.",
      does:
        "The kernel asks for something general, such as 'draw this', and the driver turns it into the exact commands that one graphics card, Wi-Fi chip or keyboard understands. Replace the device and you replace its driver, not the programs.",
      consequenceLabel: "If it fails",
      consequence:
        "A missing or faulty driver is why a new device 'does nothing' until you install something. Because drivers run with kernel privileges, a bad one can crash the whole system.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "os_filesystem",
      name: "File system",
      group: "os",
      summary: "The part of the operating system that turns raw storage into files and folders.",
      does:
        "A drive only stores numbered blocks of bytes. The file system keeps the index that says which blocks belong to which named file, and in which folder. Deleting a file mostly removes its index entry, which is why deleted files can sometimes be recovered.",
      consequenceLabel: "If it fails",
      consequence:
        "If power is lost halfway through writing the index, the drive can be left inconsistent. Modern file systems keep a journal of intended changes so they can finish or undo them on the next start.",
      facts: [{ label: "Examples", value: "NTFS, APFS, ext4" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "os_scheduler",
      name: "Scheduler",
      group: "os",
      summary: "The part of the kernel that decides which program gets the CPU next.",
      does:
        "There are always more programs than CPU cores. The scheduler gives each one a short turn, a few milliseconds at a time, and switches between them so quickly that they all seem to run at once.",
      consequenceLabel: "In practice",
      consequence:
        "When one program loops forever, the scheduler still takes the CPU away from it on time. That is why you can usually still close a frozen app.",
      facts: [{ label: "A turn lasts", value: "a few milliseconds" }],
      featured: true,
      calloutSide: "right",
    },

    // ---- Firmware ---------------------------------------------------------
    {
      id: "fw_firmware",
      name: "Firmware (UEFI)",
      group: "firmware",
      summary: "The first program that runs when you press the power button.",
      does:
        "It is stored on a flash chip on the motherboard, so it is there before any drive is read. It checks that the memory and CPU respond, finds the drive that holds an operating system, and hands control to its boot loader. UEFI is the modern standard; it replaced the older BIOS.",
      consequenceLabel: "If it fails",
      consequence:
        "A corrupt firmware leaves a machine that powers on but shows nothing, because there is no operating system yet to draw anything. Updating firmware is one of the few updates that can render the hardware useless if power is lost partway.",
      facts: [
        { label: "Lives on", value: "a flash chip on the motherboard" },
        { label: "Size", value: "typically 16 to 64 MB" },
      ],
      featured: true,
      calloutSide: "left",
    },

    // ---- Hardware -----------------------------------------------------------
    {
      id: "hw_motherboard",
      name: "Motherboard",
      group: "hardware",
      summary: "The main circuit board that every other component plugs into.",
      does:
        "Copper traces on several layers of the board carry power and data between the CPU, memory, storage and ports. You can see the bundles of traces (buses) running from the CPU socket to the memory slots and the graphics slot. It also holds the SATA ports for drives, the headers for the case's buttons and fans, and a coin battery that keeps the clock running when the computer is unplugged.",
      consequenceLabel: "In practice",
      consequence:
        "The socket type fixes which CPUs fit and the slot type fixes which memory fits. That is why you cannot put any CPU in any board.",
      facts: [{ label: "Common desktop size", value: "ATX, 305 × 244 mm" }],
      featured: false,
    },
    {
      id: "hw_vrm",
      name: "Voltage regulators (VRM)",
      group: "hardware",
      summary: "The power stages around the CPU socket, under finned heatsinks.",
      does:
        "The power supply delivers 12 volts, but a CPU core runs at about 1 volt and can draw over 100 amps. The VRM's chokes, capacitors and transistors convert one into the other, smoothly, in several phases that take turns. The 8-pin connector in the corner brings the CPU its power.",
      consequenceLabel: "If it fails",
      consequence: "A weak VRM overheats under heavy load and the CPU slows itself down to protect itself (throttling).",
      facts: [{ label: "CPU core voltage", value: "about 0.8 to 1.4 V" }],
      featured: false,
    },
    {
      id: "hw_chipset",
      name: "Chipset",
      group: "hardware",
      summary: "A helper chip under its own heatsink that connects the slower parts.",
      does: "The CPU talks to memory and the graphics card directly. Everything else (the SATA drives, extra USB ports, network, audio) goes through the chipset, which shares one fast link to the CPU.",
      consequenceLabel: "In practice",
      consequence: "The chipset decides how many drives and USB ports a board can have, and whether the CPU can be overclocked.",
      featured: false,
    },
    {
      id: "hw_power",
      name: "Power connector",
      group: "hardware",
      summary: "The 24-pin socket where the power supply plugs in.",
      does: "It brings 3.3, 5 and 12 volts from the power supply to the board, plus a signal that tells the supply to switch on when you press the power button.",
      consequenceLabel: "If it fails",
      consequence: "A loose 24-pin plug is a classic reason a newly built computer shows no sign of life.",
      facts: [{ label: "Pins", value: "24 (20 + 4)" }],
      featured: false,
    },
    {
      id: "hw_cpu",
      name: "CPU",
      group: "hardware",
      summary: "The chip that carries out the instructions of a program, one small step at a time.",
      does:
        "Each step is tiny: add two numbers, copy a value, jump somewhere else. A modern CPU does billions of them every second, on several cores at once, and every program you have ever used is made of these steps. You will write some yourself in lesson 3.",
      consequenceLabel: "If it fails",
      consequence:
        "A CPU that overheats slows itself down on purpose, called throttling, to protect itself. A laptop that gets hot and slow is doing exactly that.",
      facts: [
        { label: "Clock speed", value: "about 3 to 5 GHz (billions of cycles per second)" },
        { label: "Cores", value: "typically 4 to 16 in a consumer chip" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "hw_ram",
      name: "RAM",
      group: "hardware",
      summary: "Fast, temporary memory that holds the programs and data in use right now.",
      does:
        "The CPU cannot run code straight from a drive; it is far too slow. So the operating system copies what is needed into RAM, which the CPU can reach in tens of nanoseconds. It is volatile: switch the power off and its contents are gone. Lesson 2 looks inside it.",
      consequenceLabel: "If it runs out",
      consequence:
        "When RAM is full the operating system moves some of it to the drive, called swapping. Everything keeps working but much more slowly, because a drive is far slower than RAM.",
      facts: [
        { label: "Typical size", value: "8 to 32 GB" },
        { label: "Keeps data without power?", value: "no" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "hw_storage",
      name: "Storage (SSD)",
      group: "hardware",
      summary: "Where files are kept for good, even with the power off.",
      does:
        "An SSD stores data in flash memory cells that hold their state without power. It is much slower than RAM but far larger and cheaper per gigabyte. Programs and your files live here until they are copied into RAM to be used.",
      consequenceLabel: "If it fails",
      consequence:
        "Flash cells wear out after many rewrites and a drive can die suddenly. This is why backups matter more than any other single habit.",
      facts: [
        { label: "Typical size", value: "256 GB to 2 TB" },
        { label: "Keeps data without power?", value: "yes" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "hw_gpu",
      name: "GPU",
      group: "hardware",
      summary: "A chip built to do very many simple calculations at the same time.",
      does:
        "Drawing an image means working out the colour of millions of pixels, and each is a small independent sum. A GPU has thousands of small cores for exactly this, so it is far faster than a CPU at graphics. The same design is now used for machine learning.",
      consequenceLabel: "In practice",
      consequence:
        "Many laptops put the GPU on the same chip as the CPU to save power. A separate graphics card is for heavy 3D work or machine learning.",
      facts: [{ label: "Cores", value: "hundreds to many thousands" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "hw_network",
      name: "Network adapter",
      group: "hardware",
      summary: "The chip that sends and receives data over Wi-Fi or a cable.",
      does:
        "It turns bytes from the operating system into radio waves or electrical signals and back. Each adapter has its own hardware address (a MAC address), so replies find their way back to the right machine on a local network.",
      consequenceLabel: "If it fails",
      consequence:
        "If the adapter or its driver fails, the computer works normally but cannot reach anything else. That makes it a quick test: a dead network adapter does not stop the offline parts of the machine.",
      facts: [{ label: "Common speeds", value: "Gigabit Ethernet; Wi-Fi hundreds of Mbit/s" }],
      featured: true,
      calloutSide: "right",
    },
  ],

  tabs: {
    overview: {
      heading: "A computer is a stack",
      blocks: [
        {
          type: "paragraph",
          text:
            "A computer is not one thing but four layers, each built on the one below. You use the top layer, applications. They ask the operating system for help. The operating system talks to the hardware through drivers. And a small program called firmware starts the whole thing at power-on.",
        },
        {
          type: "paragraph",
          text:
            "Each layer only needs to know about the layer directly under it. A browser does not care what kind of SSD you have, because the file system and driver hide it. That hiding is what lets people build software without knowing every detail of the machine.",
        },
        {
          type: "bullets",
          items: [
            { text: "Drag the Peel slider to remove the top layer, then the next." },
            { text: "Tap any part to read what it does and what goes wrong without it." },
            { text: "The Parts list can fly you to a deep part and peel the layers above it for you." },
          ],
        },
      ],
    },
    layers: {
      heading: "The four layers",
      blocks: [
        {
          type: "table",
          head: ["Layer", "Job", "Examples"],
          caption: "Dot colours match the layers in the scene.",
          rows: [
            { group: "apps", cells: ["Applications", "The programs you use", "Browser, editor, terminal"] },
            { group: "os", cells: ["Operating system", "Shares the machine between programs and hides the hardware", "Kernel, drivers, file system, scheduler"] },
            { group: "firmware", cells: ["Firmware", "Wakes the hardware and starts the operating system", "UEFI"] },
            { group: "hardware", cells: ["Hardware", "The physical parts that do the work", "CPU, RAM, SSD, GPU, network"] },
          ],
        },
        {
          type: "paragraph",
          text:
            "Real systems have more layers than four. A browser, for example, also runs web pages as programs inside it. Four is enough to learn where things live.",
        },
      ],
    },
    instructions: {
      heading: "What happens at power-on",
      blocks: [
        {
          type: "steps",
          items: [
            "You press the power button. Power reaches the motherboard and the CPU starts at a fixed address.",
            "That address holds the firmware. It tests that the CPU and RAM respond.",
            "The firmware looks for a drive that holds an operating system and finds its boot loader.",
            "The boot loader copies the kernel from the SSD into RAM and starts it.",
            "The kernel starts the drivers, mounts the file system and starts the first programs.",
            "A login screen or desktop appears: an application, running on the layers beneath it.",
          ],
        },
        {
          type: "paragraph",
          text:
            "Notice the order: the layers start from the bottom up. Nothing above can run until the layer under it has started.",
        },
      ],
    },
    reference: {
      heading: "Typical figures",
      blocks: [
        {
          type: "table",
          head: ["Part", "Typical today", "Keeps data off?"],
          rows: [
            { group: "hardware", cells: ["CPU", "4 to 16 cores, 3 to 5 GHz", "n/a"] },
            { group: "hardware", cells: ["RAM", "8 to 32 GB", "No"] },
            { group: "hardware", cells: ["SSD", "256 GB to 2 TB", "Yes"] },
            { group: "firmware", cells: ["Firmware chip", "16 to 64 MB", "Yes"] },
          ],
        },
        {
          type: "paragraph",
          text:
            "These are broad ranges for current desktops and laptops, not specifications of one machine. The 3D model is a schematic that shows how the parts relate, not how any real board is laid out.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Find four parts from what they do. Some are under other layers, so peel to reach them.",
    params: {
      rounds: [
        { prompt: "Find the program you use to type commands.", answer: "app_terminal" },
        { prompt: "Find the part that decides which program gets the CPU next.", answer: "os_scheduler" },
        { prompt: "Find the memory that forgets everything when the power goes off.", answer: "hw_ram" },
        { prompt: "Find the first program that runs when you press the power button.", answer: "fw_firmware" },
      ],
    },
  },
};
