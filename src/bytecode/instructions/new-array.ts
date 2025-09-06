import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionNEW_ARRAY extends Instruction {
  readonly op: InstructionOp.NEW_ARRAY;
  readonly target: number;
}

export function NEW_ARRAY(target: number): InstructionNEW_ARRAY {
  return instruction(InstructionOp.NEW_ARRAY, { target });
}

export function isNEW_ARRAY(instruction: Instruction): instruction is InstructionNEW_ARRAY {
  return instruction.op === InstructionOp.NEW_ARRAY;
}