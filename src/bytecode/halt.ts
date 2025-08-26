import { InstructionOp, type Instruction } from "./structs";

export interface InstructionHALT extends Instruction {
  readonly op: InstructionOp.HALT;
}

export const HALT: InstructionHALT = { op: InstructionOp.HALT };

export function isHALT(instruction: Instruction): instruction is InstructionHALT {
  return instruction.op === InstructionOp.HALT;
}