import { instruction } from "../utility";
import { InstructionOp, type Instruction } from "../structs";

export interface InstructionJNZ extends Instruction {
  readonly op: InstructionOp.JNZ;
  readonly source: number;
  readonly address: number;
}

export function JNZ(source: number, address: number): InstructionJNZ {
  return instruction(InstructionOp.JNZ, { source, address });
}

export function isJNZ(instruction: Instruction): instruction is InstructionJNZ {
  return instruction.op === InstructionOp.JNZ;
}