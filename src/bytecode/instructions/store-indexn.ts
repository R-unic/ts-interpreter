import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionSTORE_INDEXN extends Instruction {
  readonly op: InstructionOp.STORE_INDEXN;
  readonly source: number;
  readonly object: number;
  readonly index: number;
}

export function STORE_INDEXN(source: number, object: number, index: number): InstructionSTORE_INDEXN {
  return instruction(InstructionOp.STORE_INDEXN, { source, object, index });
}

export function isSTORE_INDEXN(instruction: Instruction): instruction is InstructionSTORE_INDEXN {
  return instruction.op === InstructionOp.STORE_INDEXN;
}