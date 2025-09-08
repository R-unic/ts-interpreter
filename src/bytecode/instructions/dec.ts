import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionDEC extends Instruction {
  readonly op: InstructionOp.DEC;
  readonly target?: number | undefined;
  readonly name: string;
  readonly returnsOld: boolean;
}

export function DEC(target: number | undefined, name: string, returnsOld: boolean): InstructionDEC {
  return instruction(InstructionOp.DEC, { target, name, returnsOld });
}

export function isDEC(instruction: Instruction): instruction is InstructionDEC {
  return instruction.op === InstructionOp.DEC;
}