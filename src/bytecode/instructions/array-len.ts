import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionLEN extends Instruction {
  readonly op: InstructionOp.LEN;
  readonly target: number;
  readonly source: number;
}

export function LEN(target: number, source: number): InstructionLEN {
  return instruction(InstructionOp.LEN, { target, source });
}

export function isLEN(instruction: Instruction): instruction is InstructionLEN {
  return instruction.op === InstructionOp.LEN;
}