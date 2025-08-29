import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionCALL extends Instruction {
  readonly op: InstructionOp.CALL;
  readonly address: number;
}

export function CALL(address: number): InstructionCALL {
  return instruction(InstructionOp.CALL, { address });
}

export function isCALL(instruction: Instruction): instruction is InstructionCALL {
  return instruction.op === InstructionOp.CALL;
}