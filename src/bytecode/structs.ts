export type Bytecode = readonly Instruction[];
export enum InstructionOp {
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

export interface BinaryInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly target: number;
  readonly a: number;
  readonly b: number;
}