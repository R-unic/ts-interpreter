import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export interface InstructionARRAY_PUSHK extends Instruction {
  readonly op: InstructionOp.ARRAY_PUSHK;
  readonly target: number;
  readonly value: VmValue;
}

export function ARRAY_PUSHK(target: number, value: VmValue): InstructionARRAY_PUSHK {
  return instruction(InstructionOp.ARRAY_PUSHK, { target, value });
}

export function isARRAY_PUSHK(instruction: Instruction): instruction is InstructionARRAY_PUSHK {
  return instruction.op === InstructionOp.ARRAY_PUSHK;
}