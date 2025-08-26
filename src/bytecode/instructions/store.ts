import { InstructionOp, type Instruction } from "../structs";

export interface InstructionSTORE extends Instruction {
  readonly op: InstructionOp.STORE;
  readonly source: number;
  readonly name: string;
}

export function STORE(source: number, name: string): InstructionSTORE {
  return {
    op: InstructionOp.STORE,
    source, name
  };
}

export function isSTORE(instruction: Instruction): instruction is InstructionSTORE {
  return instruction.op === InstructionOp.STORE;
}