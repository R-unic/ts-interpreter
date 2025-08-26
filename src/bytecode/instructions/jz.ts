import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionJZ extends Instruction {
  readonly op: InstructionOp.JZ;
  readonly source: number;
  readonly address: number;
}

export function JZ(source: number, address: number): InstructionJZ {
  return instruction(InstructionOp.JZ, { source, address });
}

export function isJZ(instruction: Instruction): instruction is InstructionJZ {
  return instruction.op === InstructionOp.JZ;
}