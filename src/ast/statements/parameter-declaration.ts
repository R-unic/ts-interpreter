import ts, { isIdentifier } from "typescript";
import assert from "assert";

import { loadNull } from "@/bytecode/utility";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitParameterDeclaration(codegen: Codegen, node: ts.ParameterDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  const symbol = codegen.getSymbol(node.name);
  assert(symbol, "no parameter symbol");

  const value = codegen.parameterValues.get(symbol!);
  // TODO: make sure the parameter is never re-assigned, if it is, it cannot be inlined
  if (value && codegen.isConstant(value)) return; // don't emit variables for constants, they will be inlined

  let register: number;
  if (value !== undefined) {
    const instruction = codegen.visit(value);
    register = codegen.getTargetRegister(instruction);
  } else {
    register = codegen.allocRegister();
    codegen.pushInstruction(loadNull(register));
  }

  codegen.pushInstruction(STORE(register, node.name.text));
  codegen.freeRegister(register);
  // TODO: more guidelines for freeing
}