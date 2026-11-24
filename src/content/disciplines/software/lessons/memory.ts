/**
 * Lesson 2: Memory.
 *
 * A memory module, then a single DRAM cell: a capacitor that holds a charge and a
 * transistor that opens it. The point of the lesson is that DRAM is a leaky bucket:
 * it must be refreshed constantly and forgets everything when power is cut. The
 * practice is a small memory lab that makes the student see this.
 *
 * Parts from BOTH scenes live here: the module (software_memory) and its chip's
 * cell (software_dram_cell, the "Zoom into a chip" variant). Figures are typical of
 * a DDR5 desktop module; the model is a schematic.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const memory: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "memory",
  disciplineId: "software",
  order: 2,
  title: "Memory",
  blurb: "Look inside RAM, down to the single cell that stores one bit.",
  layout: "canvas",
  scene: { id: "software_memory" },
  options: {
    floating: true,
    // The memory lab needs room for its cells and controls.
    tallPractice: true,
    variants: {
      dram_cell: {
        scene: "software_dram_cell",
        label: "Zoom into a chip",
        forPart: ["mem_dram_chips"],
      },
    },
  },

  parts: [
    // ---- The module ---------------------------------------------------------
    {
      id: "mem_module",
      name: "Memory module",
      group: "module",
      summary: "A small green circuit board that carries the memory chips and plugs into the motherboard.",
      does:
        "It is the unit you buy and install, often called a DIMM. Putting the chips on a module, instead of on the motherboard, lets you choose how much memory to have and replace it later. Two or more modules together give the CPU a wider, faster path to memory.",
      consequenceLabel: "In practice",
      consequence:
        "Modules come in generations, such as DDR4 and DDR5. They are not interchangeable: the notch is in a different place so a wrong one will not fit the slot.",
      facts: [
        { label: "Common size", value: "8 to 32 GB per module" },
        { label: "Length", value: "about 133 mm" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "mem_dram_chips",
      name: "DRAM chips",
      group: "chips",
      summary: "The black chips that hold the data, each a very large grid of tiny memory cells.",
      does:
        "Each chip holds billions of cells, and each cell stores a single bit: a 0 or a 1. The eight chips on this module work together, each supplying part of every word sent to the CPU. Use Zoom into a chip to see one cell.",
      consequenceLabel: "If it fails",
      consequence:
        "A single faulty cell can corrupt a program in a way that is almost impossible to trace. Memory tests write patterns to every cell and read them back to find such cells. Server memory adds extra chips for error correction (ECC) so a flipped bit can be repaired.",
      facts: [
        { label: "Cells per 16 Gbit chip", value: "about 17 billion" },
        { label: "Stores", value: "one bit per cell" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "mem_pmic",
      name: "Power management chip",
      group: "chips",
      summary: "A chip on the module that makes the exact voltages the memory chips need.",
      does:
        "DDR5 modules convert the power supplied by the motherboard to the several precise voltages the chips need, on the module itself, instead of leaving that to the board. Moving it closer keeps the voltages steadier at high speed.",
      consequenceLabel: "In practice",
      consequence:
        "DDR4 modules had no such chip, which is one reason a DDR5 module is more expensive and why the two are not interchangeable.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "mem_spd",
      name: "SPD chip",
      group: "chips",
      summary: "A small chip that tells the computer what this module is.",
      does:
        "SPD stands for serial presence detect. It stores the module's size, speed and timing settings. At power-on the firmware reads it and configures the memory to match. This is why a computer can use memory it has never seen.",
      consequenceLabel: "In practice",
      consequence:
        "Gaming memory advertised at a higher speed has a second profile stored in this chip, which you switch on in firmware settings. Without it, the module runs at a safe standard speed.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "mem_contacts",
      name: "Gold contacts",
      group: "connector",
      summary: "The row of metal pads along the bottom edge that connect the module to the board.",
      does:
        "Each contact carries one signal, a power line or a ground. A DDR5 module has 288 of them, 144 on each side. They are coated in gold because gold does not corrode, which keeps the connection clean. The off-centre notch makes sure the module can only go in one way.",
      consequenceLabel: "If it fails",
      consequence:
        "Dirty or loose contacts are a common reason a computer will not start or crashes at random. Reseating the module, pushing it out and back in, fixes it more often than you would expect.",
      facts: [
        { label: "Contacts on DDR5", value: "288 (144 per side)" },
        { label: "Coating", value: "gold" },
      ],
      featured: true,
      calloutSide: "bottom",
    },

    // ---- One DRAM cell (variant scene: software_dram_cell) -------------------
    {
      id: "cell_capacitor",
      name: "Capacitor",
      group: "storage",
      summary: "A microscopic tank that holds a small electrical charge. Charged is a 1, empty is a 0.",
      does:
        "The bit is stored as the presence or absence of charge. The tank leaks, so the charge fades in a fraction of a second. That is why DRAM, dynamic RAM, has to be rewritten again and again.",
      consequenceLabel: "If it fails",
      consequence:
        "If a cell is not refreshed in time, its charge leaks away and the 1 becomes a 0. This is also why RAM forgets everything once the power is cut.",
      facts: [
        { label: "Capacity", value: "roughly 10 to 30 femtofarads" },
        { label: "Refreshed", value: "every 32 to 64 milliseconds" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "cell_transistor",
      name: "Access transistor",
      group: "access",
      summary: "A switch that connects the capacitor to the wire that reads or writes it.",
      does:
        "When the word line is on, the transistor conducts and the capacitor is joined to its bit line. When it is off, the capacitor is cut off and keeps its charge. One transistor and one capacitor make one cell.",
      consequenceLabel: "In practice",
      consequence:
        "Because a cell is only one transistor and one capacitor, billions fit on a chip. That is why RAM is far cheaper per bit than the faster memory inside a CPU.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "cell_wordline",
      name: "Word line",
      group: "access",
      summary: "A wire that switches on all the transistors in one row at once.",
      does:
        "To use a cell, the chip turns on the word line for its row. Every cell in that row is connected to its bit line at the same time, so a whole row is read together.",
      consequenceLabel: "In practice",
      consequence:
        "Reading a row empties the capacitors in it, so the chip has to write the values straight back. Refreshing is just reading every row, over and over.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "cell_bitline",
      name: "Bit line",
      group: "sense",
      summary: "A wire running down a column that carries the stored bit to and from the cell.",
      does:
        "When a row's word line is on, each capacitor shares its charge with its bit line. The charge is tiny, so the change on the wire is tiny too, and has to be amplified.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "cell_sense_amp",
      name: "Sense amplifier",
      group: "sense",
      summary: "A circuit at the end of each column that decides whether the bit was a 0 or a 1.",
      does:
        "It detects the very small change on the bit line, decides which way it went, and drives the line to a full 0 or 1. It then writes that value back into the cell, restoring what the read emptied.",
      consequenceLabel: "In practice",
      consequence:
        "There is one for every column, and it also acts as a temporary copy of the row. That is why reading several things from the same row is much faster than jumping between rows.",
      featured: true,
      calloutSide: "right",
    },
  ],

  tabs: {
    overview: {
      heading: "Where a program's data lives",
      blocks: [
        {
          type: "paragraph",
          text:
            "When you run a program, the operating system copies it from the SSD into RAM, and the CPU reads its instructions and data from there. RAM is fast but forgetful. Everything in it is lost when the power goes, which is why an unsaved document disappears if the machine loses power.",
        },
        {
          type: "paragraph",
          text:
            "Inside a DRAM chip, every bit is a tiny capacitor that is either charged or empty. The charge slowly leaks, so the chip rewrites every cell many times a second. Zoom into a chip to see one cell.",
        },
        {
          type: "bullets",
          items: [
            { text: "Tap a part of the module to read about it." },
            { text: "Select the DRAM chips, then choose Zoom into a chip." },
            { text: "Finish with the Memory lab to see RAM forget." },
          ],
        },
      ],
    },
    layers: {
      heading: "Memory in levels",
      blocks: [
        {
          type: "table",
          head: ["Level", "Speed", "Size", "Keeps data off?"],
          caption: "Each level down is bigger, cheaper per byte and slower. Figures are typical orders of magnitude.",
          rows: [
            { cells: ["Registers (in the CPU)", "under 1 ns", "a few hundred bytes", "No"] },
            { cells: ["Cache (in the CPU)", "1 to 10 ns", "KB to tens of MB", "No"] },
            { cells: ["RAM (this lesson)", "about 50 to 100 ns", "GB", "No"] },
            { cells: ["SSD", "tens of microseconds", "hundreds of GB to TB", "Yes"] },
          ],
        },
        {
          type: "paragraph",
          text:
            "Programs are written as if memory is one flat list, and the hardware quietly keeps recently used data in the faster levels. The next lesson writes a program for a CPU with just registers and a small memory.",
        },
      ],
    },
    instructions: {
      heading: "Reading and writing a cell",
      blocks: [
        {
          type: "steps",
          items: [
            "The chip switches on the word line for the row that holds the cell.",
            "Every transistor in that row conducts and each capacitor shares its charge with its bit line.",
            "The sense amplifier on each column detects the tiny change and decides 0 or 1.",
            "To read, the chip sends the bit out. To write, the chip forces the bit line to the new value, which charges or drains the capacitor.",
            "The chip writes the row back, because reading emptied it, and switches the word line off.",
          ],
        },
        {
          type: "paragraph",
          text: "Refresh is the same cycle run on every row, over and over, with no one asking for the data.",
        },
      ],
    },
    reference: {
      heading: "Terms",
      blocks: [
        {
          type: "table",
          head: ["Term", "Meaning"],
          rows: [
            { cells: ["Bit", "One 0 or 1."] },
            { cells: ["Byte", "Eight bits. One of 256 values."] },
            { cells: ["Volatile", "Loses its contents when power is removed."] },
            { cells: ["DRAM", "Dynamic RAM: one transistor and one capacitor per bit, refreshed constantly."] },
            { cells: ["DIMM", "The circuit board module that carries DRAM chips."] },
            { cells: ["ECC", "Extra bits that let memory detect and repair a flipped bit."] },
          ],
        },
        {
          type: "paragraph",
          text:
            "The 3D module is a schematic of a DDR5 module with eight chips. It draws fewer gold contacts than the real 144 per side, real modules differ in chip count and layout, and the cell view shows a small patch of the grid, not a real chip's scale.",
        },
      ],
    },
  },

  practice: {
    validator: "memory_lab",
    title: "Memory lab",
    prompt: "Store a number, read it back, then cut the power and see what RAM remembers.",
    params: {},
  },
};
