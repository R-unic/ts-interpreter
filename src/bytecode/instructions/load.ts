import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionLOAD extends Instruction {
  readonly op: InstructionOp.LOAD;
  readonly target: number;
  readonly name: string;
}

export function LOAD(target: number, name: string): InstructionLOAD {
  return instruction(InstructionOp.LOAD, { target, name });
}

export function isLOAD(instruction: Instruction): instruction is InstructionLOAD {
  return instruction.op === InstructionOp.LOAD;
}