import assert from "assert";
import type ts from "typescript";

import { CALL } from "@/bytecode/instructions/call";
import type { Codegen } from "@/codegen";

export function visitCallExpression(codegen: Codegen, node: ts.CallExpression): void {
  const symbol = codegen.getSymbol(node.expression);
  const label = codegen.getFunctionLabel(symbol);
  if (label !== undefined) {
    const instruction = CALL(-1);
    // TODO: blah blah scoping blah blah

    let i = 0;
    for (const parameter of label.declaration.parameters) {
      const symbol = codegen.getSymbol(parameter.name);
      assert(symbol, "no parameter symbol");

      const value = node.arguments[i++] ?? parameter.initializer;
      if (value === undefined) return;

      codegen.parameterValues.set(symbol, value);
    }

    codegen.visitList(label.declaration.parameters);
    codegen.addCallToPatch(symbol!, instruction);
    codegen.pushInstruction(instruction);
  } else {
    throw new Error("Regular function calls (not inlined) are not yet implemented");
  }
}