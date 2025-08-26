import { writeVarInt } from "./utility";
import { maybeGetTargetRegister } from "../utility";
import { serializeVmValue } from "./vm-value";
import { isBinary } from "../instructions/binary";
import { isLOADV } from "../instructions/loadv";
import { isSTORE } from "../instructions/store";
import { isLOAD } from "../instructions/load";
import type { Instruction } from "../structs";

export function serializeInstruction(instruction: Instruction): { result: Buffer, bytesWritten: number; } {
  const buffer = Buffer.alloc(20);
  let offset = 0;

  const target = maybeGetTargetRegister(instruction);
  offset += writeVarInt(buffer, offset, instruction.op);

  if (target !== undefined)
    offset += writeVarInt(buffer, offset, target);

  if (isBinary(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.a);
    offset += writeVarInt(buffer, offset, instruction.b);
  } else if (isLOADV(instruction)) {
    const { result, bytesWritten } = serializeVmValue(instruction.value);
    result.copy(buffer, offset);
    offset += bytesWritten;
  } else if (isSTORE(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.source);
    offset += writeVarInt(buffer, offset, instruction.name.length);
    offset += buffer.write(instruction.name, offset);
  } else if (isLOAD(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.name.length);
    offset += buffer.write(instruction.name, offset);
  }

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}