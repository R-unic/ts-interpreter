export type Bytecode = readonly Instruction[];
export const enum InstructionOp {
  LOADV,
  ADD,
  SUB,
  MUL,
  DIV,
  IDIV,
  POW,
  MOD,
  NEGATE
}

export interface Instruction {
  readonly op: InstructionOp;
}

export interface BinaryInstruction extends Instruction {
  readonly target: number;
  readonly a: number;
  readonly b: number;
}