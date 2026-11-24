/**
 * Lesson 1: Examine a house.
 *
 * A single-storey, three-bedroom house. The 3D model and the plan drawing are
 * both generated from src/content/disciplines/architecture/house.ts, so the two
 * always agree. Dimensions quoted in the cards are taken from that file; build
 * practice values (wall thickness, pitch) are typical ones and are labelled so.
 *
 * Part ids equal node names in public/models/architecture_house.glb.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const examineAHouse: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "examine_a_house",
  disciplineId: "architecture",
  order: 1,
  title: "Examine a house",
  blurb: "One three-bedroom house, shown as a plan and as a model. Select a room in either.",
  layout: "canvas",
  scene: { id: "architecture_house" },
  options: {
    // A horizontal section plane: starts above the roof, drag it down through the walls.
    cut: { axis: "y", removes: 1, openTo: 0.3 },
  },

  parts: [
    // ---- rooms ----------------------------------------------------------
    {
      id: "room_bedroom_1",
      name: "Bedroom 1",
      group: "sleeping",
      summary: "The largest bedroom, at the north-west corner.",
      does:
        "It holds a double bed, bedside tables and a wardrobe. The bed head sits against the north wall under the window, so the door and the foot of the bed stay clear for walking. The wardrobe takes the east wall, away from the window.",
      consequenceLabel: "Design note",
      consequence:
        "A bedroom needs space to walk around the bed, usually at least 700 mm on each accessible side. Place furniture on the plan first and check you can still open the door fully.",
      facts: [
        { label: "Floor area", value: "14.3 m²" },
        { label: "Opens onto", value: "the hall" },
        { label: "Windows", value: "north and west" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "room_bathroom",
      name: "Bathroom",
      group: "service",
      summary: "The only bathroom, between bedrooms 1 and 2.",
      does:
        "It holds a bath, a toilet and a basin. Plumbing rooms are grouped so pipes run in one place. The window is set high (1.5 m from the floor) so it lets light in without looking in.",
      consequenceLabel: "Design note",
      consequence:
        "Wet rooms need a window or an extractor fan to remove moisture. Without ventilation, damp builds up as mould on walls and ceiling.",
      facts: [
        { label: "Floor area", value: "7.5 m²" },
        { label: "Opens onto", value: "the hall" },
        { label: "Window sill", value: "1.5 m above the floor" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "room_bedroom_2",
      name: "Bedroom 2",
      group: "sleeping",
      summary: "A mid-sized bedroom with a bed and a desk.",
      does:
        "Its desk sits against the west wall so the daylight comes from the side. It shares a wall with the bathroom, which is useful for plumbing and a reason to think about noise.",
      consequenceLabel: "Design note",
      consequence:
        "A wall that joins a bathroom or kitchen carries pipe noise. Where it matters, designers add insulation to that wall or keep bedrooms away from it.",
      facts: [
        { label: "Floor area", value: "9.6 m²" },
        { label: "Opens onto", value: "the hall" },
      ],
    },
    {
      id: "room_bedroom_3",
      name: "Bedroom 3",
      group: "sleeping",
      summary: "The smallest bedroom, at the north-east corner.",
      does:
        "A single bed and a wardrobe fit here. It is taller than the other bedrooms in plan because it reaches down beside the hall, which gives it two outside walls and so windows on two sides.",
      consequenceLabel: "Design note",
      consequence:
        "A window on two walls (cross-ventilation) lets air pass through the room, cooling it far better than one window can.",
      facts: [
        { label: "Floor area", value: "11.9 m²" },
        { label: "Opens onto", value: "the hall, through its west wall" },
        { label: "Windows", value: "north and east" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "room_hall",
      name: "Hall",
      group: "service",
      summary: "The corridor that connects the bedrooms, bathroom, kitchen and living room.",
      does:
        "Circulation space is area you pay for but cannot use as a room, so designers keep it short. Here one corridor serves five doors. It is a little under 1 m wide, a common minimum for a passage in a house.",
      consequenceLabel: "Design note",
      consequence:
        "A corridor with no window is dark. This one borrows light from the open doorway into the living room.",
      facts: [
        { label: "Floor area", value: "7.9 m²" },
        { label: "Doors off it", value: "5, plus one opening" },
      ],
    },
    {
      id: "room_kitchen",
      name: "Kitchen",
      group: "service",
      summary: "A kitchen with counters along two walls and a small table.",
      does:
        "Counters form an L along the west and south walls, with the fridge at the corner. A wide opening to the living room lets the cook talk to the family and lets daylight pass through.",
      consequenceLabel: "Design note",
      consequence:
        "The sink, cooker and fridge form the 'work triangle'. Designers keep the legs between them short but not cramped, so cooking does not need extra steps.",
      facts: [
        { label: "Floor area", value: "16.7 m²" },
        { label: "Opens onto", value: "the hall (door) and the living room (opening)" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "room_living",
      name: "Living and dining",
      group: "living",
      summary: "The biggest room: a sofa area and a dining table in one space.",
      does:
        "A sofa faces the TV on the north wall, and a dining table sits near the east window. The front door opens straight into it. Combining two uses in one room makes both feel larger.",
      consequenceLabel: "Design note",
      consequence:
        "The front door opens into the room you spend most time in, so the layout leaves a clear path from door to hall and keeps furniture out of it.",
      facts: [
        { label: "Floor area", value: "29.5 m²" },
        { label: "Windows", value: "two on the south wall, one on the east" },
        { label: "Front door", value: "south wall, 1.0 m wide" },
      ],
      featured: true,
      calloutSide: "right",
    },

    // ---- building elements ------------------------------------------------
    {
      id: "wall_exterior",
      name: "Exterior walls",
      group: "envelope",
      summary: "The thick outer walls that keep weather out and heat in.",
      does:
        "Here they are drawn 300 mm thick, which is typical of a cavity wall: an outer leaf of brick, a gap or insulation, and an inner leaf of block. The ends of the east and west walls rise into triangles (gables) to meet the sloping roof.",
      consequenceLabel: "In practice",
      consequence:
        "Wall thickness is not decoration: it holds the insulation. Thin walls lose heat, and the cheapest way to improve an old house is often to add insulation to them.",
      facts: [
        { label: "Thickness", value: "300 mm (typical cavity wall)" },
        { label: "Height", value: "2.7 m floor to wall top" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "wall_interior",
      name: "Interior walls",
      group: "structure",
      summary: "Thin partitions that divide the inside into rooms.",
      does:
        "Partitions are 120 mm thick and carry no roof weight, because the outer walls hold the roof. That is why a partition can be moved while an outer wall cannot.",
      consequenceLabel: "In practice",
      consequence:
        "Before taking out any wall, an engineer first checks whether it carries load. Removing a load-bearing wall without support can make the floor or roof above sag.",
      facts: [{ label: "Thickness", value: "120 mm (typical partition)" }],
    },
    {
      id: "roof",
      name: "Roof",
      group: "envelope",
      summary: "A pitched roof with two slopes meeting at a ridge.",
      does:
        "It sheds rain and snow. This one rises 2.0 m over a half-width of 4.5 m, a pitch of about 24 degrees, and overhangs the walls by 500 mm so rain drips clear of them.",
      consequenceLabel: "In practice",
      consequence:
        "A steeper pitch sheds water and snow faster but needs more roof material. Shallow roofs need better waterproofing because water lingers on them.",
      facts: [
        { label: "Pitch", value: "about 24°" },
        { label: "Overhang (eaves)", value: "500 mm" },
        { label: "Ridge height", value: "4.7 m above the floor" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "slab_foundation",
      name: "Foundation slab",
      group: "structure",
      summary: "The concrete base the house sits on.",
      does:
        "It spreads the building's weight over the ground and keeps the floor off damp soil. The walls stand on it, so any movement in the ground shows up as cracks in the walls.",
      consequenceLabel: "If it fails",
      consequence:
        "If one part of the ground settles more than another, the slab tilts and walls crack in a stair-step pattern. Clay soil that swells and shrinks with the weather is a common cause.",
      facts: [{ label: "Thickness shown", value: "200 mm" }],
    },
    {
      id: "doors",
      name: "Doors",
      group: "envelope",
      summary: "Eight openings you can walk through.",
      does:
        "Five are interior doors, one is the front door, and two are open archways with no leaf. On the plan each door shows a quarter-circle: the space its leaf sweeps as it opens, which must stay clear of furniture.",
      consequenceLabel: "Design note",
      consequence:
        "Door widths follow use: 900 mm is common, 800 mm is acceptable for a bathroom, and wheelchair access needs about 850 mm clear or more.",
      facts: [
        { label: "Standard height", value: "2.1 m" },
        { label: "Front door width", value: "1.0 m" },
      ],
    },
    {
      id: "windows",
      name: "Windows",
      group: "envelope",
      summary: "The openings that let in light and air.",
      does:
        "Most sit with their bottom edge 900 mm above the floor. The living room's windows start lower, at 600 mm, to bring in more light and give a view from a sofa. The bathroom's starts at 1.5 m for privacy.",
      consequenceLabel: "Design note",
      consequence:
        "Windows lose far more heat than walls. Designers give living rooms the most glass, and point it where the winter sun comes in.",
      facts: [
        { label: "Count", value: "11" },
        { label: "Usual sill height", value: "900 mm" },
      ],
    },
  ],

  tabs: {
    overview: {
      heading: "Examine a house",
      blocks: [
        {
          type: "paragraph",
          text:
            "An architect never looks at a building as just a model or just a drawing. They move between the two: a plan shows the rooms laid out flat, a section shows them sliced vertically, and the building itself is what those drawings describe.",
        },
        {
          type: "paragraph",
          text:
            "This is a single-storey house with three bedrooms, one bathroom, a kitchen and a living room, 12 by 9 metres on the plan. The plan in the Drawings tab and the 3D model are made from the same measurements, so selecting a room in one selects it in the other.",
        },
        {
          type: "bullets",
          items: [
            { text: "Take the roof off to look down into the rooms." },
            { text: "Switch walls to outline so the model looks like the plan." },
            { text: "Drag the Section slider to slice through the house and see the walls cut." },
          ],
        },
      ],
    },
    drawings: {
      heading: "Drawings",
      blocks: [
        { type: "custom", renderer: "plan" },
        {
          type: "paragraph",
          text:
            "A plan is a horizontal slice through the building at about 1.2 to 1.5 m above the floor, looked at from above. Everything the slice cuts (walls, windows, doors) is drawn; the roof above is not. The dark walls are the cut material, which is why walls are filled solid.",
        },
        {
          type: "bullets",
          items: [
            { text: "Door arcs show which way each door swings." },
            { text: "A thin triple line in a wall is a window." },
            { text: "A gap with no line is an open archway." },
            { text: "Grid lines 1 to 4 and A to D run along the main walls, so anyone can say exactly where something is (\"the window on grid line A between 2 and 3\")." },
            { text: "Chained dimensions give each room's width; the outer line is the overall size. All are in millimetres." },
            { text: "The Section slider in 3D makes the same horizontal cut you see here." },
          ],
        },
        {
          type: "paragraph",
          text:
            "An elevation is a view of one face of the building, drawn flat with no perspective. Nothing is cut, so nothing is filled solid: you see the roof, the windows divided into casements, the door and the plinth, with level markers giving heights above the finished floor level (FFL).",
        },
        { type: "custom", renderer: "elevation_south" },
        {
          type: "paragraph",
          text:
            "A section is a vertical slice. Line A-A on the plan shows where this one is cut: through the bathroom, the hall and the living room. The slab, the walls and the roof the slice passes through are drawn solid black, and the window and archway it crosses show as gaps with their sills and heads.",
        },
        { type: "custom", renderer: "section_aa" },
      ],
    },
    rooms: {
      heading: "Rooms",
      blocks: [
        {
          type: "table",
          head: ["Room", "Area"],
          caption: "Net floor area inside the walls. Dot colours match the groups in the Parts list.",
          rows: [
            { group: "sleeping", cells: ["Bedroom 1", "14.3 m²"] },
            { group: "service", cells: ["Bathroom", "7.5 m²"] },
            { group: "sleeping", cells: ["Bedroom 2", "9.6 m²"] },
            { group: "sleeping", cells: ["Bedroom 3", "11.9 m²"] },
            { group: "service", cells: ["Hall", "7.9 m²"] },
            { group: "service", cells: ["Kitchen", "16.7 m²"] },
            { group: "living", cells: ["Living and dining", "29.5 m²"] },
          ],
        },
        {
          type: "paragraph",
          text:
            "The rooms add up to 97.4 m². The house footprint measured over the outside of the walls is about 114 m², so roughly 15% of it is wall. That gap between gross and net area is why two listings of the same house can quote different sizes.",
        },
      ],
    },
    specifications: {
      heading: "Specifications",
      blocks: [
        {
          type: "facts",
          items: [
            { label: "Plan size (to wall centres)", value: "12.0 × 9.0 m" },
            { label: "Wall height", value: "2.7 m" },
            { label: "Exterior wall", value: "300 mm" },
            { label: "Partition", value: "120 mm" },
            { label: "Roof pitch", value: "about 24°" },
            { label: "Ridge height", value: "4.7 m" },
            { label: "Net floor area", value: "97.4 m²" },
          ],
        },
        {
          type: "paragraph",
          text:
            "These are typical values for teaching and are not a design for any real site or building code. Real wall build-ups, roof pitch and door widths depend on climate and local regulations.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find the room",
    prompt: "Find four rooms from their descriptions, in the plan or in 3D.",
    params: {
      rounds: [
        { prompt: "Find the largest room in the house.", answer: "room_living" },
        { prompt: "Find the room with a window set high for privacy.", answer: "room_bathroom" },
        { prompt: "Find the corridor that connects the bedrooms.", answer: "room_hall" },
        { prompt: "Find the room with counters along two walls.", answer: "room_kitchen" },
      ],
    },
  },
};
