import { instruction, maybeGetTargetRegister } from "../utility";
import { InstructionOp, type UnaryInstruction, type Instruction } from "../structs";

export function unaryInstruction<T extends InstructionOp>(op: T, target: number, operand: number): UnaryInstruction<T> {
  return instruction(op, { target, operand });
}

export function isUnary(instruction: Instruction): instruction is UnaryInstruction {
  return instruction !== undefined
    && maybeGetTargetRegister(instruction) !== undefined
    && "op" in instruction
    && "operand" in instruction
    && typeof instruction.op === "number"
    && typeof instruction.operand === "number"
}