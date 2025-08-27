import ts, { isExpression } from "typescript";

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