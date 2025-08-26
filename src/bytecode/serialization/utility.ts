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

  if (value < 0xFF) { // single byte opt
    buffer[offset++] = value;
    return 1;
  }

  // fallback for larger values
  let start = offset;
  do {
    buffer[offset++] = value & 0xFF;
    value >>>= 8;
  } while (value !== 0);

  return offset - start;
}

/**
 * Zigzag-encode a signed 32-bit integer.
 * @param n signed integer
 */
function zigzagEncode(n: number): number {
  return (n << 1) ^ (n >> 31);
}