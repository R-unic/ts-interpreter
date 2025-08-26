import ts, { isBinaryExpression, isExpression, isNumericLiteral, isStatement } from "typescript";

import { visitNumericLiteral } from "./ast/expressions/numeric-literal";
import { visitBinaryExpression } from "./ast/expressions/binary";
import { PRINT } from "./bytecode/instructions/print";
import { HALT } from "./bytecode/instructions/halt";
import type { Bytecode, Instruction } from "./bytecode/structs";

export class Codegen {
  private emitResult: Instruction[] = [];
  private allocatedRegisters = new Set<number>;
  private closestFreeRegister = 0;

  public constructor(
    public readonly program: ts.Program,
    public readonly maxRegisters: number
  ) { }

  public generate(sourceFile: ts.SourceFile): Bytecode {
    visit(this, sourceFile);
    this.emitResult.push(PRINT(0)); // temporary
    this.emitResult.push(HALT);
    const result = this.emitResult;
    this.emitResult = [];

    return result;
  }

  public visit(node: ts.Node): Instruction {
    visit(this, node);
    return this.emitResult.at(-1)!;
  }

  public generateChildren<T extends ts.Node>(node: T): void {
    ts.forEachChild(node, node => visit(this, node));
  }

  public pushInstruction(instruction: Instruction): void {
    this.emitResult.push(instruction);
  }

  public pushBytecode(bytecode: Bytecode): void {
    for (const instruction of bytecode)
      this.pushInstruction(instruction);
  }

  public allocRegister(): number {
    const register = this.closestFreeRegister;
    this.closestFreeRegister = Math.min(this.closestFreeRegister + 1, this.maxRegisters);
    this.allocatedRegisters.add(register);

    return register;
  }

  public freeRegister(register: number): void {
    this.allocatedRegisters.delete(register);
    if (this.closestFreeRegister > register)
      this.closestFreeRegister = register;
  }

  public freeRegisterRange(start: number, end: number): void {
    for (let i = start; i <= end; i++)
      this.freeRegister(i);
  }
}

function visitExpression(codegen: Codegen, node: ts.Expression): void {
  if (isBinaryExpression(node))
    return visitBinaryExpression(codegen, node);
  else if (isNumericLiteral(node))
    return visitNumericLiteral(codegen, node);

  codegen.generateChildren(node);
}

function visitStatement(codegen: Codegen, node: ts.Statement): void {
  codegen.generateChildren(node);
}

function visit(codegen: Codegen, node: ts.Node): void {
  if (isStatement(node))
    return visitStatement(codegen, node);
  else if (isExpression(node))
    return visitExpression(codegen, node);

  codegen.generateChildren(node);
}