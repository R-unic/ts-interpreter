import { instruction, maybeGetTargetRegister } from "../utility";
import { InstructionOp, type BinaryInstruction, type Instruction } from "../structs";

export function binaryInstruction<T extends InstructionOp>(op: T, target: number, a: number, b: number): BinaryInstruction<T> {
  return instruction(op, { target, a, b });
}

export function isBinary(instruction: Instruction): instruction is BinaryInstruction {
  return instruction !== undefined
    && maybeGetTargetRegister(instruction) !== undefined
    && "op" in instruction
    && "a" in instruction
    && "b" in instruction
    && typeof instruction.op === "number"
    && typeof instruction.a === "number"
    && typeof instruction.b === "number";
}