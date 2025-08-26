import { writeVarInt } from "./utility";
import { maybeGetSourceRegister, maybeGetTargetRegister } from "../utility";
import { serializeVmValue } from "./vm-value";
import { isBinary } from "../instructions/binary";
import { isLOADV } from "../instructions/loadv";
import { isSTORE } from "../instructions/store";
import { isLOAD } from "../instructions/load";
import type { Instruction } from "../structs";
import { isJMP } from "../instructions/jmp";
import { isJZ } from "../instructions/jz";
import { isJNZ } from "../instructions/jnz";

export function serializeInstruction(instruction: Instruction): { result: Buffer; bytesWritten: number; } {
  const buffer = Buffer.alloc(20);
  let offset = writeVarInt(buffer, 0, instruction.op);

  const target = maybeGetTargetRegister(instruction);
  const source = maybeGetSourceRegister(instruction);
  if (target !== undefined)
    offset += writeVarInt(buffer, offset, target);
  else if (source !== undefined)
    offset += writeVarInt(buffer, offset, source);

  if (isBinary(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.a);
    offset += writeVarInt(buffer, offset, instruction.b);
  } else if (isLOADV(instruction)) {
    const { result, bytesWritten } = serializeVmValue(instruction.value);
    result.copy(buffer, offset);
    offset += bytesWritten;
  } else if (isSTORE(instruction) || isLOAD(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.name.length);
    offset += buffer.write(instruction.name, offset);
  } else if (isJMP(instruction) || isJZ(instruction) || isJNZ(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.address);
  }

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}