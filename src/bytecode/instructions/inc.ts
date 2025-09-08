import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionINC extends Instruction {
  readonly op: InstructionOp.INC;
  readonly target?: number | undefined;
  readonly name: string;
  readonly returnsOld: boolean;
}

export function INC(target: number | undefined, name: string, returnsOld: boolean): InstructionINC {
  return instruction(InstructionOp.INC, { target, name, returnsOld });
}

export function isINC(instruction: Instruction): instruction is InstructionINC {
  return instruction.op === InstructionOp.INC;
}