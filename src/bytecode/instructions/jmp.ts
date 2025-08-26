import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionJMP extends Instruction {
  readonly op: InstructionOp.JMP;
  readonly address: number;
}

export function JMP(address: number): InstructionJMP {
  return instruction(InstructionOp.JMP, { address });
}

export function isJMP(instruction: Instruction): instruction is InstructionJMP {
  return instruction.op === InstructionOp.JMP;
}