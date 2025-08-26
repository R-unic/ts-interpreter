import { writeVarInt } from "./utility";
import { serializeVmValue } from "./vm-value";
import { serializeInstruction } from "./instruction";
import type { Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export function serializeProgram(instructions: readonly Instruction[], constants: readonly VmValue[] = []): Buffer {
  const instructionResults = instructions.map(serializeInstruction);
  const constantResults = constants.map(serializeVmValue);
  const instructionBytes = instructionResults.reduce((a, b) => a + b.bytesWritten, 0);
  const constantBytes = constantResults.reduce((a, b) => a + b.bytesWritten, 0);
  const buffer = Buffer.alloc(9 + instructionBytes + constantBytes);

  let offset = 0;
  buffer.writeUInt8(0, offset); // version 0
  offset += 1;

  offset += writeVarInt(buffer, offset, constantResults.length);
  for (const { result, bytesWritten } of constantResults) {
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  offset += writeVarInt(buffer, offset, instructionResults.length);
  for (const { result, bytesWritten } of instructionResults) {
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  return buffer.slice(0, offset);
}