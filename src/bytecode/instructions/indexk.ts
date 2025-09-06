import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionINDEXK extends Instruction {
  readonly op: InstructionOp.INDEXK;
  readonly target: number;
  readonly object: number;
  readonly index: number;
}

export function INDEXK(target: number, object: number, index: number): InstructionINDEXK {
  return instruction(InstructionOp.INDEXK, { target, object, index });
}

export function isINDEXK(instruction: Instruction): instruction is InstructionINDEXK {
  return instruction.op === InstructionOp.INDEXK;
}