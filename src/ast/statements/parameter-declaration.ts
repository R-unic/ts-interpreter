import ts, { isIdentifier } from "typescript";
import assert from "assert";

import { getTargetRegister } from "@/bytecode/utility";
import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitParameterDeclaration(codegen: Codegen, node: ts.ParameterDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  const symbol = codegen.getSymbol(node.name);
  assert(symbol, "no parameter symbol");

  const value = codegen.parameterValues.get(symbol!);
  let sourceRegister: number;
  if (value !== undefined) {
    const instruction = codegen.visit(value);
    sourceRegister = getTargetRegister(instruction);
  } else {
    sourceRegister = codegen.allocRegister();
    codegen.pushInstruction(LOADV(sourceRegister, vmValue(VmValueKind.Null, undefined)));
  }

  codegen.pushInstruction(STORE(sourceRegister, node.name.text));
  codegen.freeRegister(sourceRegister);
  // TODO: more guidelines for freeing
}