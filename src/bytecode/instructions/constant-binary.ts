import { instruction, maybeGetTargetRegister } from "../utility";
import { InstructionOp, type ConstantBinaryInstruction, type Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export function constantBinaryInstruction<T extends InstructionOp>(op: T, target: number, aValue: VmValue, b: number): ConstantBinaryInstruction<T> {
  return instruction(op, { target, aValue, b });
}

export function isConstantBinary(instruction: Instruction): instruction is ConstantBinaryInstruction {
  return instruction !== undefined
    && maybeGetTargetRegister(instruction) !== undefined
    && "op" in instruction
    && "aValue" in instruction
    && "b" in instruction
    && typeof instruction.op === "number"
    && typeof instruction.aValue === "object"
    && typeof instruction.b === "number";
}