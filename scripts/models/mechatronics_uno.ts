/**
 * Scene: mechatronics_uno (Mechatronics, lesson 1: Meet the board).
 *
 * An Arduino Uno R3 lying flat, split into the parts a beginner should be able
 * to name: the microcontroller, crystal, USB chip, reset button, the power
 * parts, the three header groups and the pin-13 LED. Dimensions follow the
 * published board drawing; small components are drawn recognisably.
 */
import { SceneBuild } from "./lib/export";
import { buildUno } from "./lib/electronics";

export async function build() {
  const B = new SceneBuild({ sceneId: "mechatronics_uno", view: [0.2, 1.0, 0.8], fit: 4.2, partFitScale: 1.5, fov: 30 });
  B.group("board", "Board", "#0e7f8d");
  B.group("power", "Power", "#e0a23a");
  B.group("brain", "Control", "#e4532b");
  B.group("io", "Pins and lights", "#2f9a6a");

  const u = buildUno();
  const P = u.parts;
  const add = (o: import("three").Object3D, id: string, name: string, group: string, view: [number, number, number] = [0.15, 1.0, 0.7], fit = 1.9, anchor?: [number, number, number]) =>
    B.root.add(B.part(o, { id, name, group, view, fit, ...(anchor ? { anchor } : {}) }));

  add(P.pcb, "uno_pcb", "Circuit board", "board", [0.2, 1.0, 0.8], 2.6, [-0.3, 0.02, 0.2]);
  add(P.usb, "uno_usb", "USB connector", "power", [-0.9, 0.7, 0.5]);
  add(P.barrel, "uno_barrel", "Power jack", "power", [-0.9, 0.7, 0.2]);
  add(P.regulator, "uno_regulator", "Voltage regulator", "power", [0.1, 1.0, 0.6], 1.7);
  add(P.power, "uno_power_header", "Power header", "power", [0.0, 0.9, 1.0], 1.9);
  add(P.mcu, "uno_mcu", "ATmega328P", "brain", [0.1, 1.0, 0.7], 2.1);
  add(P.crystal, "uno_crystal", "16 MHz crystal", "brain", [0.1, 1.0, 0.7], 1.5);
  add(P.usbchip, "uno_usb_chip", "USB-to-serial chip", "brain", [0.1, 1.0, 0.7], 1.5);
  add(P.reset, "uno_reset", "Reset button", "brain", [0.1, 1.0, 0.7], 1.5);
  add(P.digital, "uno_digital_header", "Digital pin header", "io", [0.0, 0.9, -1.0], 2.0);
  add(P.analog, "uno_analog_header", "Analog pin header", "io", [0.0, 0.9, 1.0], 1.9);
  add(P.icsp, "uno_icsp", "ICSP header", "io", [0.9, 0.9, 0.3], 1.5);
  add(P.ledL, "uno_led_l", "Pin 13 LED", "io", [0.1, 1.0, 0.7], 1.2);

  return B.write("public/models");
}
build().then((r) => console.log(JSON.stringify(r)));
