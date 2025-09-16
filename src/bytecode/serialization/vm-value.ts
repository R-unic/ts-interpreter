import { writeVarInt } from "./utility";
import { type VmValue, VmValueKind } from "../vm-value";

export function serializeVmValue({ value, kind }: VmValue): { result: Buffer; bytesWritten: number; } {
  let size = 16;
  if (kind === VmValueKind.String) {
    const s = value as string;
    const byteLen = Buffer.byteLength(s, "utf8");
    size += byteLen + 1;
  } else if (kind === VmValueKind.DynamicArray)
    size += (value as unknown[]).length ** 2;
  else if (kind === VmValueKind.Object) {
    const map = value as Map<unknown, unknown>;
    size += map.size ** 2;
  }

  const buffer = Buffer.alloc(size);
  let offset = writeVarInt(buffer, 0, kind);

  function writeVmValue(element: VmValue): void {
    const { result, bytesWritten } = serializeVmValue(element);
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  if (kind === VmValueKind.Float) {
    buffer.writeDoubleLE(value as number, offset);
    offset += 8;
  } else if (kind === VmValueKind.Int) {
    offset += writeVarInt(buffer, offset, value as number, true);
  } else if (kind === VmValueKind.Boolean) {
    buffer.writeUInt8(value ? 1 : 0, offset);
    offset += 1;
  } else if (kind === VmValueKind.String) {
    const s = value as string;
    const byteLen = Buffer.byteLength(s, "utf8");
    offset += writeVarInt(buffer, offset, byteLen);
    buffer.write(s, offset, "utf8");
    offset += byteLen;
  } else if (kind === VmValueKind.DynamicArray) {
    const arr = value as VmValue[];
    offset += writeVarInt(buffer, offset, arr.length);

    for (const element of arr)
      writeVmValue(element);
  } else if (kind === VmValueKind.Object) {
    const map = value as Map<VmValue, VmValue>;
    offset += writeVarInt(buffer, offset, map.size);

    for (const [key, value] of map) {
      writeVmValue(key);
      writeVmValue(value);
    }
  } else if (kind === VmValueKind.Null) {
    // serialize nothing for null
  } else {
    throw new Error(`Unsupported serialized VM value kind: ${kind}`);
  }

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}
