#!/bin/sh
# Test stub that behaves like `arduino-cli compile`: reads the sketch, then
#   - sketch containing "SLEEP"  -> hangs (to test the timeout)
#   - sketch containing "BROKEN" -> prints a gcc-style error and exits 1
#   - otherwise                  -> writes sketch.ino.hex from the blink fixture
#                                (or the button fixture if the sketch calls digitalRead)
OUT=""; SK=""
while [ $# -gt 0 ]; do
  case "$1" in
    --output-dir) OUT="$2"; shift 2;;
    compile|--fqbn|--build-path|--warnings) shift; [ "$1" != "" ] && case "$1" in -*) ;; *) shift;; esac;;
    --no-color) shift;;
    *) SK="$1"; shift;;
  esac
done
SRC=$(cat "$SK/sketch.ino")
case "$SRC" in
  *SLEEP*) sleep 30;;
  *BROKEN*) echo "$SK/sketch.ino:3:5: error: 'foo' was not declared in this scope" >&2; echo "/usr/share/arduino/hardware/avr/cores/arduino/Arduino.h:1:1: note: secret path" >&2; exit 1;;
esac
mkdir -p "$OUT"
# Lesson 4 sketches read the button; everything else gets the blink program.
FIX=blink
case "$SRC" in *digitalRead*) FIX=button;; esac
cp "$(dirname "$0")/../../lib/emulator/fixtures/$FIX.hex" "$OUT/sketch.ino.hex"
