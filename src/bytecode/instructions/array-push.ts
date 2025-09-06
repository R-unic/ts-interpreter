import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionARRAY_PUSH extends Instruction {
  readonly op: InstructionOp.ARRAY_PUSH;
  readonly target: number;
  readonly source: number;
}

export function ARRAY_PUSH(target: number, source: number): InstructionARRAY_PUSH {
  return instruction(InstructionOp.ARRAY_PUSH, { target, source });
}

export function isARRAY_PUSH(instruction: Instruction): instruction is InstructionARRAY_PUSH {
  return instruction.op === InstructionOp.ARRAY_PUSH;
}