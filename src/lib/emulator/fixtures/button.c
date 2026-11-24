// Fixture: INPUT_PULLUP on pin 2 (PD2); LED on pin 13 (PB5) is ON while the button is pressed (pin LOW).
#define F_CPU 16000000UL
#include <avr/io.h>
int main(void) {
  DDRB |= _BV(PB5);
  DDRD &= ~_BV(PD2);
  PORTD |= _BV(PD2);
  for (;;) {
    if (PIND & _BV(PD2)) PORTB &= ~_BV(PB5); else PORTB |= _BV(PB5);
  }
}
