/**
 * ATmega328P emulator core (avr8js), shared by the browser worker and by the
 * server-side validation run. It is deterministic: the same HEX and the same
 * input script always produce the same pin trace, which is what lets the server
 * re-derive a student's evidence instead of trusting the client.
 *
 * Arduino pin numbers map to ports like the Uno does: 0-7 = PORTD bits 0-7,
 * 8-13 = PORTB bits 0-5, A0-A5 (14-19) = PORTC bits 0-5.
 */
import { AVRIOPort, AVRTimer, AVRUSART, CPU, PinState, avrInstruction, portBConfig, portCConfig, portDConfig, timer0Config, timer1Config, timer2Config, usart0Config } from "avr8js";
import { parseHex } from "./hex";

export const CPU_HZ = 16_000_000;

/** One change of an output pin. `t` is simulated milliseconds since reset. */
export interface PinEvent {
  t: number;
  pin: number;
  value: 0 | 1;
}

/** A scripted input: at simulated time `t` (ms), drive `pin` to `value` (button pressed pulls LOW with INPUT_PULLUP). */
export interface InputEvent {
  t: number;
  pin: number;
  value: 0 | 1;
}

const PORTS = { B: { base: 8, n: 6 }, C: { base: 14, n: 6 }, D: { base: 0, n: 8 } } as const;

export class Emulator {
  readonly cpu: CPU;
  private ports: { B: AVRIOPort; C: AVRIOPort; D: AVRIOPort };
  private usart: AVRUSART;
  /** Last known driven level of every pin we report on; -1 = never reported (input / not driven yet) */
  private last = new Map<number, number>();
  events: PinEvent[] = [];
  serial = "";
  private onEvent?: (e: PinEvent) => void;

  constructor(hex: string, onEvent?: (e: PinEvent) => void) {
    this.onEvent = onEvent;
    this.cpu = new CPU(parseHex(hex));
    new AVRTimer(this.cpu, timer0Config);
    new AVRTimer(this.cpu, timer1Config);
    new AVRTimer(this.cpu, timer2Config);
    this.ports = { B: new AVRIOPort(this.cpu, portBConfig), C: new AVRIOPort(this.cpu, portCConfig), D: new AVRIOPort(this.cpu, portDConfig) };
    this.usart = new AVRUSART(this.cpu, usart0Config, CPU_HZ);
    this.usart.onByteTransmit = (b) => {
      if (this.serial.length < 4000) this.serial += String.fromCharCode(b);
    };
    for (const key of ["B", "C", "D"] as const) {
      const { base, n } = PORTS[key];
      // avr8js does not model the internal pull-up: an undriven input reads LOW. Every Uno input in these
      // lessons is a button to ground read with INPUT_PULLUP, so an unpressed button must read HIGH.
      for (let i = 0; i < n; i++) this.ports[key].setPin(i, true);
      this.ports[key].addListener(() => {
        for (let i = 0; i < n; i++) this.sample(this.ports[key], base + i, i);
      });
    }
  }

  /** Records a change if this pin is now an output at a different level than last reported. */
  private sample(port: AVRIOPort, pin: number, bit: number) {
    const s = port.pinState(bit);
    // Inputs (with or without pull-up) are not "driven": report them as undefined so a pull-up is not mistaken for a HIGH output.
    const level = s === PinState.High ? 1 : s === PinState.Low ? 0 : -1;
    if (level < 0 || this.last.get(pin) === level) return;
    this.last.set(pin, level);
    const e: PinEvent = { t: this.timeMs, pin, value: level as 0 | 1 };
    this.events.push(e);
    this.onEvent?.(e);
  }

  get timeMs() {
    return (this.cpu.cycles / CPU_HZ) * 1000;
  }

  /** Drives an input pin from outside (a button). */
  setInput(pin: number, value: 0 | 1) {
    for (const key of ["B", "C", "D"] as const) {
      const { base, n } = PORTS[key];
      if (pin >= base && pin < base + n) this.ports[key].setPin(pin - base, value === 1);
    }
  }

  /** Runs the CPU until simulated time reaches `untilMs`. */
  runTo(untilMs: number) {
    const target = Math.floor((untilMs / 1000) * CPU_HZ);
    const cpu = this.cpu;
    while (cpu.cycles < target) {
      avrInstruction(cpu);
      cpu.tick();
    }
  }
}

export interface RunOptions {
  /** Simulated milliseconds to run */
  durationMs: number;
  /** Scripted inputs, applied at their times */
  inputs?: InputEvent[];
}

export interface RunResult {
  events: PinEvent[];
  serial: string;
}

/** Batch run used by validators and the server: deterministic, no wall clock. */
export function runEmulation(hex: string, opts: RunOptions): RunResult {
  const emu = new Emulator(hex);
  const inputs = [...(opts.inputs ?? [])].sort((a, b) => a.t - b.t);
  // Step in 1 ms slices so input changes land at the right simulated time.
  let ms = 0;
  let next = 0;
  while (ms < opts.durationMs) {
    while (next < inputs.length && inputs[next].t <= ms) {
      emu.setInput(inputs[next].pin, inputs[next].value);
      next++;
    }
    ms = Math.min(ms + 1, opts.durationMs);
    emu.runTo(ms);
  }
  return { events: emu.events, serial: emu.serial };
}
