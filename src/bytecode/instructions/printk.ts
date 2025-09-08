import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export interface InstructionPRINTK extends Instruction {
  readonly op: InstructionOp.PRINTK;
  readonly value: VmValue;
}

export function PRINTK(value: VmValue): InstructionPRINTK {
  return instruction(InstructionOp.PRINTK, { value });
}

export function isPRINTK(instruction: Instruction): instruction is InstructionPRINTK {
  return instruction.op === InstructionOp.PRINTK;
}