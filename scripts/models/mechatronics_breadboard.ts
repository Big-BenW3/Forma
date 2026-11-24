/**
 * Scene: mechatronics_breadboard (Mechatronics, lesson 2: The breadboard).
 *
 * A half-size breadboard with one finished circuit on it (5 V rail -> wire ->
 * resistor -> LED -> wire -> ground rail), so every claim in the lesson can be
 * pointed at. Two layers: the plastic cover (peel it) and the metal clips under
 * it that join each column of five holes. The components' legs run down into
 * the clip layer, so peeling shows exactly what each leg touches.
 */
import { SceneBuild } from "./lib/export";
import { BB_TOP, bbHole, buildBreadboard, buildJumper, buildLed, buildResistor } from "./lib/electronics";

export async function build() {
  const B = new SceneBuild({ sceneId: "mechatronics_breadboard", view: [0.15, 1.0, 0.85], fit: 4.6, partFitScale: 1.6, fov: 30 });
  B.group("plastic", "Plastic and holes", "#b8a46a");
  B.group("metal", "Metal inside", "#7f8896");
  B.group("parts", "Components", "#e4532b");
  B.layer("plastic", "Plastic cover");
  B.layer("clips", "Metal clips");

  const bb = buildBreadboard();
  const add = (o: import("three").Object3D, id: string, name: string, group: string, layer: string, view: [number, number, number] = [0.1, 1.0, 0.7], fit = 2.2, extra: object = {}) =>
    B.root.add(B.part(o, { id, name, group, layer, view, fit, ...extra }));

  add(bb.body, "bb_body", "Plastic body", "plastic", "plastic", [0.3, 1.0, 0.9], 3.0, { anchor: [-0.36, BB_TOP, 0.18] });
  add(bb.stripsTop, "bb_strips_top", "Terminal strips a to e", "plastic", "plastic", [0, 1.0, 0.55], 2.4);
  add(bb.stripsBottom, "bb_strips_bottom", "Terminal strips f to j", "plastic", "plastic", [0, 1.0, 0.55], 2.4);
  add(bb.rails, "bb_rails", "Power rails", "plastic", "plastic", [0, 1.0, 0.7], 3.0, { anchor: [0.32, BB_TOP, -0.2286] });
  add(bb.channel, "bb_channel", "Centre channel", "plastic", "plastic", [0, 1.0, 0.8], 2.8);
  add(bb.base, "bb_base", "Base", "metal", "clips", [0.3, 0.6, 1.0], 3.0, { decor: true });
  add(bb.clips, "bb_clips", "Metal clips", "metal", "clips", [0, 1.0, 0.6], 2.6, { anchor: [-0.25, 0.062, -0.0889] });

  // One finished circuit: + rail -> wire -> col 8 -> resistor -> col 13 -> LED -> col 14 -> wire -> - rail
  const w1 = buildJumper(bbHole(3, "+t"), bbHole(8, "a"), "#d8332b");
  const r1 = buildResistor(bbHole(8, "b"), bbHole(13, "b"));
  const led = buildLed(bbHole(13, "c"), bbHole(14, "c"));
  const w2 = buildJumper(bbHole(14, "d"), bbHole(6, "-t"), "#1c1f24");
  add(w1, "bb_wire_power", "Power wire", "parts", "clips", [0.2, 1.0, 0.8], 1.9);
  add(r1, "bb_resistor", "Resistor", "parts", "clips", [0.2, 1.0, 0.8], 1.7);
  add(led, "bb_led", "LED", "parts", "clips", [0.2, 1.0, 0.8], 1.7);
  add(w2, "bb_wire_ground", "Ground wire", "parts", "clips", [0.2, 1.0, 0.8], 1.9);

  return B.write("public/models");
}
build().then((r) => console.log(JSON.stringify(r)));
