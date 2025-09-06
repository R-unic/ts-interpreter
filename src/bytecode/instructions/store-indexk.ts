import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionSTORE_INDEXK extends Instruction {
  readonly op: InstructionOp.STORE_INDEXK;
  readonly source: number;
  readonly object: number;
  readonly index: number;
}

export function STORE_INDEXK(source: number, object: number, index: number): InstructionSTORE_INDEXK {
  return instruction(InstructionOp.STORE_INDEXK, { source, object, index });
}

export function isSTORE_INDEXK(instruction: Instruction): instruction is InstructionSTORE_INDEXK {
  return instruction.op === InstructionOp.STORE_INDEXK;
}