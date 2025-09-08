import { writeVarInt } from "./utility";
import { maybeGetSourceRegister, maybeGetTargetRegister } from "../utility";
import { serializeVmValue } from "./vm-value";
import { isBinary } from "../instructions/binary";
import { isLOADV } from "../instructions/loadv";
import { isSTORE } from "../instructions/store";
import { isLOAD } from "../instructions/load";
import { isJMP } from "../instructions/jmp";
import { isJZ } from "../instructions/jz";
import { isJNZ } from "../instructions/jnz";
import { isCALL } from "../instructions/call";
import { isARRAY_PUSHK } from "../instructions/array-pushk";
import { isINDEX } from "../instructions";
import { isINDEXN } from "../instructions/indexn";
import { isINDEXK } from "../instructions/indexk";
import { isSTORE_INDEX } from "../instructions/store-index";
import { isSTORE_INDEXN } from "../instructions/store-indexn";
import { isSTORE_INDEXK } from "../instructions/store-indexk";
import { isDELETE_INDEX } from "../instructions/delete-index";
import { isDELETE_INDEXN } from "../instructions/delete-indexn";
import { isDELETE_INDEXK } from "../instructions/delete-indexk";
import type { Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export function serializeInstruction(instruction: Instruction): { result: Buffer; bytesWritten: number; } {
  const buffer = Buffer.alloc(20);
  let offset = writeVarInt(buffer, 0, instruction.op);

  function writeVmValue(value: VmValue): void {
    const { result, bytesWritten } = serializeVmValue(value);
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  const target = maybeGetTargetRegister(instruction);
  const source = maybeGetSourceRegister(instruction);
  if (target !== undefined)
    offset += writeVarInt(buffer, offset, target);
  if (source !== undefined)
    offset += writeVarInt(buffer, offset, source);

  if (isBinary(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.a);
    offset += writeVarInt(buffer, offset, instruction.b);
  } else if (isLOADV(instruction) || isARRAY_PUSHK(instruction))
    writeVmValue(instruction.value);
  else if (isSTORE(instruction) || isLOAD(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.name.length);
    offset += buffer.write(instruction.name, offset);
  } else if (isJMP(instruction) || isJZ(instruction) || isJNZ(instruction) || isCALL(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.address);
  } else if (
    isINDEX(instruction)
    || isINDEXN(instruction)
    || isINDEXK(instruction)
    || isSTORE_INDEX(instruction)
    || isSTORE_INDEXN(instruction)
    || isSTORE_INDEXK(instruction)
    || isDELETE_INDEX(instruction)
    || isDELETE_INDEXN(instruction)
    || isDELETE_INDEXK(instruction)
  ) {
    offset += writeVarInt(buffer, offset, instruction.object);
    if (typeof instruction.index === "number")
      offset += writeVarInt(buffer, offset, instruction.index);
    else
      writeVmValue(instruction.index);
  }

  if ("operand" in instruction && typeof instruction.operand === "number")
    offset += writeVarInt(buffer, offset, instruction.operand);

  return { result: buffer.slice(0, offset), bytesWritten: offset };
}