import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionPRINT extends Instruction {
  readonly op: InstructionOp.PRINT;
  readonly source: number;
}

export function PRINT(source: number): InstructionPRINT {
  return instruction(InstructionOp.PRINT, { source });
}

export function isPRINT(instruction: Instruction): instruction is InstructionPRINT {
  return instruction.op === InstructionOp.PRINT;
}