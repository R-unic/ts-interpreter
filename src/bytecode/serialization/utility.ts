/**
 * Encodes an integer as a varint into the given buffer.
 * @param buffer The buffer to write into.
 * @param offset The starting offset in the buffer.
 * @param value The integer to encode.
 * @returns The amount of bytes written.
 */
export function writeVarInt(
  buffer: Buffer,
  offset: number,
  value: number,
  signed = false
): number {
  if (signed)
    value = zigzagEncode(value);

  // Inline small values (0..=0xF7)
  if (value <= 0xF7) {
    buffer[offset] = value;
    return 1;
  }

  // 1-byte payload
  if (value <= 0xFF) {
    buffer[offset] = 0xF8;
    buffer[offset + 1] = value;
    return 2;
  }

  // 2-byte payload
  if (value <= 0xFFFF) {
    buffer[offset] = 0xFB;
    buffer[offset + 1] = value & 0xFF;
    buffer[offset + 2] = (value >> 8) & 0xFF;
    return 3;
  }

  // 4-byte payload
  buffer[offset] = 0xFA;
  buffer[offset + 1] = value & 0xFF;
  buffer[offset + 2] = (value >> 8) & 0xFF;
  buffer[offset + 3] = (value >> 16) & 0xFF;
  buffer[offset + 4] = (value >> 24) & 0xFF;
  return 5;
}

/**
 * Zigzag-encode a signed 32-bit integer.
 * @param n signed integer
 */
function zigzagEncode(n: number): number {
  return (n << 1) ^ (n >> 31);
}