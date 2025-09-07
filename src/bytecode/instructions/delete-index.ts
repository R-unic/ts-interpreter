import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionDELETE_INDEX extends Instruction {
  readonly op: InstructionOp.DELETE_INDEX;
  readonly object: number;
  readonly index: number;
}

export function DELETE_INDEX(object: number, index: number): InstructionDELETE_INDEX {
  return instruction(InstructionOp.DELETE_INDEX, { object, index });
}

export function isDELETE_INDEX(instruction: Instruction): instruction is InstructionDELETE_INDEX {
  return instruction.op === InstructionOp.DELETE_INDEX;
}