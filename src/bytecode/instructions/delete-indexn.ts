import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionDELETE_INDEXN extends Instruction {
  readonly op: InstructionOp.DELETE_INDEXN;
  readonly object: number;
  readonly index: number;
}

export function DELETE_INDEXN(object: number, index: number): InstructionDELETE_INDEXN {
  return instruction(InstructionOp.DELETE_INDEXN, { object, index });
}

export function isDELETE_INDEXN(instruction: Instruction): instruction is InstructionDELETE_INDEXN {
  return instruction.op === InstructionOp.DELETE_INDEXN;
}