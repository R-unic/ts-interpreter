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
import { isINC } from "../instructions/inc";
import { isDEC } from "../instructions/dec";
import { isSTOREK } from "../instructions/storek";
import { isPRINTK } from "../instructions/printk";
import { VmValueKind, type VmValue } from "../vm-value";
import type { Instruction } from "../structs";

function getBytesOccupiedByStrings(instruction: Instruction): number {
  let stringBytes = 0;
  for (const value of Object.values(instruction)) {
    let s: string | undefined;
    if (typeof value === "string")
      s = value;
    else if (typeof value === "object"
      && "kind" in value
      && "value" in value
      && value.kind === VmValueKind.String
      && typeof value.value === "string") {
      s = value.value;
    }

    if (s === undefined) continue;
    stringBytes += Buffer.byteLength(s, "utf8");
  }

  return stringBytes;
}

export function serializeInstruction(instruction: Instruction): { result: Buffer; bytesWritten: number; } {
  const stringBytes = getBytesOccupiedByStrings(instruction);
  const buffer = Buffer.alloc(20 + stringBytes);
  let offset = writeVarInt(buffer, 0, instruction.op);

  function writeVmValue(value: VmValue): void {
    const { result, bytesWritten } = serializeVmValue(value);
    result.copy(buffer, offset);
    offset += bytesWritten;
  }

  function writeOptionalInt(value: number | undefined): void {
    buffer.writeUInt8(value !== undefined ? 1 : 0, offset);
    offset += 1;
    if (value !== undefined)
      offset += writeVarInt(buffer, offset, value);
  }

  const target = maybeGetTargetRegister(instruction);
  const isIncrementor = isINC(instruction) || isDEC(instruction);
  if (isIncrementor) {
    writeOptionalInt(target);
  } else {
    const source = maybeGetSourceRegister(instruction);
    if (target !== undefined)
      offset += writeVarInt(buffer, offset, target);
    if (source !== undefined)
      offset += writeVarInt(buffer, offset, source);
  }

  if (isBinary(instruction)) {
    offset += writeVarInt(buffer, offset, instruction.a);
    offset += writeVarInt(buffer, offset, instruction.b);
  } else if (isLOADV(instruction) || isARRAY_PUSHK(instruction) || isPRINTK(instruction))
    writeVmValue(instruction.value);
  else if (isSTORE(instruction) || isSTOREK(instruction) || isLOAD(instruction) || isIncrementor) {
    offset += writeVarInt(buffer, offset, instruction.name.length);
    offset += buffer.write(instruction.name, offset);
    if (isIncrementor) {
      buffer.writeUInt8(instruction.returnsOld ? 1 : 0, offset);
      offset += 1;
    } else if (isSTOREK(instruction)) {
      writeVmValue(instruction.value);
    }
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