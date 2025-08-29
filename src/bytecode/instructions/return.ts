import { InstructionOp, type Instruction } from "../structs";
import { instruction } from "../utility";

export interface InstructionRETURN extends Instruction {
  readonly op: InstructionOp.RETURN;
}

export const RETURN: InstructionRETURN = instruction(InstructionOp.RETURN, {});

export function isRETURN(instruction: Instruction): instruction is InstructionRETURN {
  return instruction.op === InstructionOp.RETURN;
}