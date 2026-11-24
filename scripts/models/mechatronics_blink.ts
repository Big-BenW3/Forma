/**
 * Scene: mechatronics_blink (Mechatronics, lesson 3: Blink an LED).
 *
 * Uno wired to a breadboard: pin 13 -> resistor -> LED -> ground. The LED
 * dome is a separate mesh named "led_dome" and the onboard LED a separate part,
 * because the adapter lights them from the emulated pin state.
 */
import { SceneBuild } from "./lib/export";
import { buildJumper, buildLed, buildResistor, buildWire, layoutCircuit } from "./lib/electronics";
import { group } from "./lib/geo";

export async function build() {
  const B = new SceneBuild({ sceneId: "mechatronics_blink", view: [0.15, 1.0, 0.75], fit: 3.7, partFitScale: 1.7, fov: 30 });
  B.group("controller", "Controller", "#0e7f8d");
  B.group("circuit", "Circuit", "#e4532b");
  B.group("wiring", "Wiring", "#e0a23a");

  const L = layoutCircuit();
  const add = (o: import("three").Object3D, id: string, name: string, g: string, view: [number, number, number] = [0.2, 1.0, 0.8], fit = 1.8) =>
    B.root.add(B.part(o, { id, name, group: g, view, fit }));

  add(L.unoBoard, "blink_uno", "Arduino Uno", "controller", [0.2, 1.0, 0.9], 2.4);
  add(L.ledL, "blink_led_onboard", "Onboard LED (pin 13)", "controller", [0.2, 1.0, 0.9], 1.1);
  add(L.board, "blink_breadboard", "Breadboard", "circuit", [0.1, 1.0, 0.9], 2.4);
  add(buildResistor(L.hole(8, "i"), L.hole(13, "i")), "blink_resistor", "220 ohm resistor", "circuit", [0.2, 1.0, 0.8], 1.5);
  add(buildLed(L.hole(13, "h"), L.hole(14, "h")), "blink_led", "LED", "circuit", [0.2, 1.0, 0.8], 1.4);
  add(buildWire(L.pin("13"), L.hole(8, "j"), "#f0a020", 0.05), "blink_wire_signal", "Signal wire (pin 13)", "wiring", [0.2, 1.0, 0.8], 1.8);
  add(
    group("g", buildWire(L.pin("GND"), L.hole(2, "-b"), "#1c1f24", 0.12), buildJumper(L.hole(14, "i"), L.hole(6, "-b"), "#1c1f24", 0.07)),
    "blink_wires_ground",
    "Ground wires",
    "wiring",
    [0.2, 1.0, 0.8],
    1.9,
  );
  return B.write("public/models");
}
build().then((r) => console.log(JSON.stringify(r)));
