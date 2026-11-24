/**
 * Lesson 3: The brain.
 *
 * Six regions of the brain plus two structures only a cut reveals. The cut-away
 * is a parasagittal slice (axis x) just beside the midline, which exposes the
 * corpus callosum, ventricles, the brainstem in three parts and nine deep structures.
 *
 * Part ids equal node names in public/models/medicine_brain.glb.
 * The model is stylised: lobe borders follow the central and lateral sulci but
 * the folds themselves are generated, not scanned.
 */
import { SCHEMA_VERSION, type LessonInput } from "@/content/schema";

export const theBrain: LessonInput = {
  schemaVersion: SCHEMA_VERSION,
  id: "the_brain",
  disciplineId: "medicine",
  order: 3,
  title: "The brain",
  blurb: "Six regions, then slice it to find the structures hidden inside.",
  layout: "canvas",
  scene: { id: "medicine_brain" },
  options: {
    // Removes the near hemisphere (+x) so the cut face looks at the camera.
    cut: { axis: "x", removes: 1, openTo: 0.5 },
  },

  parts: [
    {
      id: "brain_frontal_lobe",
      name: "Frontal lobe",
      group: "cerebrum",
      summary: "The front part of the brain, behind the forehead.",
      does:
        "It plans, makes decisions, controls voluntary movement and, on the left side in most people, produces speech. The strip just in front of the central sulcus is the primary motor cortex, which sends the signals that move your muscles.",
      consequenceLabel: "If damaged",
      consequence:
        "Damage to the frontal lobe can change personality and judgement while leaving memory and movement mostly intact. The best-known case is Phineas Gage, a railway worker who survived an iron bar through the front of his brain in 1848.",
      facts: [
        { label: "Largest lobe", value: "about a third of the cortex" },
        { label: "Speech area", value: "Broca's area, usually on the left" },
      ],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "brain_parietal_lobe",
      name: "Parietal lobe",
      group: "cerebrum",
      summary: "The top-back part of the brain.",
      does:
        "It receives touch, pain and temperature from the body, in the strip just behind the central sulcus, and combines the senses to tell you where your body and the things around it are in space.",
      consequenceLabel: "If damaged",
      consequence:
        "A stroke in the right parietal lobe can cause neglect: the person ignores the left side of the world, eating only the food on the right of the plate.",
      facts: [{ label: "Strip behind the central sulcus", value: "primary somatosensory cortex" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "brain_temporal_lobe",
      name: "Temporal lobe",
      group: "cerebrum",
      summary: "The side part of the brain, above the ear.",
      does:
        "It processes hearing and helps understand language, and it holds the hippocampus, which lays down new memories. The temporal lobe sits below the lateral sulcus.",
      consequenceLabel: "If damaged",
      consequence:
        "Damage to both hippocampi makes it impossible to form new memories, while old ones stay. Temporal lobe epilepsy often begins with a strange smell, a rising feeling or a sense of déjà vu.",
      facts: [{ label: "Language comprehension", value: "Wernicke's area, usually on the left" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "brain_occipital_lobe",
      name: "Occipital lobe",
      group: "cerebrum",
      summary: "The back of the brain, behind the parietal and temporal lobes.",
      does:
        "It is the main vision centre. Signals from the eyes travel to it, and it works out edges, colour and movement before passing the result forward.",
      consequenceLabel: "If damaged",
      consequence:
        "A stroke here can cause blindness in half of the visual field in both eyes, even though the eyes themselves are healthy.",
      facts: [{ label: "Role", value: "primary visual cortex" }],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "brain_cerebellum",
      name: "Cerebellum",
      group: "hindbrain",
      summary: "The small, finely ridged part of the brain tucked under the back.",
      does:
        "It fine-tunes movement, balance and posture by comparing what you meant to do with what your body actually did. It is about a tenth of the brain's volume but holds roughly 80% of its neurons.",
      consequenceLabel: "If damaged",
      consequence:
        "Damage causes clumsy, unsteady movement. A person may stagger, overshoot when reaching for a cup, and speak in a slurred way, like being drunk without alcohol.",
      facts: [
        { label: "Share of brain volume", value: "about 10%" },
        { label: "Neurons", value: "roughly 80% of the brain's total" },
      ],
      featured: true,
      calloutSide: "right",
    },
    {
      id: "brain_midbrain",
      name: "Midbrain",
      group: "hindbrain",
      summary: "The top of the brainstem, just under the thalamus.",
      does:
        "At the front, two thick stalks (the cerebral peduncles) carry movement signals down from the cortex. At the back, four small bumps (the colliculi) steer reflexes to sights and sounds, such as turning your eyes toward a sudden noise. It also holds the substantia nigra, which makes dopamine.",
      consequenceLabel: "If damaged",
      consequence: "In Parkinson's disease the dopamine-making cells of the substantia nigra die, which causes tremor, stiffness and slow movement.",
      facts: [{ label: "Back of it", value: "4 colliculi (2 for vision, 2 for hearing)" }],
      featured: false,
    },
    {
      id: "brain_pons",
      name: "Pons",
      group: "hindbrain",
      summary: "The rounded bulge of the brainstem, in front of the cerebellum.",
      does:
        "Its name means bridge: thick bands of fibres cross it and run back into the cerebellum, linking it with the cortex. It also helps set the rhythm of breathing and holds the nuclei of nerves for the face and jaw.",
      consequenceLabel: "If damaged",
      consequence: "A stroke in the front of the pons can cause locked-in syndrome: the person is fully aware but can move only their eyes.",
      featured: true,
      calloutSide: "left",
    },
    {
      id: "brain_medulla",
      name: "Medulla oblongata",
      group: "hindbrain",
      summary: "The lowest part of the brainstem, where the brain becomes the spinal cord.",
      does:
        "It runs the things you never think about: breathing, heart rate, blood pressure, swallowing, coughing and vomiting. On its front are the pyramids, where most movement fibres cross to the other side, and the olives beside them.",
      consequenceLabel: "If damaged",
      consequence: "Because breathing is controlled here, swelling that pushes the brainstem down into the skull opening can stop breathing. Death is legally defined in many countries as the permanent loss of all brainstem function.",
      facts: [{ label: "Crossing", value: "movement fibres cross here, so the left brain moves the right body" }],
      featured: true,
      calloutSide: "left",
    },
    {
      id: "brain_spinal_cord",
      name: "Spinal cord",
      group: "hindbrain",
      summary: "The cable of nerves that continues down from the medulla inside the spine.",
      does: "It carries signals between the brain and the body and handles simple reflexes by itself, such as pulling your hand off something hot before you feel the pain.",
      consequenceLabel: "If damaged",
      consequence: "A cut across the cord stops signals below that level: the higher the injury, the more of the body loses movement and feeling.",
      facts: [{ label: "Length", value: "about 45 cm in an adult" }],
      featured: false,
    },
    {
      id: "brain_thalamus",
      name: "Thalamus",
      group: "deep",
      summary: "Two egg-shaped relay stations in the centre of the brain.",
      does:
        "Almost every sense except smell passes through the thalamus on its way to the cortex. It sorts and forwards the signals, and also helps control sleep and alertness.",
      consequenceLabel: "If damaged",
      consequence: "A small stroke in the thalamus can cause numbness on the opposite side of the body, and sometimes a hard-to-treat burning pain.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "brain_hypothalamus",
      name: "Hypothalamus",
      group: "deep",
      summary: "A small region under the thalamus that keeps the body in balance.",
      does:
        "It controls body temperature, hunger, thirst and the daily sleep-wake rhythm, and it commands the pituitary gland, so it links the nervous system with the hormone system. The two round mammillary bodies behind it help with memory.",
      consequenceLabel: "In practice",
      consequence: "When you have a fever, it is the hypothalamus that has raised the body's temperature set point.",
      facts: [{ label: "Size", value: "about the size of an almond" }],
      featured: false,
    },
    {
      id: "brain_pituitary",
      name: "Pituitary gland",
      group: "deep",
      summary: "A pea-sized gland hanging from the underside of the brain on a stalk.",
      does: "Often called the master gland, it releases hormones that control growth, the thyroid, the adrenal glands, milk production and the ovaries and testes, on instructions from the hypothalamus.",
      consequenceLabel: "If it fails",
      consequence: "A pituitary tumour can press on the optic chiasm just above it and cause loss of the outer half of vision in both eyes.",
      facts: [{ label: "Size", value: "about 1 cm, 0.5 g" }],
      featured: false,
    },
    {
      id: "brain_optic",
      name: "Optic nerves and chiasm",
      group: "deep",
      summary: "The nerves from the eyes, and the X where they meet under the brain.",
      does: "Each optic nerve carries signals from one eye. At the chiasm, the fibres from the inner half of each retina cross over, so each side of the brain receives the opposite half of what you see. The optic tracts then run back toward the thalamus and the occipital lobe.",
      consequenceLabel: "In practice",
      consequence: "Doctors can tell where along this pathway damage lies from the exact pattern of vision that is lost.",
      featured: false,
    },
    {
      id: "brain_olfactory",
      name: "Olfactory bulbs",
      group: "deep",
      summary: "Two small bulbs under the frontal lobes that receive smell.",
      does: "Nerve fibres from the nose pass up through the skull into these bulbs. Smell is the only sense that does not go through the thalamus first, which may be why smells trigger memories and emotions so strongly.",
      consequenceLabel: "If damaged",
      consequence: "A blow to the head can tear the fine fibres to the bulbs and leave a person unable to smell.",
      featured: false,
    },
    {
      id: "brain_hippocampus",
      name: "Hippocampus",
      group: "deep",
      summary: "A curved ridge deep in each temporal lobe, shaped a little like a seahorse.",
      does: "It turns today's experiences into long-term memories and helps you find your way around. It is one of the few places in the adult brain where some new neurons may still form.",
      consequenceLabel: "If damaged",
      consequence: "It is among the first areas affected by Alzheimer's disease, which is why recent memories fade before old ones.",
      featured: true,
      calloutSide: "right",
    },
    {
      id: "brain_amygdala",
      name: "Amygdala",
      group: "deep",
      summary: "An almond-shaped cluster in front of the hippocampus.",
      does: "It detects threats and attaches emotion, especially fear, to memories, and it starts the body's fight-or-flight response.",
      consequenceLabel: "In practice",
      consequence: "An overactive amygdala is linked with anxiety disorders and post-traumatic stress.",
      featured: false,
    },
    {
      id: "brain_basal_ganglia",
      name: "Basal ganglia",
      group: "deep",
      summary: "Clusters of grey matter beside the thalamus: the curved caudate nucleus and the lens-shaped putamen.",
      does: "They help select which movements to make and which to suppress, and they are involved in habits and learning by reward. They work in a loop with the cortex, the thalamus and the midbrain.",
      consequenceLabel: "If it fails",
      consequence: "Huntington's disease damages the caudate first, causing jerky, unwanted movements.",
      featured: false,
    },
    {
      id: "brain_pineal",
      name: "Pineal gland",
      group: "deep",
      summary: "A tiny pine-cone-shaped gland behind the thalamus.",
      does: "It releases melatonin when it gets dark, which helps set the body's sleep rhythm.",
      consequenceLabel: "In practice",
      consequence: "It often contains calcium deposits by adulthood, so it shows up on X-rays and CT scans as a handy midline landmark.",
      featured: false,
    },
    {
      id: "brain_corpus_callosum",
      name: "Corpus callosum",
      group: "deep",
      summary: "A thick, curved band of nerve fibres joining the left and right hemispheres.",
      does:
        "It carries messages between the two halves of the brain so they work together. Only the cut-away shows it.",
      consequenceLabel: "In practice",
      consequence:
        "To limit severe epilepsy that spreads between hemispheres, surgeons sometimes cut it (a callosotomy). The result is a split-brain patient, whose hemispheres can no longer share information easily.",
      facts: [{ label: "Fibres", value: "about 200 million axons" }],
    },
    {
      id: "brain_ventricles",
      name: "Lateral ventricles",
      group: "deep",
      summary: "Two fluid-filled chambers deep inside the brain, one in each hemisphere.",
      does:
        "They are part of a connected set of four cavities that make and circulate cerebrospinal fluid, which cushions the brain and carries away waste. Only the cut-away shows them.",
      consequenceLabel: "If it fails",
      consequence:
        "If the fluid cannot drain, the ventricles swell (hydrocephalus). In babies the head enlarges; treatment is usually a shunt, a thin tube that drains the extra fluid.",
      facts: [
        { label: "Total fluid", value: "about 150 mL, replaced several times a day" },
        { label: "Made by", value: "choroid plexus inside the ventricles" },
      ],
    },
  ],

  tabs: {
    overview: {
      heading: "The brain",
      blocks: [
        {
          type: "paragraph",
          text:
            "The brain weighs about 1.3 to 1.4 kg and holds around 86 billion neurons. Its wrinkled outer layer, the cortex, is folded so that a large surface fits inside the skull. The ridges are called gyri and the grooves sulci.",
        },
        {
          type: "paragraph",
          text:
            "Two grooves help map it. The central sulcus separates the frontal lobe from the parietal lobe, and the lateral sulcus separates the temporal lobe from the ones above it. Functions are shared between regions, so each lobe is a rough guide, not a rigid box.",
        },
        {
          type: "bullets",
          items: [
            { text: "Tap a region to open its card." },
            { text: "Drag the cut-away slider slowly: the deep structures appear one after another as the cut passes through them." },
            { text: "In the cut-away, tap the corpus callosum or a ventricle." },
          ],
        },
      ],
    },
    structures: {
      heading: "Structures",
      blocks: [
        {
          type: "table",
          head: ["Part", "Main job"],
          caption: "Dot colours match the groups in the Parts list.",
          rows: [
            { group: "cerebrum", cells: ["Frontal lobe", "Planning, movement, speech"] },
            { group: "cerebrum", cells: ["Parietal lobe", "Touch and body position"] },
            { group: "cerebrum", cells: ["Temporal lobe", "Hearing, language, memory"] },
            { group: "cerebrum", cells: ["Occipital lobe", "Vision"] },
            { group: "hindbrain", cells: ["Cerebellum", "Balance and coordination"] },
            { group: "hindbrain", cells: ["Midbrain, pons, medulla", "The brainstem: breathing, heart rate, alertness"] },
            { group: "deep", cells: ["Thalamus", "Relays the senses to the cortex"] },
            { group: "deep", cells: ["Hypothalamus and pituitary", "Temperature, hunger, hormones"] },
            { group: "deep", cells: ["Hippocampus and amygdala", "Memory and emotion"] },
            { group: "deep", cells: ["Basal ganglia", "Choosing movements, habits"] },
            { group: "deep", cells: ["Corpus callosum", "Links the two hemispheres"] },
            { group: "deep", cells: ["Lateral ventricles", "Make and circulate fluid"] },
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
            "Where a stroke or injury lands tells you what is lost. Doctors use this to work out the site of damage from symptoms alone.",
        },
        {
          type: "table",
          head: ["Symptom", "Likely region"],
          rows: [
            { group: "cerebrum", cells: ["Cannot speak but understands", "Left frontal lobe"] },
            { group: "cerebrum", cells: ["Ignores the left side of space", "Right parietal lobe"] },
            { group: "cerebrum", cells: ["Cannot form new memories", "Temporal lobes (hippocampus)"] },
            { group: "cerebrum", cells: ["Loss of half the visual field", "Occipital lobe"] },
            { group: "hindbrain", cells: ["Unsteady gait, overshooting", "Cerebellum"] },
            { group: "deep", cells: ["Enlarging head in a baby", "Ventricles (hydrocephalus)"] },
            { group: "deep", cells: ["Tremor and slow movement", "Midbrain and basal ganglia (Parkinson's)"] },
            { group: "deep", cells: ["Outer vision lost in both eyes", "Optic chiasm (often a pituitary tumour)"] },
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
            { label: "Weight", value: "about 1.3 to 1.4 kg" },
            { label: "Neurons", value: "about 86 billion" },
            { label: "Cortex thickness", value: "about 2 to 4 mm" },
            { label: "Corpus callosum fibres", value: "about 200 million" },
            { label: "Cerebrospinal fluid", value: "about 150 mL in total" },
          ],
        },
        {
          type: "paragraph",
          text:
            "The 3D model is a stylised teaching model. Lobes are coloured to follow the central and lateral sulci, but the folds are generated rather than scanned from a real brain.",
        },
      ],
    },
  },

  practice: {
    validator: "identify",
    title: "Find it",
    prompt: "Find four regions from what they do.",
    params: {
      rounds: [
        { prompt: "Find the lobe that handles vision.", answer: "brain_occipital_lobe" },
        { prompt: "Find the part that coordinates balance and movement.", answer: "brain_cerebellum" },
        { prompt: "Find the lobe that plans and controls voluntary movement.", answer: "brain_frontal_lobe" },
        { prompt: "Find the part of the brainstem that controls breathing and heart rate.", answer: "brain_medulla" },
        { prompt: "Find the part that turns experiences into memories.", answer: "brain_hippocampus" },
      ],
    },
  },
};
