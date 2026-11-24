/**
 * Lesson 1: The cell.
 *
 * A generalised animal cell with fourteen parts. Sizes are typical human-cell
 * ranges, not exact values: cells vary by type, and the lesson says so where it
 * matters. Clinical lines name real conditions with a real mechanism; keep it
 * that way when editing.
 *
 * Part ids equal the node names in public/models/medicine_cell.glb.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const theCell: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "the_cell",
  disciplineId: "medicine",
  order: 1,
  title: "The cell",
  blurb: "Fourteen parts, one living unit. Open it up and find each one.",
  layout: "canvas",
  scene: { id: "medicine_cell" },
  options: {
    // Cut-away removes the front half (towards the camera) along z.
    cut: { axis: "z", removes: 1 },
    // A cell floats: no ground shadow.
    floating: true,
  },

  parts: [
    {
      id: "organelle_cell_membrane",
      name: "Cell membrane",
      group: "envelope",
      summary: "A thin double layer of fat molecules that wraps the whole cell.",
      does:
        "It decides what goes in and out. Water, oxygen and carbon dioxide slip through; salts, sugars and proteins need dedicated channels and pumps built into the membrane. It also carries the receptors that let the cell hear signals from its neighbours.",
      consequenceLabel: "If it fails",
      consequence:
        "In cystic fibrosis a chloride channel in the membrane is faulty, so salt and water balance goes wrong and mucus becomes thick and sticky.",
      facts: [
        { label: "Thickness", value: "about 7 to 10 nm" },
        { label: "Made of", value: "phospholipid bilayer, cholesterol, proteins" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "organelle_cytoplasm",
      name: "Cytoplasm",
      group: "envelope",
      summary: "The jelly-like fluid that fills the cell and holds everything else in place.",
      does:
        "Most of the cell's chemistry happens here, such as the first steps of breaking down sugar. The watery part is called cytosol; the organelles float in it, held in position by the cytoskeleton.",
      consequenceLabel: "In practice",
      consequence:
        "Cells swell or shrink when the salt balance outside them changes. That is why drip fluids are chosen to match the body's own salt concentration.",
      facts: [{ label: "Mostly", value: "water, with dissolved salts and proteins" }],
    },
    {
      id: "organelle_nucleus",
      name: "Nucleus",
      group: "genetic",
      summary: "The compartment that stores the cell's DNA.",
      does:
        "It keeps the instructions for building every protein safe and copies them out as messenger RNA when needed. The nuclear envelope is a double membrane with pores, so only the right molecules pass between the nucleus and the rest of the cell.",
      consequenceLabel: "If it fails",
      consequence:
        "DNA damage the cell cannot repair can let it divide without control, which is the basis of cancer. Faults in the nuclear lamina cause the rare ageing disorder progeria.",
      facts: [
        { label: "Typical width", value: "about 5 to 10 µm" },
        { label: "Pores", value: "thousands, each roughly 100 nm across" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "organelle_nucleolus",
      name: "Nucleolus",
      group: "genetic",
      summary: "A dense spot inside the nucleus where ribosome parts are made.",
      does:
        "It builds the two halves of the ribosome from RNA and proteins, then sends them out through the nuclear pores. Cells that make a lot of protein have a large, obvious nucleolus.",
      consequenceLabel: "If it fails",
      consequence:
        "Defects in making ribosomes cause a group of conditions called ribosomopathies, such as Diamond–Blackfan anaemia.",
      facts: [{ label: "Typical size", value: "about 1 to 3 µm" }],
    },
    {
      id: "organelle_rough_er",
      name: "Rough endoplasmic reticulum",
      group: "synthesis",
      summary: "Folded sheets of membrane covered in ribosomes, connected to the nucleus.",
      does:
        "Proteins that will leave the cell or sit in a membrane are built on its ribosomes, threaded inside, folded and checked. Properly folded proteins are sent on to the Golgi apparatus.",
      consequenceLabel: "If it fails",
      consequence:
        "Misfolded proteins pile up and stress the cell. The commonest cystic fibrosis mutation makes a protein fold wrongly, so it is destroyed before reaching the membrane.",
      facts: [{ label: "Appearance", value: "studded with ribosomes, so it looks rough" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "organelle_smooth_er",
      name: "Smooth endoplasmic reticulum",
      group: "synthesis",
      summary: "Branching tubes of membrane with no ribosomes on them.",
      does:
        "It makes fats and steroid hormones, stores calcium, and in liver cells breaks down drugs and toxins. Muscle cells have a specialised form that releases calcium to make the muscle contract.",
      consequenceLabel: "In practice",
      consequence:
        "Some drugs, such as phenobarbital, make liver cells build more smooth ER and process medicines faster, one reason doses can need adjusting over time.",
      facts: [{ label: "Appearance", value: "tubes, no ribosomes" }],
    },
    {
      id: "organelle_golgi_apparatus",
      name: "Golgi apparatus",
      group: "synthesis",
      summary: "A stack of flattened membrane sacs that sorts and packages proteins.",
      does:
        "Proteins arrive from the rough ER, are finished with sugar tags and other changes, then are sorted into small bubbles called vesicles and sent to the right destination: the membrane, outside the cell, or a lysosome.",
      consequenceLabel: "If it fails",
      consequence:
        "In I-cell disease the Golgi cannot tag enzymes for the lysosome, so they leave the cell instead and waste builds up inside.",
      facts: [{ label: "Typical stack", value: "usually 4 to 8 flattened sacs" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "organelle_mitochondrion",
      name: "Mitochondrion",
      group: "energy",
      summary: "The bean-shaped compartment that turns food into usable energy.",
      does:
        "It makes most of the cell's ATP, the molecule that powers nearly everything the cell does. It has its own small circular DNA, inherited from the mother, and folds its inner membrane into ridges, the cristae, to fit in more of the machinery. Three of the mitochondria here are sliced open so you can see them.",
      consequenceLabel: "If it fails",
      consequence:
        "Mitochondrial diseases hit the tissues that need the most energy first: brain, heart and muscle.",
      facts: [
        { label: "Typical size", value: "0.5 to 1 µm wide, 1 to 10 µm long" },
        { label: "Own DNA", value: "16,569 base pairs, 37 genes (human)" },
        { label: "How many", value: "hundreds to thousands per cell, by cell type" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "organelle_ribosome",
      name: "Ribosomes",
      group: "synthesis",
      summary: "Tiny machines that read RNA and join amino acids into proteins.",
      does:
        "Some float free in the cytoplasm and make proteins used inside the cell. Others sit on the rough ER and make proteins for export or membranes. Every cell has millions.",
      consequenceLabel: "In practice",
      consequence:
        "Bacterial ribosomes differ from human ones, which is how antibiotics such as erythromycin can stop bacteria making protein without stopping us.",
      facts: [{ label: "Typical size", value: "about 20 to 30 nm" }],
    },
    {
      id: "organelle_peroxisome",
      name: "Peroxisomes",
      group: "waste",
      summary: "Small round bodies that break down fatty acids and toxins.",
      does:
        "They use oxygen to break down very long fatty acids and some poisons, such as alcohol in liver cells. That makes hydrogen peroxide, which they immediately split into water and oxygen with the enzyme catalase. Many show a dense crystal of enzyme in the middle.",
      consequenceLabel: "If they fail",
      consequence: "In Zellweger syndrome peroxisomes cannot be built, and long fatty acids build up and damage the brain, liver and kidneys.",
      facts: [{ label: "Size", value: "about 0.1 to 1 µm" }],
      featured: false,
    },
    {
      id: "organelle_vesicle",
      name: "Vesicles",
      group: "synthesis",
      summary: "Tiny membrane bubbles that carry cargo between organelles and to the surface.",
      does:
        "Proteins finished in the Golgi are packed into vesicles, which bud off and travel along the cytoskeleton. When one reaches the cell membrane it fuses with it and releases its contents outside: exocytosis. Two vesicles here are caught mid-fusion, open to the outside.",
      consequenceLabel: "In practice",
      consequence: "Nerve cells release their signalling chemicals this way; insulin leaves pancreas cells the same way.",
      facts: [{ label: "Size", value: "about 50 to 100 nm across" }],
      featured: false,
    },
    {
      id: "organelle_lysosome",
      name: "Lysosome",
      group: "waste",
      summary: "A small acid-filled bubble that digests worn-out parts and unwanted material.",
      does:
        "Its enzymes work in acid, so if one leaks into the neutral cytoplasm it does little harm. It breaks down old organelles, bacteria the cell has swallowed, and large molecules, returning the building blocks for reuse.",
      consequenceLabel: "If it fails",
      consequence:
        "In Tay–Sachs disease a missing lysosomal enzyme lets a fatty substance build up in nerve cells and damage them.",
      facts: [
        { label: "Typical size", value: "about 0.1 to 1 µm" },
        { label: "Inside", value: "about pH 4.5 to 5, with dozens of digestive enzymes" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "organelle_centrosome",
      name: "Centrosome",
      group: "structure",
      summary: "A pair of tiny barrels that organise the cell's internal scaffold.",
      does:
        "It is the starting point for microtubules. When a cell divides, the centrosome copies itself and the two copies pull the chromosomes apart to opposite ends.",
      consequenceLabel: "If it fails",
      consequence:
        "Extra or misplaced centrosomes can split chromosomes unevenly, an error often seen in cancer cells.",
      facts: [
        { label: "Made of", value: "two centrioles, each a ring of nine microtubule triplets" },
        { label: "Each centriole", value: "about 250 nm wide, 500 nm long" },
      ],
    },
    {
      id: "organelle_cytoskeleton",
      name: "Cytoskeleton",
      group: "structure",
      summary: "A network of protein threads that gives the cell its shape and lets it move things.",
      does:
        "Three kinds of thread do different jobs: thin actin filaments help cells crawl and muscles contract, intermediate filaments give strength, and microtubules act as tracks for moving cargo around the cell.",
      consequenceLabel: "In practice",
      consequence:
        "Several chemotherapy drugs, such as paclitaxel and vincristine, work by disrupting microtubules so cancer cells cannot divide.",
      facts: [
        { label: "Actin filament", value: "about 7 nm wide" },
        { label: "Intermediate filament", value: "about 10 nm wide" },
        { label: "Microtubule", value: "about 25 nm wide" },
      ],
    },
  ],

  tabs: {
    overview: {
      heading: "The cell",
      blocks: [
        {
          type: "paragraph",
          text:
            "Every living thing is made of cells, and the human body has trillions of them. A cell is not a blob: it is a set of small compartments called organelles, each with a job, all working together.",
        },
        {
          type: "paragraph",
          text:
            "This is a generalised animal cell. Real cells differ: a red blood cell has no nucleus, a muscle cell is packed with mitochondria. The fourteen parts here are the ones nearly every cell shares.",
        },
        {
          type: "bullets",
          items: [
            { text: "Tap any part to open its card." },
            { text: "Drag the cut-away slider to slice the cell in half and see inside." },
            { text: "Use Isolate to hide everything except the part you picked." },
          ],
        },
      ],
    },
    structures: {
      heading: "Structures",
      blocks: [
        {
          type: "table",
          head: ["Part", "Job"],
          caption: "Dot colours match the groups in the Parts list.",
          rows: [
            { group: "envelope", cells: ["Cell membrane", "Controls what enters and leaves"] },
            { group: "envelope", cells: ["Cytoplasm", "Fluid where most reactions happen"] },
            { group: "genetic", cells: ["Nucleus", "Stores and protects the DNA"] },
            { group: "genetic", cells: ["Nucleolus", "Builds ribosome parts"] },
            { group: "synthesis", cells: ["Rough ER", "Makes and folds proteins for export"] },
            { group: "synthesis", cells: ["Smooth ER", "Fats, hormones, calcium, detox"] },
            { group: "synthesis", cells: ["Golgi apparatus", "Finishes and sorts proteins"] },
            { group: "synthesis", cells: ["Ribosomes", "Assemble proteins from RNA"] },
            { group: "energy", cells: ["Mitochondrion", "Makes ATP, the cell's energy"] },
            { group: "waste", cells: ["Lysosome", "Digests waste and old parts"] },
            { group: "waste", cells: ["Peroxisomes", "Break down fatty acids and toxins"] },
            { group: "synthesis", cells: ["Vesicles", "Carry cargo to the surface"] },
            { group: "structure", cells: ["Centrosome", "Organises the scaffold, splits chromosomes"] },
            { group: "structure", cells: ["Cytoskeleton", "Shape, movement and transport tracks"] },
          ],
        },
      ],
    },
    clinical: {
      heading: "Clinical",
      blocks: [
        {
          type: "paragraph",
          text:
            "Many diseases are, at root, a fault in one organelle. Knowing where a job is done explains why a disease affects the tissues it does.",
        },
        {
          type: "table",
          head: ["Where it goes wrong", "Example"],
          rows: [
            { group: "envelope", cells: ["Membrane channel", "Cystic fibrosis"] },
            { group: "genetic", cells: ["DNA repair", "Many cancers"] },
            { group: "synthesis", cells: ["Golgi tagging", "I-cell disease"] },
            { group: "energy", cells: ["Mitochondrial DNA", "Mitochondrial diseases"] },
            { group: "waste", cells: ["Lysosomal enzyme", "Tay–Sachs disease"] },
            { group: "structure", cells: ["Microtubules", "Target of paclitaxel and vincristine"] },
          ],
        },
      ],
    },
    specifications: {
      heading: "Specifications",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "Typical human cell", value: "10 to 30 µm across (varies widely)" },
            { label: "Nucleus", value: "about 5 to 10 µm" },
            { label: "Mitochondrion", value: "1 to 10 µm long" },
            { label: "Lysosome", value: "about 0.1 to 1 µm" },
            { label: "Ribosome", value: "about 20 to 30 nm" },
            { label: "Cell membrane", value: "about 7 to 10 nm thick" },
          ],
        },
        {
          type: "paragraph",
          text:
            "1 µm (micrometre) is one thousandth of a millimetre. 1 nm (nanometre) is one thousandth of a micrometre. Sizes are typical ranges and differ by cell type.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Turn the labels off and find four structures from their jobs alone.",
    params: {
      rounds: [
        { prompt: "Find where the DNA is stored.", answer: "organelle_nucleus" },
        { prompt: "Find the part that makes ATP.", answer: "organelle_mitochondrion" },
        { prompt: "Find the stack that sorts and packages proteins.", answer: "organelle_golgi_apparatus" },
        { prompt: "Find the bubble that digests waste.", answer: "organelle_lysosome" },
      ],
    },
  },
};
