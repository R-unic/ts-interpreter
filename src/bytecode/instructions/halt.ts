import { InstructionOp, type Instruction } from "../structs";
import { instruction } from "../utility";

export interface InstructionHALT extends Instruction {
  readonly op: InstructionOp.HALT;
}

export const HALT: InstructionHALT = instruction(InstructionOp.HALT, {});

export function isHALT(instruction: Instruction): instruction is InstructionHALT {
  return instruction.op === InstructionOp.HALT;
}