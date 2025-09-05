import ts, { isVariableDeclarationList } from "typescript";

import { whileLoop } from "../utility";
import { loadNull } from "@/bytecode/utility";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

const TRUE = ts.factory.createTrue();

export function visitForStatement(codegen: Codegen, node: ts.ForStatement): void {
  const declarations = new Set<ts.VariableDeclaration>;
  if (node.initializer && isVariableDeclarationList(node.initializer))
    for (const declaration of node.initializer.declarations) {
      declarations.add(declaration);
      codegen.visit(declaration);
    }

  whileLoop(codegen, node.condition ?? TRUE, node.statement, node.incrementor);

  const register = codegen.allocRegister();
  codegen.pushInstruction(loadNull(register));
  for (const declaration of declarations)
    codegen.pushInstruction(STORE(register, (declaration.name as ts.Identifier).text));

  codegen.freeRegister(register);
}