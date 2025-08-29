import { writeVarInt } from "./utility";
import { type VmValue, VmValueKind } from "../vm-value";

export function serializeVmValue({ value, kind }: VmValue): { result: Buffer; bytesWritten: number; } {
  let size = 8;
  if (kind === VmValueKind.String) {
    const length = (value as string).length;
    size += 4 + length;
  } else if (kind === VmValueKind.Float) {
    size += 4;
  }

  const buffer = Buffer.alloc(size);
  let offset = writeVarInt(buffer, 0, kind);

  if (kind === VmValueKind.Float) {
    buffer.writeDoubleLE(value as number, offset);
    offset += 8;
  } else if (kind === VmValueKind.Int) {
    offset += writeVarInt(buffer, offset, value as number, true);
  } else if (kind === VmValueKind.Boolean) {
    buffer.writeUInt8(value ? 1 : 0, offset);
    offset += 1;
  } else if (kind === VmValueKind.String) {
    const length = (value as string).length;
    offset += writeVarInt(buffer, offset, length);
    offset += buffer.write(value as string, offset);
  } else if (kind === VmValueKind.Null) {
    // serialize nothing for null
  } else {
    throw new Error(`Unsupported serialized VM value kind: ${kind}`);
  }

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}
