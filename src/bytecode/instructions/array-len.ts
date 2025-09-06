import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionARRAY_LEN extends Instruction {
  readonly op: InstructionOp.ARRAY_LEN;
  readonly target: number;
  readonly source: number;
}

export function ARRAY_LEN(target: number, source: number): InstructionARRAY_LEN {
  return instruction(InstructionOp.ARRAY_LEN, { target, source });
}

export function isARRAY_LEN(instruction: Instruction): instruction is InstructionARRAY_LEN {
  return instruction.op === InstructionOp.ARRAY_LEN;
}