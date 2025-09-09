import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionNEW_OBJECT extends Instruction {
  readonly op: InstructionOp.NEW_OBJECT;
  readonly target: number;
}

export function NEW_OBJECT(target: number): InstructionNEW_OBJECT {
  return instruction(InstructionOp.NEW_OBJECT, { target });
}

export function isNEW_OBJECT(instruction: Instruction): instruction is InstructionNEW_OBJECT {
  return instruction.op === InstructionOp.NEW_OBJECT;
}