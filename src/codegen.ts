import ts, {
  isExpression,
  isStatement,
  isBinaryExpression,
  isNumericLiteral,
  isStringLiteral,
  isVariableDeclaration,
  isIdentifier,
  isWhileStatement,
  isDoStatement,
  isIfStatement,
  isFunctionDeclaration,
  isCallExpression
} from "typescript";

import { visitTrueLiteral } from "@/ast/expressions/true-literal";
import { visitFalseLiteral } from "@/ast/expressions/false-literal";
import { visitNumericLiteral } from "@/ast/expressions/numeric-literal";
import { visitStringLiteral } from "@/ast/expressions/string-literal";
import { visitBinaryExpression } from "@/ast/expressions/binary";
import { visitIdentifier } from "@/ast/expressions/identifier";
import { visitCallExpression } from "@/ast/expressions/call";
import { visitWhileStatement } from "@/ast/statements/while";
import { visitDoStatement } from "@/ast/statements/do";
import { visitIfStatement } from "@/ast/statements/if";
import { visitVariableDeclaration } from "@/ast/statements/variable-declaration";
import { visitFunctionDeclaration } from "@/ast/statements/function";
import { PRINT } from "@/bytecode/instructions/print";
import { RETURN } from "@/bytecode/instructions/return";
import { HALT } from "@/bytecode/instructions/halt";
import type { InstructionCALL } from "@/bytecode/instructions/call";
import type { Bytecode, Instruction } from "@/bytecode/structs";

interface FunctionLabel {
  readonly declaration: ts.FunctionDeclaration;
  readonly symbol: ts.Symbol;
}

export class Codegen {
  public callsToPatch = new Map<ts.Symbol, Writable<InstructionCALL>[]>;

  private readonly checker: ts.TypeChecker;
  private emitResult: Instruction[] = [];
  private functions = new Map<ts.Symbol, FunctionLabel>;
  private allocatedRegisters = new Set<number>;
  private closestFreeRegister = 0;

  public constructor(
    program: ts.Program,
    public readonly maxRegisters: number
  ) {
    this.checker = program.getTypeChecker();
  }

  public generate(sourceFile: ts.SourceFile): Bytecode {
    for (const statement of sourceFile.statements)
      this.visit(statement);

    // this.emitResult.push(PRINT(Math.max(this.closestFreeRegister - 1, 0))); // temporary
    this.emitResult.push(HALT);
    let pc = this.emitResult.length;
    for (const [symbol, label] of this.functions) {
      if (label.declaration.body === undefined) continue;

      const start = pc;
      const respectiveCalls = this.callsToPatch.get(symbol) ?? [];
      for (const respectiveCall of respectiveCalls) {
        respectiveCall.address = start;
      }

      this.visit(label.declaration.body);
      this.emitResult.push(RETURN);
      pc += 1 + start - this.emitResult.length;
    }

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

  public registerScope(callback: () => void): void {
    const enclosing = this.closestFreeRegister;
    this.closestFreeRegister = 0;
    callback();
    this.closestFreeRegister = enclosing;
  }

  public addCallToPatch(symbol: ts.Symbol, instruction: InstructionCALL): void {
    const callsToPatch = this.callsToPatch.get(symbol) ?? [];
    callsToPatch.push(instruction);
    this.callsToPatch.set(symbol, callsToPatch);
  }

  public getFunctionLabel(symbol: ts.Symbol | undefined): FunctionLabel | undefined {
    if (symbol === undefined) return;
    return this.functions.get(symbol);
  }

  public createFunctionLabel(node: ts.FunctionDeclaration): void {
    let symbol: ts.Symbol | undefined;
    if (node.name)
      symbol = this.checker.getSymbolAtLocation(node.name);
    else {
      const type = this.checker.getTypeAtLocation(node);
      symbol = type.getSymbol();
    }

    if (symbol === undefined)
      throw new Error(`Could not find symbol for function:\n${node.getText()}\n`);

    this.functions.set(symbol, {
      declaration: node,
      symbol
    });
  }

  public getSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.checker.getSymbolAtLocation(node);
  }

  public getUnaliasedSymbol(node: ts.Node): ts.Symbol | undefined {
    let symbol = this.getSymbol(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);

    return symbol;
  }

  public currentIndex(): number {
    return this.emitResult.length - 1;
  }

  private visitExpression(node: ts.Expression): void {
    if (isCallExpression(node))
      return visitCallExpression(this, node);
    else if (isBinaryExpression(node))
      return visitBinaryExpression(this, node);
    else if (isNumericLiteral(node))
      return visitNumericLiteral(this, node);
    else if (isStringLiteral(node))
      return visitStringLiteral(this, node);
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
    else if (isIfStatement(node))
      return visitIfStatement(this, node);
    else if (isFunctionDeclaration(node))
      return visitFunctionDeclaration(this, node);

    this.visitChildren(node);
  }

  private lastInstruction(): Instruction {
    return this.emitResult.at(-1)!;
  }

  private reset(): void {
    this.emitResult = [];
    this.functions = new Map;
    this.callsToPatch = new Map;
    this.allocatedRegisters = new Set;
    this.closestFreeRegister = 0;
  }
}