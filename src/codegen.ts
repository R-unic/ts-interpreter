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
  isCallExpression,
  isParameter,
  isReturnStatement,
  isBlock,
  isVariableStatement,
  isBreakStatement,
  isContinueStatement,
  isForStatement,
  isPropertyAccessExpression,
  isElementAccessExpression,
  isEnumDeclaration,
  isArrayLiteralExpression
} from "typescript";
import assert from "assert";

import { canInline, getTypeOfNode } from "@/ast/utility";
import { getTargetRegister, maybeGetTargetRegister } from "@/bytecode/utility";
import { visitTrueLiteral } from "@/ast/expressions/true-literal";
import { visitFalseLiteral } from "@/ast/expressions/false-literal";
import { visitNumericLiteral } from "@/ast/expressions/numeric-literal";
import { visitStringLiteral } from "@/ast/expressions/string-literal";
import { visitBinaryExpression } from "@/ast/expressions/binary";
import { visitPropertyAccessExpression } from "./ast/expressions/property-access";
import { visitElementAccessExpression } from "./ast/expressions/element-access";
import { visitIdentifier } from "@/ast/expressions/identifier";
import { visitCallExpression } from "@/ast/expressions/call";
import { visitWhileStatement } from "@/ast/statements/while";
import { visitDoStatement } from "@/ast/statements/do";
import { visitForStatement } from "./ast/statements/for";
import { visitIfStatement } from "@/ast/statements/if";
import { visitVariableDeclaration } from "@/ast/statements/variable-declaration";
import { visitFunctionDeclaration } from "@/ast/statements/function";
import { visitParameterDeclaration } from "@/ast/statements/parameter-declaration";
import { visitEnumDeclaration } from "./ast/statements/enum-declaration";
import { visitReturnStatement } from "@/ast/statements/return";
import { visitBreakStatement } from "@/ast/statements/break";
import { visitContinueStatement } from "@/ast/statements/continue";
import { visitBlock } from "@/ast/statements/block";
import { visitArrayLiteralExpression } from "./ast/expressions/array-literal";
import { RETURN } from "@/bytecode/instructions/return";
import { HALT } from "@/bytecode/instructions/halt";
import { InstructionOp, type Bytecode, type Instruction } from "@/bytecode/structs";
import type { InstructionCALL } from "@/bytecode/instructions/call";
import type { InstructionJMP } from "@/bytecode/instructions/jmp";

interface FunctionLabel {
  readonly declaration: ts.FunctionDeclaration;
  readonly inlined: boolean;
  readonly symbol: ts.Symbol;
}

interface ToPatch {
  calls: Map<ts.Symbol, Set<Writable<InstructionCALL>>>;
  breaks: Set<Writable<InstructionJMP>>;
  continues: Set<Writable<InstructionJMP>>;
}

export class Codegen {
  public readonly toPatch: ToPatch = {
    calls: new Map,
    breaks: new Set,
    continues: new Set
  };
  public parameterValues = new Map<ts.Symbol, ts.Expression>;

  private readonly checker: ts.TypeChecker;
  private emitResult: Instruction[] = [];
  private previousEmitResult: Instruction[] = [];
  private functions = new Map<ts.Symbol, FunctionLabel>;
  private allocatedRegisters = new Set<number>;
  private closestFreeRegister = 0;

  public constructor(
    program: ts.Program,
    public readonly maxRegisters: number
  ) {
    this.checker = program.getTypeChecker();
  }

  public emit(sourceFile: ts.SourceFile): Bytecode {
    for (const statement of sourceFile.statements)
      this.visit(statement);

    this.emitResult.push(HALT);
    this.emitFunctions();

    const result = this.emitResult;
    this.reset();

    return result;
  }

  public visit<T extends Instruction = Instruction>(node: ts.Node): T {
    if (isStatement(node)) {
      this.visitStatement(node);
      return this.lastInstruction();
    } else if (isExpression(node)) {
      this.visitExpression(node);
      return this.lastInstruction();
    } else if (isVariableDeclaration(node)) {
      visitVariableDeclaration(this, node);
      return this.lastInstruction();
    } else if (isParameter(node)) {
      visitParameterDeclaration(this, node);
      return this.lastInstruction();
    } else {
      // console.warn("Unhandled non-statement and non-expression: " + ts.SyntaxKind[node.kind]);
    }

    this.visitChildren(node);
    return this.lastInstruction();
  }

  public visitList<T extends ts.Node>(nodes: T[] | ts.NodeArray<T>): Instruction {
    for (const node of nodes)
      this.visit(node);

    return this.lastInstruction();
  }

  public visitChildren<T extends ts.Node>(node: T): void {
    ts.forEachChild(node, node => this.visit(node));
  }

  public pushInstruction<T extends Instruction>(instruction: T): Writable<T> {
    this.previousEmitResult = [...this.emitResult];
    this.emitResult.push(instruction);
    return instruction as never;
  }

  public pushInstructions(instructions: Bytecode): void {
    const current = [...this.emitResult];
    for (const instruction of instructions)
      this.pushInstruction(instruction);

    this.previousEmitResult = current;
  }

  public popInstruction(): Instruction | undefined {
    return this.emitResult.pop();
  }

  public undoLastAddition(): void {
    const set = new Set(this.previousEmitResult);
    const difference = this.emitResult.filter(v => !set.has(v));
    for (const instruction of difference) {
      const register = maybeGetTargetRegister(instruction);
      if (register === undefined) continue;
      this.freeRegister(register);
    }

    this.emitResult = this.previousEmitResult;
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

  /**
   * Returns the target register for the given instruction, or the last allocated register
   * if no target register could be found.
   * @param instruction - The instruction to get the target register from
   */
  public getTargetRegister(instruction: Instruction): number {
    try {
      return getTargetRegister(instruction);
    } catch {
      return this.lastAllocatedRegister();
    }
  }

  public lastAllocatedRegister(): number {
    return Math.max(this.closestFreeRegister - 1, 0);
  }

  public registerScope(callback: () => void): void {
    const enclosing = this.closestFreeRegister;
    this.closestFreeRegister = 0;
    callback();
    this.closestFreeRegister = enclosing;
  }

  public addCallToPatch(symbol: ts.Symbol, instruction: InstructionCALL): void {
    const callsToPatch = this.toPatch.calls.get(symbol) ?? new Set;
    callsToPatch.add(instruction);
    this.toPatch.calls.set(symbol, callsToPatch);
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
      inlined: canInline(node, this),
      symbol,
    });
  }

  public getSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.checker.getSymbolAtLocation(node);
  }

  public getType(node: ts.Node): ts.Type | undefined {
    return getTypeOfNode(node, this.checker);
  }

  public isArrayType(node: ts.Node | ts.Type): boolean {
    const type = "pos" in node && "end" in node ? this.getType(node) : node;
    assert(type !== undefined, "no node type when checking isArrayType()");

    return this.checker.isArrayLikeType(type);
  }

  public getTypeOfSymbol(node: ts.Node): [ts.Type, ts.Symbol] | undefined {
    const symbol = this.getSymbol(node);
    if (!symbol) return;

    const newLocal = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    return [newLocal, symbol];
  }

  public getUnaliasedSymbol(node: ts.Node): ts.Symbol | undefined {
    let symbol = this.getSymbol(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);

    return symbol;
  }

  public isConstant(node: ts.Expression): boolean {
    return this.getConstantValue(node) !== undefined
  }

  public getConstantValue(node: ts.Expression): string | number | boolean | undefined {
    if (node.kind === ts.SyntaxKind.TrueKeyword)
      return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword)
      return false;
    if (isNumericLiteral(node))
      return Number(node.text);
    if (isStringLiteral(node))
      return node.text;

    if (ts.isIdentifier(node)) {
      const result = this.getTypeOfSymbol(node);
      if (result) {
        const [type, symbol] = result;
        if ((type.flags & ts.TypeFlags.Literal) !== 0)
          return (type as ts.LiteralType).value as never;

        const declaration = symbol.valueDeclaration;
        if (declaration && isVariableDeclaration(declaration) && declaration.initializer)
          return this.getConstantValue(declaration.initializer);
      }
    }

    return this.checker.getConstantValue(node as never);
  }

  public backpatchLoopConstructs(loopStart: number, loopEnd: number): void {
    for (const instruction of this.toPatch.continues)
      instruction.address = loopStart;
    for (const instruction of this.toPatch.breaks)
      instruction.address = loopEnd;

    this.toPatch.continues = new Set;
    this.toPatch.breaks = new Set;
  }

  public currentIndex(): number {
    return this.emitResult.length;
  }

  /**
   * Emits the bytecode for all functions in the current program.
   * For each function, it:
   * - Backpatches the addresses of all CALL instructions pointing to the current function.
   * - Emits the function body at the end of the program.
   * - Updates the program counter to point to the new end of the program.
   */
  private emitFunctions(): void {
    const { emitResult } = this;
    let pc = this.emitResult.length;

    for (const [symbol, { inlined, declaration }] of this.functions) {
      if (declaration.body === undefined) continue;
      if (inlined) continue;

      const start = pc;
      const last = this.visitList(declaration.body.statements);
      this.backpatchCallAddresses(symbol, start);
      if (last.op !== InstructionOp.RETURN)
        this.emitResult.push(RETURN);

      pc += 1 + start - emitResult.length;
    }
  }

  /**
   * Backpatches the addresses of all CALL instructions referring to the given function symbol.
   * This is done after all functions have been emitted, because the addresses of the functions are not
   * yet known when processing the CALL instructions.
   * @param symbol The function symbol to look for.
   * @param address The address to patch the calls with.
   */
  private backpatchCallAddresses(symbol: ts.Symbol, address: number): void {
    const respectiveCalls = this.toPatch.calls.get(symbol) ?? [];
    for (const respectiveCall of respectiveCalls)
      respectiveCall.address = address;
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
    else if (isArrayLiteralExpression(node))
      return visitArrayLiteralExpression(this, node);
    else if (node.kind === ts.SyntaxKind.TrueKeyword)
      return visitTrueLiteral(this, node as never);
    else if (node.kind === ts.SyntaxKind.FalseKeyword)
      return visitFalseLiteral(this, node as never);
    else if (isIdentifier(node))
      return visitIdentifier(this, node);
    else if (isPropertyAccessExpression(node))
      return visitPropertyAccessExpression(this, node);
    else if (isElementAccessExpression(node))
      return visitElementAccessExpression(this, node);

    this.visitChildren(node);
  }

  private visitStatement(node: ts.Statement): void {
    if (isBlock(node))
      return visitBlock(this, node);
    else if (isWhileStatement(node))
      return visitWhileStatement(this, node);
    else if (isDoStatement(node))
      return visitDoStatement(this, node);
    else if (isForStatement(node))
      return visitForStatement(this, node);
    else if (isBreakStatement(node))
      return visitBreakStatement(this, node);
    else if (isContinueStatement(node))
      return visitContinueStatement(this, node);
    else if (isIfStatement(node))
      return visitIfStatement(this, node);
    else if (isFunctionDeclaration(node))
      return visitFunctionDeclaration(this, node);
    else if (isReturnStatement(node))
      return visitReturnStatement(this, node);
    else if (isEnumDeclaration(node))
      return visitEnumDeclaration(this, node);
    else if (isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations)
        visitVariableDeclaration(this, declaration);

      return;
    }

    this.visitChildren(node);
  }

  private lastInstruction<T extends Instruction = Instruction>(): T {
    return this.emitResult.at(-1)! as T;
  }

  private reset(): void {
    this.emitResult = [];
    this.functions = new Map;
    this.toPatch.calls = new Map;
    this.toPatch.breaks = new Set;
    this.toPatch.continues = new Set;
    this.allocatedRegisters = new Set;
    this.closestFreeRegister = 0;
  }
}