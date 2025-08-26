import ts, { isBinaryExpression, isExpression, isNumericLiteral, isStatement } from "typescript";

import { visitTrueLiteral } from "./ast/expressions/true-literal";
import { visitFalseLiteral } from "./ast/expressions/false-literal";
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
    this.visit(sourceFile);
    // this.emitResult.push(PRINT(0)); // temporary
    this.emitResult.push(HALT);
    const result = this.emitResult;
    this.reset();

    return result;
  }

  public visit(node: ts.Node): Instruction {
    if (isStatement(node)) {
      this.visitStatement(node);
      return this.lastInstruction();
    } else if (isExpression(node)) {
      this.visitExpression(node);
      return this.lastInstruction();
    }

    this.generateChildren(node);
    return this.lastInstruction();
  }

  public generateChildren<T extends ts.Node>(node: T): void {
    ts.forEachChild(node, node => this.visit(node));
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

  private visitExpression(node: ts.Expression): void {
    if (isBinaryExpression(node))
      return visitBinaryExpression(this, node);
    else if (isNumericLiteral(node))
      return visitNumericLiteral(this, node);
    else if (node.kind === ts.SyntaxKind.TrueKeyword)
      return visitTrueLiteral(this, node as never);
    else if (node.kind === ts.SyntaxKind.FalseKeyword)
      return visitFalseLiteral(this, node as never);

    this.generateChildren(node);
  }

  private visitStatement(node: ts.Statement): void {
    this.generateChildren(node);
  }

  private lastInstruction(): Instruction {
    return this.emitResult.at(-1)!;
  }

  private reset(): void {
    this.emitResult = [];
    this.allocatedRegisters = new Set;
    this.closestFreeRegister = 0;
  }
}