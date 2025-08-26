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
  NEGATE,

  AND,
  OR,
  EQ,
  NEQ,
  LT,
  LTE,
  GT,
  GTE,
  NOT,

  STORE,
  LOAD,

  PRINT,
  HALT
}

export interface Instruction {
  readonly op: InstructionOp;
}

export interface BinaryInstruction extends Instruction {
  readonly target: number;
  readonly a: number;
  readonly b: number;
}