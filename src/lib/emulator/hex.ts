/**
 * Intel HEX -> AVR program memory. arduino-cli emits HEX; avr8js wants 16-bit
 * words. Pure and defensive: the HEX can come from the compile service, so any
 * malformed record is an error rather than a silent skip.
 */
export function parseHex(hex: string, flashBytes = 32768): Uint16Array {
  const bytes = new Uint8Array(flashBytes).fill(0xff);
  let upper = 0;
  for (const raw of hex.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line[0] !== ":") throw new Error("Bad HEX: a line does not start with ':'");
    const len = parseInt(line.slice(1, 3), 16);
    const addr = parseInt(line.slice(3, 7), 16);
    const type = parseInt(line.slice(7, 9), 16);
    if (!Number.isFinite(len) || line.length < 11 + len * 2) throw new Error("Bad HEX: short record");
    // Checksum: all bytes of the record sum to 0 mod 256.
    let sum = 0;
    for (let i = 1; i + 1 < line.length; i += 2) sum += parseInt(line.slice(i, i + 2), 16);
    if ((sum & 0xff) !== 0) throw new Error("Bad HEX: checksum mismatch");
    if (type === 0) {
      for (let i = 0; i < len; i++) {
        const at = upper + addr + i;
        if (at >= flashBytes) throw new Error("Bad HEX: address beyond flash");
        bytes[at] = parseInt(line.slice(9 + i * 2, 11 + i * 2), 16);
      }
    } else if (type === 1) break;
    else if (type === 2) upper = parseInt(line.slice(9, 13), 16) << 4;
    else if (type === 4) upper = parseInt(line.slice(9, 13), 16) << 16;
  }
  const words = new Uint16Array(flashBytes / 2);
  for (let i = 0; i < words.length; i++) words[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
  return words;
}
