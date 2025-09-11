import { instruction } from "../utility";
import { InstructionOp, type BinaryJumpInstruction, type Instruction } from "../structs";

export function binaryJumpInstruction<T extends InstructionOp>(op: T, a: number, b: number, address: number): BinaryJumpInstruction<T> {
  return instruction(op, { a, b, address });
}

export function isBinaryJump(instruction: Instruction): instruction is BinaryJumpInstruction {
  return instruction !== undefined
    && "op" in instruction
    && "a" in instruction
    && "b" in instruction
    && "address" in instruction
    && typeof instruction.op === "number"
    && typeof instruction.a === "number"
    && typeof instruction.b === "number"
    && typeof instruction.address === "number";
}