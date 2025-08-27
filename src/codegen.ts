import ts, {
  isExpression,
  isStatement,
  isBinaryExpression,
  isNumericLiteral,
  isVariableDeclaration,
  isIdentifier,
  isWhileStatement,
  isDoStatement
} from "typescript";

import { visitTrueLiteral } from "@/ast/expressions/true-literal";
import { visitFalseLiteral } from "@/ast/expressions/false-literal";
import { visitNumericLiteral } from "@/ast/expressions/numeric-literal";
import { visitBinaryExpression } from "@/ast/expressions/binary";
import { visitIdentifier } from "./ast/expressions/identifier";
import { visitVariableDeclaration } from "@/ast/statements/variable-declaration";
import { visitWhileStatement } from "./ast/statements/while";
import { visitDoStatement } from "./ast/statements/do";
import { PRINT } from "@/bytecode/instructions/print";
import { HALT } from "@/bytecode/instructions/halt";
import type { Bytecode, Instruction } from "@/bytecode/structs";

export class Codegen {
  private emitResult: Instruction[] = [];
  private allocatedRegisters = new Set<number>;
  private closestFreeRegister = 0;

  public constructor(
    public readonly program: ts.Program,
    public readonly maxRegisters: number
  ) { }

  public generate(sourceFile: ts.SourceFile): Bytecode {
    for (const statement of sourceFile.statements)
      this.visit(statement);

    this.emitResult.push(PRINT(this.closestFreeRegister - 1)); // temporary
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
    } else if (isVariableDeclaration(node)) {
      visitVariableDeclaration(this, node);
      return this.lastInstruction();
    } else {
      // console.warn("Unhandled non-statement and non-expression: " + ts.SyntaxKind[node.kind]);
    }

    this.visitChildren(node);
    return this.lastInstruction();
  }

  public visitChildren<T extends ts.Node>(node: T): void {
    ts.forEachChild(node, node => this.visit(node));
  }

  public insertInstruction(index: number, instruction: Instruction): void {
    this.emitResult.splice(index + 1, 0, instruction);
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

  public currentIndex(): number {
    return this.emitResult.length - 1;
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
    else if (isIdentifier(node))
      return visitIdentifier(this, node);

    this.visitChildren(node);
  }

  private visitStatement(node: ts.Statement): void {
    if (isWhileStatement(node))
      return visitWhileStatement(this, node);
    else if (isDoStatement(node))
      return visitDoStatement(this, node);

    this.visitChildren(node);
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