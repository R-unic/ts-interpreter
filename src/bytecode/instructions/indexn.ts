import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionINDEXN extends Instruction {
  readonly op: InstructionOp.INDEXN;
  readonly target: number;
  readonly object: number;
  readonly index: number;
}

export function INDEXN(target: number, object: number, index: number): InstructionINDEXN {
  return instruction(InstructionOp.INDEXN, { target, object, index });
}

export function isINDEXN(instruction: Instruction): instruction is InstructionINDEXN {
  return instruction.op === InstructionOp.INDEXN;
}