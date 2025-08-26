import { InstructionOp, type Instruction } from "../structs";

export interface InstructionPRINT extends Instruction {
  readonly op: InstructionOp.PRINT;
  readonly target: number;
}

export function PRINT(target: number): InstructionPRINT {
  return {
    op: InstructionOp.PRINT,
    target
  };
}

export function isPRINT(instruction: Instruction): instruction is InstructionPRINT {
  return instruction.op === InstructionOp.PRINT;
}