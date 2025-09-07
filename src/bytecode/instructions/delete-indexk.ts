import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionDELETE_INDEXK extends Instruction {
  readonly op: InstructionOp.DELETE_INDEXK;
  readonly object: number;
  readonly index: number;
}

export function DELETE_INDEXK(object: number, index: number): InstructionDELETE_INDEXK {
  return instruction(InstructionOp.DELETE_INDEXK, { object, index });
}

export function isDELETE_INDEXK(instruction: Instruction): instruction is InstructionDELETE_INDEXK {
  return instruction.op === InstructionOp.DELETE_INDEXK;
}