import { writeVarInt } from "./utility";
import { isBinaryInstruction, maybeGetTargetRegister } from "../utility";
import { serializeVmValue } from "./vm-value";
import { isLOADV } from "../loadv";
import type { Instruction } from "../structs";

export function serializeInstruction(instruction: Instruction): { result: Buffer, bytesWritten: number; } {
  const buffer = Buffer.alloc(20);
  let offset = 0;

  const target = maybeGetTargetRegister(instruction);
  offset += writeVarInt(buffer, offset, instruction.op);

  if (target !== undefined)
    offset += writeVarInt(buffer, offset, target);

  if (isBinaryInstruction(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.a);
    offset += writeVarInt(buffer, offset, instruction.b);
  } else if (isLOADV(instruction)) {
    const { result, bytesWritten } = serializeVmValue(instruction.value);
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}