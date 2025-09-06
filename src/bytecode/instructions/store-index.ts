import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionSTORE_INDEX extends Instruction {
  readonly op: InstructionOp.STORE_INDEX;
  readonly source: number;
  readonly object: number;
  readonly index: number;
}

export function STORE_INDEX(source: number, object: number, index: number): InstructionSTORE_INDEX {
  return instruction(InstructionOp.STORE_INDEX, { source, object, index });
}

export function isSTORE_INDEX(instruction: Instruction): instruction is InstructionSTORE_INDEX {
  return instruction.op === InstructionOp.STORE_INDEX;
}