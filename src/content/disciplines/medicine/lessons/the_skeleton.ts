/**
 * Lesson 2: The skeleton, by layers.
 *
 * Peel the body from skin to bone with the Peel slider, then pick any of the
 * 33 named bones (the skull is split into its own bones). The long bones also open into a cross-section (a second scene,
 * public/models/medicine_bone_section.glb) through the "Section this bone"
 * button, which is wired by `options.variants` below.
 *
 * Part ids equal glTF node names. Parts from BOTH scenes live in `parts`; the
 * workspace only lists the ones present in the scene currently on screen.
 * Bilateral bones (clavicle, ribs...) are one part covering both sides.
 * Sizes are typical adult ranges.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const theSkeleton: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "the_skeleton",
  disciplineId: "medicine",
  order: 2,
  title: "The skeleton, by layers",
  blurb: "Peel from skin to bone, then explore 33 named bones, the connective tissue that joins them, and open a bone up.",
  layout: "canvas",
  scene: { id: "medicine_skeleton" },
  options: {
    variants: {
      bone_section: {
        scene: "medicine_bone_section",
        label: "Section this bone",
        forPart: ["bone_femur", "bone_humerus", "bone_tibia", "bone_fibula", "bone_radius", "bone_ulna"],
      },
    },
  },

  parts: [
    // ---- Tissue layers -------------------------------------------------
    {
      id: "tissue_skin",
      name: "Skin",
      group: "tissue",
      summary: "The body's outer covering and its largest organ.",
      does:
        "It keeps water in and germs out, senses touch, heat and pain, and helps control body temperature through sweat and blood flow. It is only a few millimetres thick over most of the body.",
      consequenceLabel: "If damaged",
      consequence:
        "A deep burn destroys the barrier, so fluid loss and infection become the main dangers. Pressure ulcers form when skin over a bone is squeezed for hours.",
      facts: [
        { label: "Area", value: "about 1.5 to 2 m² in an adult" },
        { label: "Thickness", value: "about 1.5 to 4 mm" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "tissue_muscle",
      name: "Skeletal muscle",
      group: "tissue",
      summary: "The red, fibrous tissue that pulls on bones to move them.",
      does:
        "Each muscle shortens when its nerve tells it to, and a tendon passes that pull to a bone. Muscles can only pull, never push, so they work in opposing pairs, such as biceps and triceps.",
      consequenceLabel: "If damaged",
      consequence:
        "A torn muscle bleeds into the gap and heals with scar tissue. Long periods of bed rest make muscle shrink within days, which is why early movement matters after surgery.",
      facts: [
        { label: "Count", value: "more than 600 named muscles" },
        { label: "Share of body weight", value: "roughly 30 to 40%" },
      ],
      featured: true,
      calloutSide: "right",
    },
    // ---- Connective tissue: four kinds, each its own part in the Connective layer -----
    {
      id: "tissue_discs",
      name: "Intervertebral discs",
      group: "connective",
      summary: "The tough, cushioning pads between the vertebrae.",
      does:
        "Each disc has a soft, jelly-like centre (the nucleus) held inside rings of strong fibre (the annulus). Together they absorb shock, let the spine bend and twist, and keep the gaps between vertebrae open so spinal nerves can leave.",
      consequenceLabel: "If it fails",
      consequence:
        "A slipped (herniated) disc happens when the centre pushes through the outer rings and presses on a nerve. In the lower back this causes pain that runs down the leg (sciatica).",
      facts: [
        { label: "Count", value: "23 discs in the spine" },
        { label: "Share of spine length", value: "about a quarter" },
        { label: "Most often herniated", value: "the lowest two lumbar discs" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "tissue_cartilage",
      name: "Cartilage",
      group: "connective",
      summary: "Smooth, springy tissue that caps joints and links ribs to the breastbone.",
      does:
        "Glassy cartilage covers the ends of bones where they meet, so joints glide with almost no friction. Costal cartilage lets the chest wall flex when you breathe: ribs 1 to 7 reach the sternum through their own cartilage. In the knee, two C-shaped pads (menisci) spread the load between thigh bone and shin bone, and a rim of cartilage (the labrum) deepens the shoulder socket.",
      consequenceLabel: "If it fails",
      consequence:
        "Worn joint cartilage is osteoarthritis: bone rubs on bone and the joint hurts and stiffens. A torn meniscus can catch or lock the knee. Cartilage has no blood supply, so it heals very slowly.",
      facts: [
        { label: "Joint cartilage thickness", value: "about 2 to 4 mm in large joints" },
        { label: "Ribs joined to the sternum", value: "1 to 7 directly; 8 to 10 through the rib above; 11 and 12 float" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "tissue_ligaments",
      name: "Ligaments",
      group: "connective",
      summary: "Strong bands of fibre that tie one bone to another.",
      does:
        "Ligaments hold joints together and stop them bending the wrong way. In the knee, two cruciate ligaments cross inside the joint to stop the shin sliding forwards or backwards, and two collateral ligaments run down the sides to stop it bending sideways. Short, very strong sacroiliac ligaments bind the sacrum to the hip bones.",
      consequenceLabel: "If it fails",
      consequence:
        "A torn anterior cruciate ligament (ACL) leaves the knee giving way when you turn or land. A sprain is a ligament stretched or partly torn.",
      facts: [
        { label: "Knee ligaments", value: "4 main: ACL, PCL, MCL, LCL" },
        { label: "Made of", value: "mostly collagen fibres, with a poor blood supply" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "tissue_tendons",
      name: "Tendons",
      group: "connective",
      summary: "Cords of fibre that tie muscle to bone.",
      does:
        "A tendon carries the pull of a muscle to a bone, so the muscle can move the skeleton. The Achilles tendon joins the calf muscles to the heel; the quadriceps tendon and the patellar tendon pass the thigh muscle's pull over the kneecap to the shin. The patellar tendon is also called the patellar ligament, because it joins two bones. The linea alba is a tendon-like line down the middle of the abdomen that anchors the stomach muscles.",
      consequenceLabel: "If it fails",
      consequence:
        "An Achilles tendon rupture makes it impossible to rise onto the toes. Tendons heal slowly because they have little blood supply, so repair can take months.",
      facts: [
        { label: "Strongest tendon", value: "the Achilles, the thickest in the body" },
        { label: "Load when running", value: "several times body weight through the Achilles" },
      ],
      featured: true,
      calloutSide: "left",
    },

    // ---- Skull ----------------------------------------------------------
    {
      id: "bone_frontal",
      name: "Frontal bone",
      group: "skull",
      summary: "The forehead, and the roof of both eye sockets.",
      does:
        "It forms the front of the braincase and curves back under it to make the roofs of the orbits. The ridge above each eye, the brow ridge, protects the eyes from blows. Inside are the frontal sinuses, air spaces that make the bone lighter.",
      consequenceLabel: "If damaged",
      consequence: "A fracture through the front wall of the frontal sinus can dent the forehead; one through the back wall can let brain fluid leak into the nose.",
      facts: [{ label: "Joins", value: "parietal bones at the coronal suture" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_parietal",
      name: "Parietal bones",
      group: "skull",
      summary: "The pair of curved plates that make the top and sides of the skull.",
      does:
        "Left and right parietal bones meet along the top at the sagittal suture. Together with the frontal and occipital bones they form the dome that covers the brain's upper surface.",
      consequenceLabel: "In practice",
      consequence: "In a baby the sutures around the parietal bones have not closed yet; the soft spot on top of the head (the anterior fontanelle) is where they meet the frontal bone.",
      facts: [
        { label: "Pairs", value: "1 (left and right)" },
        { label: "Fontanelle closes", value: "by about 18 months" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_temporal",
      name: "Temporal bones",
      group: "skull",
      summary: "The sides of the skull around the ears.",
      does:
        "Each temporal bone holds the ear canal, the middle ear and the inner ear (hearing and balance). Behind the ear it forms the mastoid process, where a neck muscle attaches, and in front of the ear it carries the socket of the jaw joint.",
      consequenceLabel: "If damaged",
      consequence: "The bone at the temple is thin. A blow there can tear the middle meningeal artery and cause an epidural haematoma, a bleed that can become life-threatening within hours.",
      facts: [{ label: "Contains", value: "ear canal, middle and inner ear" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_occipital",
      name: "Occipital bone",
      group: "skull",
      summary: "The back and base of the skull.",
      does:
        "It forms the back of the braincase and curves underneath. The spinal cord passes through its large hole, the foramen magnum, and two rounded condyles beside the hole rest on the first vertebra, so you can nod.",
      consequenceLabel: "In practice",
      consequence: "The bump you can feel at the back of your head is the external occipital protuberance, an attachment for neck ligaments.",
      facts: [{ label: "Large opening", value: "foramen magnum, for the spinal cord" }],
      featured: false,
    },
    {
      id: "bone_sphenoid",
      name: "Sphenoid bone",
      group: "skull",
      summary: "A butterfly-shaped bone in the middle of the skull base; only its wings show at the temples.",
      does:
        "Most of it lies deep inside, behind the eyes. It touches almost every other cranial bone and holds the pituitary gland in a saddle-shaped hollow. What you see here are its greater wings, between the frontal and temporal bones.",
      consequenceLabel: "In practice",
      consequence: "The point where frontal, parietal, temporal and sphenoid meet (the pterion) is the thinnest part of the skull wall.",
      facts: [{ label: "Holds", value: "the pituitary gland" }],
      featured: false,
    },
    {
      id: "bone_zygomatic",
      name: "Zygomatic bones",
      group: "skull",
      summary: "The cheekbones, and the arches that run back toward the ears.",
      does:
        "Each cheekbone forms the outer rim of an eye socket and joins a process of the temporal bone to make the zygomatic arch. The masseter, the main chewing muscle, hangs from the arch.",
      consequenceLabel: "If damaged",
      consequence: "A punch to the cheek can break the zygomatic bone and flatten the cheek, and sometimes trap an eye muscle so the eye cannot look up.",
      featured: false,
    },
    {
      id: "bone_maxilla",
      name: "Maxilla",
      group: "skull",
      summary: "The upper jaw: it holds the upper teeth and frames the nose.",
      does:
        "Two maxillae fuse in the middle. They form the floor of the eye sockets, the sides of the nasal opening and most of the hard palate, and carry the upper teeth. Inside each is a large air space, the maxillary sinus.",
      consequenceLabel: "In practice",
      consequence: "Upper back-tooth roots sit close to the maxillary sinus, which is why sinusitis can feel like toothache.",
      facts: [{ label: "Teeth carried", value: "up to 16 (adult upper set)" }],
      featured: false,
    },
    {
      id: "bone_nasal",
      name: "Nasal bones",
      group: "skull",
      summary: "Two small bones forming the bridge of the nose.",
      does: "They make the upper, bony part of the nose. The rest of the nose below is cartilage, so it does not appear on a skeleton; that is why the nasal opening of a skull looks so large.",
      consequenceLabel: "If damaged",
      consequence: "The nasal bones are the most commonly broken bones of the face.",
      featured: false,
    },
    {
      id: "bone_mandible",
      name: "Mandible",
      group: "skull",
      summary: "The lower jaw, the only skull bone that moves.",
      does:
        "It hinges on the temporal bones at the temporomandibular joints, just in front of the ears, so you can chew, speak and yawn. It carries the lower teeth and is the strongest bone of the face.",
      consequenceLabel: "If damaged",
      consequence: "A broken jaw often fractures in two places at once, because the bone is a ring and tends to break on opposite sides. The bite no longer lines up, which is how it is spotted.",
      facts: [{ label: "Teeth carried", value: "up to 16 (adult lower set)" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_teeth",
      name: "Teeth",
      group: "skull",
      summary: "Thirty-two in a full adult set, set in sockets in the jaws.",
      does:
        "From the front back: incisors cut, canines tear, premolars and molars crush and grind. Each tooth has a crown of enamel, the hardest substance in the body, and roots anchored in the bone by a thin ligament.",
      consequenceLabel: "In practice",
      consequence: "Teeth are not bones: enamel cannot repair itself, which is why a cavity has to be filled.",
      facts: [
        { label: "Adult set", value: "32 (8 incisors, 4 canines, 8 premolars, 12 molars)" },
        { label: "Milk teeth", value: "20" },
      ],
      featured: false,
    },

    // ---- Spine and thorax ---------------------------------------------
    {
      id: "bone_cervical",
      name: "Cervical vertebrae",
      group: "axial",
      summary: "The seven small vertebrae of the neck.",
      does:
        "They carry the head and give the neck its range of movement. The first (the atlas) is a ring with no body that the skull rocks on; the second (the axis) has a peg the atlas turns around, so you can shake your head.",
      consequenceLabel: "If damaged",
      consequence: "An injury here can damage the spinal cord high up. Damage above about C5 can affect breathing, because the nerves to the diaphragm leave the cord at C3 to C5.",
      facts: [{ label: "Count", value: "7 (C1 to C7)" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_thoracic",
      name: "Thoracic vertebrae",
      group: "axial",
      summary: "The twelve vertebrae of the chest, one for each pair of ribs.",
      does: "Each one has joint surfaces for a pair of ribs. Long spines slope down behind them like roof tiles, which limits bending but protects the chest's organs.",
      consequenceLabel: "If it fails",
      consequence: "Weak bones (osteoporosis) can let the front of thoracic vertebrae collapse, which rounds the upper back.",
      facts: [{ label: "Count", value: "12 (T1 to T12)" }],
      featured: false,
    },
    {
      id: "bone_lumbar",
      name: "Lumbar vertebrae",
      group: "axial",
      summary: "The five large vertebrae of the lower back.",
      does: "They carry the weight of everything above them, so their bodies are the biggest. The discs between them take high loads when you lift.",
      consequenceLabel: "If it fails",
      consequence: "A slipped (herniated) disc most often happens between L4-L5 or L5-S1 and can press on a nerve root, causing sciatica down the leg.",
      facts: [{ label: "Count", value: "5 (L1 to L5)" }],
      featured: false,
    },
    {
      id: "bone_sacrum",
      name: "Sacrum",
      group: "axial",
      summary: "A triangle of five fused vertebrae that wedges between the hip bones.",
      does: "It passes the weight of the upper body into the pelvis through the sacroiliac joints. The rows of holes (sacral foramina) let nerves out to the pelvis and legs.",
      consequenceLabel: "In practice",
      consequence: "The sacroiliac joints barely move; inflammation there is a common cause of low back pain.",
      facts: [{ label: "Fused vertebrae", value: "5" }],
      featured: false,
    },
    {
      id: "bone_coccyx",
      name: "Coccyx",
      group: "axial",
      summary: "The tailbone: three to five tiny fused vertebrae at the bottom of the spine.",
      does: "It is an anchor for pelvic floor muscles and ligaments, and it takes some weight when you sit leaning back.",
      consequenceLabel: "If damaged",
      consequence: "A fall onto the bottom can bruise or break it, which makes sitting painful for weeks.",
      facts: [{ label: "Segments", value: "usually 4" }],
      featured: false,
    },
    {
      id: "bone_ribs",
      name: "Ribs",
      group: "axial",
      summary: "Twelve pairs of curved bones that form the rib cage.",
      does:
        "They shield the heart and lungs and swing up and down as you breathe. Costal cartilage joins the upper ribs to the sternum, which keeps the cage springy instead of brittle.",
      consequenceLabel: "If damaged",
      consequence:
        "A broken rib hurts with every breath, and a sharp end can puncture the lung and let air collect around it (pneumothorax). Several ribs broken in two places can leave a loose chest segment called a flail chest.",
      facts: [
        { label: "Pairs", value: "12 (7 true, 3 false, 2 floating)" },
        { label: "Cartilage", value: "shown in the connective layer" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_sternum",
      name: "Sternum",
      group: "axial",
      summary: "The flat breastbone in the middle of the chest.",
      does:
        "It anchors the upper ribs through their cartilage and protects the heart behind it. Its marrow is rich in blood-forming cells.",
      consequenceLabel: "In practice",
      consequence:
        "Chest compressions in CPR press on the lower half of the sternum. Heart surgery often opens the chest by cutting the sternum down its length (a median sternotomy).",
      facts: [{ label: "Length", value: "about 15 to 20 cm" }],
    },

    // ---- Upper limb ----------------------------------------------------
    {
      id: "bone_clavicle",
      name: "Clavicle",
      group: "upper",
      summary: "The collarbone, a slim strut between the sternum and the shoulder.",
      does:
        "It holds the shoulder out to the side so the arm can swing freely, and passes forces from the arm to the trunk.",
      consequenceLabel: "If damaged",
      consequence:
        "It is among the most commonly broken bones, usually from a fall onto the shoulder or an outstretched hand. The break is felt as a lump and the shoulder droops.",
      facts: [{ label: "Length", value: "about 12 to 15 cm" }],
    },
    {
      id: "bone_scapula",
      name: "Scapula",
      group: "upper",
      summary: "The shoulder blade, a flat triangle on the upper back.",
      does:
        "It glides over the rib cage and carries the shallow socket (glenoid) that the arm bone sits in. Many shoulder muscles attach to it, which is what makes the shoulder so mobile.",
      consequenceLabel: "If damaged",
      consequence:
        "Because muscle covers it well, breaking a scapula takes a hard hit, such as a car crash, so doctors look for other injuries too. A winged scapula, where the blade sticks out, points to a nerve problem.",
      facts: [{ label: "Joint", value: "ball-and-socket with the humerus" }],
    },
    {
      id: "bone_humerus",
      name: "Humerus",
      group: "upper",
      summary: "The upper-arm bone, from shoulder to elbow.",
      does:
        "Its rounded head sits in the scapula's socket, and its lower end forms the elbow with the forearm bones. A nerve (the radial nerve) winds around its middle.",
      consequenceLabel: "If damaged",
      consequence:
        "A break in the shaft can bruise or tear the radial nerve, leaving a wrist that will not lift (wrist drop).",
      facts: [{ label: "Length", value: "about 28 to 33 cm" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_radius",
      name: "Radius",
      group: "upper",
      summary: "The forearm bone on the thumb side.",
      does:
        "It turns around the ulna to flip the palm up or down, and its wide lower end forms most of the wrist joint.",
      consequenceLabel: "If damaged",
      consequence:
        "The most common break near the wrist is the lower end of the radius, usually from falling onto an outstretched hand (a Colles fracture).",
      facts: [{ label: "Length", value: "about 22 to 26 cm" }],
    },
    {
      id: "bone_ulna",
      name: "Ulna",
      group: "upper",
      summary: "The forearm bone on the little-finger side.",
      does:
        "Its hooked top end, the olecranon, forms the point of the elbow and locks the joint straight. It is the stable partner while the radius rotates.",
      consequenceLabel: "If damaged",
      consequence:
        "A hard knock to the elbow can fracture the olecranon, and then the triceps pulls the piece away so the arm cannot be straightened without surgery.",
      facts: [{ label: "Length", value: "about 23 to 28 cm" }],
    },

    // ---- Lower limb ----------------------------------------------------
    {
      id: "bone_pelvis",
      name: "Hip bones",
      group: "lower",
      summary: "The ring of bone at the base of the spine that carries the body's weight to the legs.",
      does:
        "Each side is three bones fused together (ilium, ischium and pubis), joined at the back to the sacrum. It cradles the organs of the lower abdomen and holds the hip sockets.",
      consequenceLabel: "If damaged",
      consequence:
        "Because it is a ring, it rarely breaks in only one place, and a broken pelvis can bleed heavily into the surrounding space. The pelvis is wider and shallower in most women, which suits childbirth.",
      facts: [{ label: "Hip socket", value: "the acetabulum, deep and cup-shaped" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_femur",
      name: "Femur",
      group: "lower",
      summary: "The thigh bone, the longest and strongest bone in the body.",
      does:
        "A ball at its top fits into the hip socket and its lower end forms the knee. It is angled inward from hip to knee so the feet sit under the body's centre of gravity.",
      consequenceLabel: "If damaged",
      consequence:
        "A broken neck of the femur (a hip fracture) is common in older people with thin bones and usually needs surgery. Breaking the shaft takes great force and can bleed a lot.",
      facts: [
        { label: "Length", value: "about 40 to 50 cm, roughly a quarter of height" },
        { label: "Rank", value: "longest bone in the body" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_patella",
      name: "Patella",
      group: "lower",
      summary: "The kneecap, a small bone set inside the thigh's tendon.",
      does:
        "It sits in front of the knee and acts like a pulley, giving the thigh muscle better leverage to straighten the leg. It also shields the joint.",
      consequenceLabel: "If damaged",
      consequence:
        "The patella can slip sideways out of its groove (dislocate), usually when the knee twists. A direct fall onto the knee can crack it.",
      facts: [{ label: "Type", value: "the body's largest sesamoid bone" }],
    },
    {
      id: "bone_tibia",
      name: "Tibia",
      group: "lower",
      summary: "The shin bone, the main weight-bearing bone of the lower leg.",
      does:
        "It takes nearly all the weight passing from the knee to the ankle. Its front edge lies just under the skin, which is why a knock on the shin hurts so much.",
      consequenceLabel: "If damaged",
      consequence:
        "It is the long bone broken most often, and because there is so little soft tissue over it, a break can poke through the skin (an open fracture), which carries a high infection risk.",
      facts: [{ label: "Length", value: "about 35 to 43 cm" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_fibula",
      name: "Fibula",
      group: "lower",
      summary: "The thin bone running beside the tibia.",
      does:
        "It carries little of the body's weight. Its main jobs are to give muscles a place to attach and, at the ankle, to form the outer side of the joint that keeps the foot steady.",
      consequenceLabel: "If damaged",
      consequence:
        "Twisting the ankle can break the lower fibula. A nerve (the common peroneal nerve) wraps around the top of the bone, so a blow there can cause foot drop.",
      facts: [{ label: "Length", value: "about 34 to 40 cm" }],
    },
    {
      id: "bone_carpals",
      name: "Carpals",
      group: "upper",
      summary: "Eight small wrist bones in two rows.",
      does:
        "Proximal row, thumb side first: scaphoid, lunate, triquetrum, pisiform. Distal row: trapezium, trapezoid, capitate, hamate. Sliding over each other, they let the wrist bend and turn while staying strong.",
      consequenceLabel: "If damaged",
      consequence: "A fall on an outstretched hand can break the scaphoid. Its blood supply enters from one end, so a broken scaphoid may fail to heal unless it is spotted early.",
      facts: [{ label: "Bones", value: "8 per wrist" }],
      featured: false,
    },
    {
      id: "bone_metacarpals",
      name: "Metacarpals",
      group: "upper",
      summary: "The five long bones of the palm.",
      does: "Each runs from the wrist to a knuckle. The thumb's metacarpal is short and sits at an angle, which lets the thumb swing across the palm to meet the fingers.",
      consequenceLabel: "If damaged",
      consequence: "Punching a hard surface often breaks the neck of the fifth metacarpal, the one behind the little finger: the boxer's fracture.",
      facts: [{ label: "Bones", value: "5 per hand" }],
      featured: false,
    },
    {
      id: "bone_hand_phalanges",
      name: "Phalanges of the hand",
      group: "upper",
      summary: "The finger bones: three in each finger, two in the thumb.",
      does: "Proximal, middle and distal phalanges are joined by hinge joints, so fingers curl but cannot twist. The distal phalanx ends in a flattened tuft under the fingernail.",
      consequenceLabel: "In practice",
      consequence: "Fourteen phalanges, eight carpals and five metacarpals make 27 bones per hand: a quarter of all the bones in the body are in the hands.",
      facts: [{ label: "Bones", value: "14 per hand" }],
      featured: false,
    },
    {
      id: "bone_tarsals",
      name: "Tarsals",
      group: "lower",
      summary: "Seven ankle and heel bones.",
      does:
        "The talus sits under the tibia and fibula and forms the ankle joint; the calcaneus below it is the heel. In front are the navicular, the cuboid and three cuneiforms, which form the top of the arch.",
      consequenceLabel: "If damaged",
      consequence: "A fall from a height onto the feet can shatter the calcaneus. It is the most commonly broken tarsal bone.",
      facts: [
        { label: "Bones", value: "7 per foot" },
        { label: "Largest", value: "calcaneus (heel)" },
      ],
      featured: false,
    },
    {
      id: "bone_metatarsals",
      name: "Metatarsals",
      group: "lower",
      summary: "The five long bones of the foot between the ankle and the toes.",
      does: "They form the arch of the foot with the tarsals; the arch flattens a little with each step and springs back, storing and returning energy.",
      consequenceLabel: "If damaged",
      consequence: "Runners and soldiers who suddenly increase their distance can get a stress fracture of the second metatarsal, the 'march fracture'.",
      facts: [{ label: "Bones", value: "5 per foot" }],
      featured: false,
    },
    {
      id: "bone_foot_phalanges",
      name: "Phalanges of the foot",
      group: "lower",
      summary: "The toe bones: two in the big toe, three in the others.",
      does: "The big toe takes the final push of each step. The small toes help grip and balance.",
      consequenceLabel: "In practice",
      consequence: "Seven tarsals, five metatarsals and fourteen phalanges make 26 bones per foot.",
      facts: [{ label: "Bones", value: "14 per foot" }],
      featured: false,
    },

    // ---- Bone cross-section scene (medicine_bone_section) --------------
    {
      id: "bone_periosteum",
      name: "Periosteum",
      group: "outer",
      summary: "The tough skin that wraps the outside of a bone.",
      does:
        "It carries blood vessels and nerves into the bone and contains cells that build new bone. That is why bone can mend itself after a break, and why a fracture hurts.",
      consequenceLabel: "In practice",
      consequence:
        "When a bone is broken, cells in the periosteum form a soft callus around the gap, and over weeks this hardens to bridge it.",
      facts: [{ label: "Has", value: "blood supply and many pain nerves" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_compact",
      name: "Compact bone",
      group: "hard",
      summary: "The dense, hard outer wall of a bone.",
      does:
        "It is built from tiny tubes called osteons, each a set of rings of bone around a channel that carries blood. This gives a stiff, strong shaft that resists bending and twisting.",
      consequenceLabel: "If it fails",
      consequence:
        "In osteoporosis the walls thin and the bone breaks from falls that would not normally harm it. Compact bone makes up about 80% of the skeleton's mass.",
      facts: [{ label: "Osteon width", value: "about 0.2 to 0.3 mm" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_spongy",
      name: "Spongy bone",
      group: "hard",
      summary: "A lattice of thin struts found inside the ends of long bones.",
      does:
        "The struts line up along the directions the bone is pushed, giving strength for little weight. The gaps between them are filled with marrow.",
      consequenceLabel: "If it fails",
      consequence:
        "Spongy bone is remodelled faster than compact bone, so it thins first in osteoporosis. This is why the hip, wrist and spine are the usual places to break.",
      facts: [{ label: "Found in", value: "ends of long bones, vertebrae, pelvis" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_red_marrow",
      name: "Red marrow",
      group: "marrow",
      summary: "The soft tissue in spongy bone that makes blood cells.",
      does:
        "It produces red blood cells, white blood cells and platelets, millions every second. In adults it sits mainly in the pelvis, spine, ribs, sternum and the ends of the long bones.",
      consequenceLabel: "In practice",
      consequence:
        "To diagnose some blood cancers, a doctor takes a sample of marrow, often from the back of the hip bone (a bone marrow biopsy). A marrow transplant replaces diseased marrow with a donor's.",
      facts: [{ label: "Makes", value: "red cells, white cells, platelets" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "bone_medullary_cavity",
      name: "Medullary cavity",
      group: "marrow",
      summary: "The hollow centre of the shaft, filled with yellow marrow.",
      does:
        "In adults this canal holds yellow marrow, which is mostly fat and acts as an energy store. If the body is badly short of blood it can turn back into red marrow.",
      consequenceLabel: "In practice",
      consequence:
        "Surgeons fix a broken femur by passing a metal rod down this canal (an intramedullary nail), which splints the bone from the inside.",
      facts: [{ label: "Contains", value: "yellow marrow (fat)" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "bone_articular_cartilage",
      name: "Articular cartilage",
      group: "outer",
      summary: "A smooth, glassy cap on the end of a bone where it meets a joint.",
      does:
        "It is slippery enough that joint surfaces glide with almost no friction and springy enough to absorb impact. It has no blood vessels, so it is fed by the joint fluid.",
      consequenceLabel: "If it fails",
      consequence:
        "In osteoarthritis the cartilage wears thin and bone rubs on bone, causing pain and stiffness. Because cartilage has no blood supply it barely repairs itself.",
      facts: [{ label: "Thickness", value: "about 2 to 4 mm in large joints" }],
      featured: true,
      calloutSide: "left",
    },
  ],

  tabs: {
    overview: {
      heading: "The skeleton, by layers",
      blocks: [
        {
          type: "paragraph",
          text:
            "Most of what you see of a person is not bone at all. Skin covers muscle, muscle is tied to bone by tendons, and joints are held by ligaments and cartilage. Peel the layers back to see how they stack.",
        },
        {
          type: "paragraph",
          text:
            "An adult skeleton has 206 bones. This model names 33 bones and bone groups, including the separate bones of the skull, the wrist and the ankle. A newborn has closer to 270 to 300 bones, because many fuse as we grow.",
        },
        {
          type: "bullets",
          items: [
            { text: "Drag the Peel slider to remove skin, then muscle, then the connective tissue: discs, cartilage, ligaments and tendons." },
            { text: "Tap a bone for its card. If its layer is covered, the model peels to it for you." },
            { text: "Select a long bone and choose Section this bone to see inside it." },
          ],
        },
      ],
    },
    structures: {
      heading: "Structures",
      blocks: [
        {
          type: "table",
          head: ["Bone", "Where"],
          caption: "Dot colours match the groups in the Parts list.",
          rows: [
            { group: "skull", cells: ["Frontal, parietal, temporal, occipital, sphenoid", "The braincase (cranium)"] },
            { group: "skull", cells: ["Zygomatic, maxilla, nasal", "The face"] },
            { group: "skull", cells: ["Mandible and teeth", "Lower jaw"] },
            { group: "axial", cells: ["Cervical, thoracic, lumbar vertebrae", "Neck, chest, lower back"] },
            { group: "axial", cells: ["Sacrum and coccyx", "Base of the spine"] },
            { group: "axial", cells: ["Ribs and sternum", "Chest"] },
            { group: "upper", cells: ["Clavicle", "Collarbone"] },
            { group: "upper", cells: ["Scapula", "Shoulder blade"] },
            { group: "upper", cells: ["Humerus", "Upper arm"] },
            { group: "upper", cells: ["Radius", "Forearm, thumb side"] },
            { group: "upper", cells: ["Ulna", "Forearm, little-finger side"] },
            { group: "lower", cells: ["Hip bones", "Pelvis, with the sacrum"] },
            { group: "lower", cells: ["Femur", "Thigh"] },
            { group: "lower", cells: ["Patella", "Kneecap"] },
            { group: "lower", cells: ["Tibia", "Shin"] },
            { group: "lower", cells: ["Fibula", "Outer lower leg"] },
            { group: "upper", cells: ["Carpals, metacarpals, phalanges", "Wrist, palm, fingers"] },
            { group: "lower", cells: ["Tarsals, metatarsals, phalanges", "Ankle, foot, toes"] },
          ],
        },
        {
          type: "table",
          head: ["Connective tissue", "What it joins"],
          caption: "Peel to the Connective layer to see all four.",
          rows: [
            { group: "connective", cells: ["Intervertebral discs", "Vertebra to vertebra"] },
            { group: "connective", cells: ["Cartilage", "Caps joint ends; links ribs to the sternum; knee menisci"] },
            { group: "connective", cells: ["Ligaments", "Bone to bone, such as the knee's cruciates and collaterals"] },
            { group: "connective", cells: ["Tendons", "Muscle to bone, such as the Achilles and patellar tendons"] },
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
            "Knowing which layer a structure lies in tells you what is damaged by a given injury and what a surgeon must pass through to reach it.",
        },
        {
          type: "table",
          head: ["Injury", "What is affected"],
          rows: [
            { group: "connective", cells: ["Anterior cruciate ligament tear", "Ligaments of the knee"] },
            { group: "connective", cells: ["Slipped disc", "Intervertebral discs, pressing on a nerve"] },
            { group: "connective", cells: ["Achilles tendon rupture", "Tendons at the heel"] },
            { group: "connective", cells: ["Osteoarthritis", "Cartilage on the joint surfaces"] },
            { group: "tissue", cells: ["Hamstring strain", "Muscle at the back of the thigh"] },
            { group: "upper", cells: ["Colles fracture", "Lower end of the radius"] },
            { group: "upper", cells: ["Collarbone fracture", "Clavicle"] },
            { group: "lower", cells: ["Hip fracture", "Neck of the femur"] },
            { group: "lower", cells: ["Open shin fracture", "Tibia, close to the skin"] },
            { group: "axial", cells: ["Rib fracture", "Ribs, with risk to the lung"] },
            { group: "upper", cells: ["Scaphoid fracture", "Carpals: the wrist"] },
            { group: "skull", cells: ["Blow to the temple", "Temporal bone, artery beneath"] },
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
            { label: "Adult bones", value: "206" },
            { label: "Skull", value: "22 bones" },
            { label: "Vertebrae", value: "33 (24 movable)" },
            { label: "Rib pairs", value: "12" },
            { label: "Bones in each hand", value: "27" },
            { label: "Bones in each foot", value: "26" },
            { label: "Longest bone", value: "femur, about 40 to 50 cm" },
            { label: "Smallest bone", value: "stapes in the ear, about 3 mm" },
          ],
        },
        {
          type: "paragraph",
          text:
            "The 3D model is a stylised teaching model: bones are placed where they belong and sized in proportion, but they are not scans of a real skeleton. Sizes in the cards are typical adult ranges.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Peel the model back and find five bones from their descriptions.",
    params: {
      rounds: [
        { prompt: "Find the longest bone in the body.", answer: "bone_femur" },
        { prompt: "Find the bone that protects the heart and lungs at the front of the chest (the breastbone).", answer: "bone_sternum" },
        { prompt: "Find the bone that forms your forehead.", answer: "bone_frontal" },
        { prompt: "Find the thin bone beside the shin bone.", answer: "bone_fibula" },
        { prompt: "Find the eight small bones of the wrist.", answer: "bone_carpals" },
      ],
    },
  },
};
