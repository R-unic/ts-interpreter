import ts, { isVariableDeclarationList } from "typescript";

import { Null } from "@/bytecode/vm-value";
import { emitWhileLoop } from "../utility";
import { STOREK } from "@/bytecode/instructions/storek";
import type { Codegen } from "@/codegen";

const TRUE = ts.factory.createTrue();

export function visitForStatement(codegen: Codegen, node: ts.ForStatement): void {
  const declarations = new Set<ts.VariableDeclaration>;
  if (node.initializer && isVariableDeclarationList(node.initializer))
    for (const declaration of node.initializer.declarations) {
      declarations.add(declaration);
      codegen.visit(declaration);
    }

  emitWhileLoop(codegen, node.condition ?? TRUE, node.statement, node.incrementor);

  for (const declaration of declarations)
    codegen.pushInstruction(STOREK((declaration.name as ts.Identifier).text, Null));
}