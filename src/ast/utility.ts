import ts, {
  findAncestor,
  isBinaryExpression,
  isCallExpression,
  isDoStatement,
  isElementAccessExpression,
  isExpression,
  isExpressionStatement,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionLike,
  isIdentifier,
  isPropertyAccessExpression,
  isVariableDeclaration,
  isWhileStatement
} from "typescript";

import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { isLOADV, LOADV } from "@/bytecode/instructions/loadv";
import { INC } from "@/bytecode/instructions/inc";
import { DEC } from "@/bytecode/instructions/dec";
import { JMP } from "@/bytecode/instructions/jmp";
import { INDEX } from "@/bytecode/instructions";
import { INDEXK } from "@/bytecode/instructions/indexk";
import { INDEXN } from "@/bytecode/instructions/indexn";
import { type InstructionJZ, JZ } from "@/bytecode/instructions/jz";
import type { Codegen } from "@/codegen";

/**
 * Emits bytecode for accessing the given property/index of the given object.
 *
 * This function will emit an instruction for accessing the property/index of the
 * object, taking into account whether the index is a constant or a runtime
 * expression. If the index is a constant number, the instruction will be an
 * {@linkcode INDEXN} instruction, if it is a VmValue it will be an {@linkcode INDEXK}
 * instruction, otherwise it will be an {@linkcode INDEX} instruction
 * instruction.
 */
export function emitAccess(codegen: Codegen, object: ts.LeftHandSideExpression, index: ts.Expression, isPropertyAccess: boolean): void {
  const propertyAccess = isIdentifier(index) && isPropertyAccess;
  const objectInstruction = codegen.visit(object);
  const indexInstruction = propertyAccess
    ? LOADV(codegen.allocRegister(), constantVmValue(index.text))
    : codegen.visit(index);

  const objectRegister = codegen.getTargetRegister(objectInstruction);
  const indexRegister = codegen.getTargetRegister(indexInstruction);
  const value = codegen.getConstantValue(index);
  const isLoad = isLOADV(indexInstruction);
  if (value !== undefined || isLoad) {
    const indexValue = isLoad ? indexInstruction.value : constantVmValue(value!);
    const register = codegen.getTargetRegister(indexInstruction);
    if (!propertyAccess)
      codegen.undoLastAddition();

    if (indexValue.kind === VmValueKind.Int)
      codegen.pushInstruction(INDEXN(register, objectRegister, indexValue.value as number));
    else
      codegen.pushInstruction(INDEXK(register, objectRegister, indexValue));

  } else {
    const register = codegen.allocRegister();
    codegen.freeRegister(indexRegister);
    codegen.pushInstruction(INDEX(register, objectRegister, indexRegister));
  }
  codegen.freeRegister(objectRegister);
}

/**
 * Emits a increment/decrement instruction for the given AST node.
 * @param codegen The codegen to emit to.
 * @param node The AST node to emit for.
 * @param returnsOld Whether the increment/decrement instruction should return the old value.
 */
export function emitIncrementor(codegen: Codegen, node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, returnsOld: boolean): void {
  const op = node.operator === ts.SyntaxKind.PlusPlusToken ? INC : DEC;
  const isAlone = findAncestor(node, a =>
    isExpressionStatement(a)
    && !isCallExpression(a.expression)
    && !isElementAccessExpression(a.expression)
  );

  const targetRegister = isAlone ? undefined : codegen.allocRegister();
  if (isIdentifier(node.operand))
    codegen.pushInstruction(op(targetRegister, node.operand.text, returnsOld));
  else
    throw new Error("Incrementing/decrementing non-identifiers is not yet supported");
}

/**
 * Returns true if the given variable can be inlined. This is only true if
 * the variable is declared as a constant and has a constant initializer.
 */
export function canInlineVariable(node: ts.VariableDeclaration, codegen: Codegen): node is ts.VariableDeclaration & { initializer: ts.Expression } {
  const list = node.parent as ts.VariableDeclarationList;
  return (list.flags & ts.NodeFlags.Const) !== 0
    && node.initializer !== undefined
    && codegen.isConstant(node.initializer);
}

export function hasModifier(node: ts.HasModifiers, kind: ts.ModifierSyntaxKind): boolean {
  return node.modifiers !== undefined && node.modifiers.some(modifier => modifier.kind === kind);
}

/**
 * Returns true if the given property or element access expression is a left-hand side of an assignment.
 */
export function isElementOrPropertyAssignment(node: ts.ElementAccessExpression | ts.PropertyAccessExpression): boolean {
  return node.parent && isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
}

/**
 * Generates code for a while loop. The condition is evaluated at the top of the loop,
 * and the loop body is executed if the condition evaluates to true. The afterBody
 * argument is optional, and is executed after the loop body on each iteration.
 * @param condition The condition to evaluate at the top of the loop.
 * @param body The loop body.
 * @param afterBody The expression to execute after the loop body on each iteration.
 */
export function whileLoop(codegen: Codegen, condition: ts.Expression, body: ts.Statement, afterBody?: ts.Expression): void {
  const start = codegen.currentIndex();
  const infiniteLoop = isTruthyConstant(condition, codegen);
  let jz: Writable<InstructionJZ> | undefined;
  if (!infiniteLoop) {
    const instruction = codegen.visit(condition);
    const conditionRegister = codegen.getTargetRegister(instruction);
    codegen.freeRegister(conditionRegister);
    jz = codegen.pushInstruction(JZ(conditionRegister, -1));
  }

  codegen.visit(body);
  if (afterBody) codegen.visit(afterBody);
  codegen.pushInstruction(JMP(start));

  const end = codegen.currentIndex();
  codegen.backpatchLoopConstructs(start, end);
  if (jz) jz.address = end;
}

/** Returns true if the given expression evaluates to a truthy constant value. */
export function isTruthyConstant(expression: ts.Expression, codegen: Codegen): boolean {
  return Boolean(codegen.getConstantValue(expression));
}

/** Gets the resolved type of any given node  */
export function getTypeOfNode(node: ts.Node, checker: ts.TypeChecker): ts.Type | undefined {
  if (
    isExpression(node)
    || isIdentifier(node)
    || isPropertyAccessExpression(node)
    || isElementAccessExpression(node)
  ) {
    return checker.getTypeAtLocation(node);
  }

  if (isVariableDeclaration(node)) {
    if (node.initializer)
      return getTypeOfNode(node.initializer, checker);

    return checker.getTypeAtLocation(node.name);
  }

  try {
    return checker.getTypeAtLocation(node);
  } catch {
    return undefined;
  }
}

/** Returns true for simple functions -- those with no loops, closures, or direct recursion */
export function canInlineFunction(fn: ts.FunctionDeclaration, codegen: Codegen): boolean {
  if (fn.body === undefined)
    return false;

  const bodyStatements = fn.body.statements;
  return !isDirectlyRecursive(fn, codegen)
    && !bodyStatements.some(isLoop) // no loops
    && !bodyStatements.some(isFunctionLike) // no closures
}

/** Returns true if the function calls itself (direct recursion)  */
function isDirectlyRecursive(
  fn: ts.FunctionLikeDeclaration,
  codegen: Codegen
): boolean {
  if (!fn.body) return false;

  const fnNameNode = (fn as ts.FunctionDeclaration | ts.MethodDeclaration).name;
  const fnSymbol = codegen.getSymbol(fnNameNode ?? fn);
  if (!fnSymbol)
    return false;

  return containsCallSymbol(fn.body, fnSymbol, codegen);
}

function containsCallSymbol(
  node: ts.Node,
  fnSymbol: ts.Symbol,
  codegen: Codegen
): boolean {
  let recursive = false;

  function visit(n: ts.Node): void {
    if (ts.isCallExpression(n) || ts.isNewExpression(n)) {
      const calledSymbol = codegen.getSymbol(n.expression);
      if (calledSymbol === fnSymbol) {
        recursive = true;
        return;
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(node);
  return recursive;
}

export function isLoop(node: ts.Statement): boolean {
  return isWhileStatement(node)
    || isDoStatement(node)
    || isForStatement(node)
    || isForInStatement(node)
    || isForOfStatement(node);
}

export function isStandaloneExpression(node: ts.Node): boolean {
  if (!node || !isExpression(node))
    return false;

  let parent = node.parent;
  while (parent && isExpression(parent))
    parent = parent.parent;

  if (!parent)
    return true; // should not happen but safe guard

  // these are contexts where an expression can be "standalone"
  switch (parent.kind) {
    case ts.SyntaxKind.ExpressionStatement:
    case ts.SyntaxKind.ReturnStatement:
    case ts.SyntaxKind.ThrowStatement:
    case ts.SyntaxKind.YieldExpression:
      return true;

    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.IfStatement:
      return (parent as ts.IfStatement).expression !== node;

    case ts.SyntaxKind.ForStatement:
      return true;

    case ts.SyntaxKind.SwitchStatement:
      return true;

    default:
      return false;
  }
}