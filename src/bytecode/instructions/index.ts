import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionINDEX extends Instruction {
  readonly op: InstructionOp.INDEX;
  readonly target: number;
  readonly object: number;
  readonly index: number;
}

export function INDEX(target: number, object: number, index: number): InstructionINDEX {
  return instruction(InstructionOp.INDEX, { target, object, index });
}

export function isINDEX(instruction: Instruction): instruction is InstructionINDEX {
  return instruction.op === InstructionOp.INDEX;
}