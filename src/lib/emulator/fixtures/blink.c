// Fixture: blink PB5 (Arduino pin 13) every 500 ms. Plain avr-libc, no Arduino core.
#define F_CPU 16000000UL
#include <avr/io.h>
#include <util/delay.h>
int main(void) {
  DDRB |= _BV(PB5);
  for (;;) {
    PORTB |= _BV(PB5);  _delay_ms(500);
    PORTB &= ~_BV(PB5); _delay_ms(500);
  }
}
