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
  BXOR,
  BAND,
  BOR,
  BLSH,
  BRSH,
  BARSH,
  BNOT,
  NEGATE,

  AND,
  OR,
  NULL_COALESCE,
  EQ,
  NEQ,
  LT,
  LTE,
  GT,
  GTE,
  NOT,

  INC,
  DEC,
  INDEX,
  INDEXN,
  INDEXK,
  STORE_INDEX,
  STORE_INDEXN,
  STORE_INDEXK,
  DELETE_INDEX,
  DELETE_INDEXN,
  DELETE_INDEXK,
  NEW_ARRAY,
  ARRAY_PUSH,
  ARRAY_PUSHK,
  LEN,

  JMP,
  JZ,
  JNZ,

  STORE,
  STOREK,
  LOAD,
  CALL,
  RETURN,

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

export interface UnaryInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly target: number;
  readonly operand: number;
}