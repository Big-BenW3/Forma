/**
 * Scene: mechatronics_button (Mechatronics, lesson 4: Push a button).
 *
 * Same Uno and breadboard, with a tactile switch across the centre channel wired
 * between pin 2 and ground. The pin uses the Uno's internal pull-up, so pressing
 * the button pulls pin 2 LOW. The cap is a separate mesh ("switch_cap") that the
 * adapter pushes down when the button is pressed.
 */
import { SceneBuild } from "./lib/export";
import { BB_TOP, buildJumper, buildLed, buildResistor, buildSwitch, buildWire, layoutCircuit } from "./lib/electronics";
import { group } from "./lib/geo";

export async function build() {
  const B = new SceneBuild({ sceneId: "mechatronics_button", view: [0.15, 1.0, 0.75], fit: 3.7, partFitScale: 1.7, fov: 30 });
  B.group("controller", "Controller", "#0e7f8d");
  B.group("circuit", "Circuit", "#e4532b");
  B.group("wiring", "Wiring", "#e0a23a");

  const L = layoutCircuit();
  const add = (o: import("three").Object3D, id: string, name: string, g: string, view: [number, number, number] = [0.2, 1.0, 0.8], fit = 1.8) =>
    B.root.add(B.part(o, { id, name, group: g, view, fit }));

  add(L.unoBoard, "btn_uno", "Arduino Uno", "controller", [0.2, 1.0, 0.9], 2.4);
  add(L.ledL, "btn_led_onboard", "Onboard LED (pin 13)", "controller", [0.2, 1.0, 0.9], 1.1);
  add(L.board, "btn_breadboard", "Breadboard", "circuit", [0.1, 1.0, 0.9], 2.4);
  add(buildResistor(L.hole(8, "i"), L.hole(13, "i")), "btn_resistor", "220 ohm resistor", "circuit", [0.2, 1.0, 0.8], 1.5);
  add(buildLed(L.hole(13, "h"), L.hole(14, "h")), "btn_led", "LED", "circuit", [0.2, 1.0, 0.8], 1.4);
  const cx = L.hole(20, "f").x;
  add(buildSwitch(cx, 0, BB_TOP), "btn_switch", "Push button", "circuit", [0.2, 1.0, 0.8], 1.3);
  add(buildWire(L.pin("13"), L.hole(8, "j"), "#f0a020", 0.05), "btn_wire_signal", "LED signal wire (pin 13)", "wiring", [0.2, 1.0, 0.8], 1.8);
  add(buildWire(L.pin("2"), L.hole(19, "j"), "#3b82f6", 0.05), "btn_wire_input", "Button input wire (pin 2)", "wiring", [0.2, 1.0, 0.8], 1.8);
  add(
    group(
      "g",
      buildWire(L.pin("GND"), L.hole(2, "-b"), "#1c1f24", 0.12),
      buildJumper(L.hole(14, "i"), L.hole(6, "-b"), "#1c1f24", 0.07),
      buildJumper(L.hole(21, "d"), L.hole(12, "-t"), "#1c1f24", 0.07),
      buildJumper(L.hole(25, "-t"), L.hole(25, "-b"), "#1c1f24", 0.2),
    ),
    "btn_wires_ground",
    "Ground wires",
    "wiring",
    [0.2, 1.0, 0.8],
    2.2,
  );
  return B.write("public/models");
}
build().then((r) => console.log(JSON.stringify(r)));
