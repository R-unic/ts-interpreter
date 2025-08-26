import { InstructionOp, type BinaryInstruction, type Instruction } from "./structs";

export interface InstructionADD extends BinaryInstruction {
  readonly op: InstructionOp.ADD;
}

export function ADD(target: number, a: number, b: number): InstructionADD {
  return {
    op: InstructionOp.ADD,
    target, a, b
  };
}

export function isADD(instruction: Instruction): instruction is InstructionADD {
  return instruction.op === InstructionOp.ADD;
}