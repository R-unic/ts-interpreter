import ts, { isDoStatement, isElementAccessExpression, isExpression, isForInStatement, isForOfStatement, isForStatement, isFunctionLike, isIdentifier, isPropertyAccessExpression, isStringLiteral, isVariableDeclaration, isWhileStatement } from "typescript";

import { JMP } from "@/bytecode/instructions/jmp";
import { type InstructionJZ, JZ } from "@/bytecode/instructions/jz";
import type { Codegen } from "@/codegen";

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
export function canInline(fn: ts.FunctionDeclaration, codegen: Codegen): boolean {
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
  if (!fnNameNode) {
    const fnSymbol = codegen.getSymbol(fn);
    if (!fnSymbol) return false;
    return containsCallSymbol(fn.body, fnSymbol, codegen);
  }

  const fnSymbol = codegen.getSymbol(fnNameNode);
  if (!fnSymbol) return false;

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