import type { InstructionJNZ } from "./instructions/jnz";
import type { InstructionJZ } from "./instructions/jz";
import type { VmValue } from "./vm-value";

export type Bytecode = readonly Instruction[];
export enum InstructionOp {
  LOADV,
  ADD,
  ADDK,
  SUB,
  SUBK,
  MUL,
  MULK,
  DIV,
  DIVK,
  IDIV,
  IDIVK,
  POW,
  POWK,
  MOD,
  MODK,
  BXOR,
  BXORK,
  BAND,
  BANDK,
  BOR,
  BORK,
  BLSH,
  BLSHK,
  BRSH,
  BRSHK,
  BARSH,
  BARSHK,
  BNOT,
  BNOTK,
  NEGATE,
  NEGATEK,

  AND,
  ANDK,
  OR,
  ORK,
  NULL_COALESCE,
  NULL_COALESCEK,
  EQ,
  NEQ,
  LT,
  LTE,
  GT,
  GTE,
  NOT,
  NOTK,

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
  NEW_OBJECT,
  NEW_ARRAY,
  ARRAY_PUSH,
  ARRAY_PUSHK,
  LEN,

  JMP,
  JZ,
  JNZ,
  JLT,
  JLTE,
  JGT,
  JGTE,
  JEQ,
  JNEQ,

  STORE,
  STOREK,
  LOAD,
  CALL,
  RETURN,

  PRINT,
  PRINTK,
  HALT
}

export interface Instruction {
  readonly op: InstructionOp;
}

export type ConditionJumpInstruction<J extends InstructionJZ | InstructionJNZ = InstructionJZ> = J | BinaryJumpInstruction;

export interface BinaryInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly target: number;
  readonly a: number;
  readonly b: number;
}

export interface BinaryJumpInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly a: number;
  readonly b: number;
  readonly address: number;
}

export interface ConstantBinaryInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly target: number;
  readonly aValue: VmValue;
  readonly b: number;
}

export interface UnaryInstruction<T extends InstructionOp = InstructionOp> extends Instruction {
  readonly op: T;
  readonly target: number;
  readonly operand: number;
}