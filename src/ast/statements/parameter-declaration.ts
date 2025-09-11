import ts, { isIdentifier } from "typescript";
import assert from "assert";

import { createStore } from "@/bytecode/utility";
import type { Codegen } from "@/codegen";

export function visitParameterDeclaration(codegen: Codegen, node: ts.ParameterDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  const symbol = codegen.getSymbol(node.name);
  assert(symbol, "No parameter symbol");

  const value = codegen.parameterValues.get(symbol!);
  // TODO: make sure the parameter is never re-assigned, if it is, it cannot be inlined
  if (value && codegen.isConstant(value)) return; // don't emit variables for constants, they will be inlined
  codegen.pushInstruction(createStore(codegen, node.name.text, value));
}