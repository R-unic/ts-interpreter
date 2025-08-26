/**
 * Decodes a varint from the given buffer.
 * @param buffer The Buffer to read from.
 * @param offset The starting offset in the buffer.
 * @returns An object with { value, bytesRead }.
 */
export function readVarInt(
  buffer: Buffer,
  offset: number,
  signed = false
): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  const start = offset;
  let byte: number;

  do {
    byte = buffer[offset++]!;
    result |= (byte & 0x7F) << shift;
    shift += 7;

    if (shift > 35)
      throw new Error("VarInt too big");
  } while (byte & 0x80);

  if (signed)
    result = zigzagDecode(result);

  return { value: result >>> 0, bytesRead: offset - start };
}

/**
 * Zigzag-decode a signed 32-bit integer.
 * @param n encoded unsigned integer
 */
function zigzagDecode(n: number): number {
  return (n >>> 1) ^ -(n & 1);
}