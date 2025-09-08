import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";
import type { VmValue } from "../vm-value";

export interface InstructionSTOREK extends Instruction {
  readonly op: InstructionOp.STOREK;
  readonly name: string;
  readonly value: VmValue;
}

export function STOREK(name: string, value: VmValue): InstructionSTOREK {
  return instruction(InstructionOp.STOREK, { name, value });
}

export function isSTOREK(instruction: Instruction): instruction is InstructionSTOREK {
  return instruction.op === InstructionOp.STOREK;
}