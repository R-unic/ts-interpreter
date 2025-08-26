import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export interface InstructionLOADV extends Instruction {
  readonly op: InstructionOp.LOADV;
  readonly target: number;
  readonly value: VmValue;
}

export function LOADV(target: number, value: VmValue): InstructionLOADV {
  return instruction(InstructionOp.LOADV, { target, value });
}

export function isLOADV(instruction: Instruction): instruction is InstructionLOADV {
  return instruction.op === InstructionOp.LOADV;
}