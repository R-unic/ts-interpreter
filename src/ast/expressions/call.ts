import ts, { isIdentifier } from "typescript";
import assert from "assert";

import { getCallMacro } from "../macros/call";
import { CALL } from "@/bytecode/instructions/call";
import type { Codegen } from "@/codegen";

export function visitCallExpression(codegen: Codegen, node: ts.CallExpression): void {
  const macro = getCallMacro(node, codegen);
  if (macro)
    return macro();

  const functionSymbol = codegen.getSymbol(node.expression);
  const label = codegen.getFunctionLabel(functionSymbol);
  if (label === undefined)
    throw new Error("Failed to find function label for function: " + functionSymbol?.name);

  // TODO: blah blah scoping blah blah
  const fn = label.declaration;
  let i = 0;
  for (const parameter of fn.parameters) {
    assert(isIdentifier(parameter.name), "Binding patterns not yet supported");
    const symbol = codegen.getSymbol(parameter.name);
    assert(symbol, "No parameter symbol");

    const value = node.arguments[i++] ?? parameter.initializer;
    if (value === undefined) return;

    codegen.parameterValues.set(symbol, value);
  }

  codegen.visitList(fn.parameters);
  if (fn.body) {
    codegen.visitList(fn.body.statements);
    if (label.inlined) {
      const end = codegen.currentIndex();
      for (const instruction of label.inlineReturns)
        instruction.address = end;
    } else {
      codegen.undoLastAddition();
      codegen.addCallToPatch(functionSymbol!, codegen.pushInstruction(CALL(-1)));
      // TODO: somehow accurately predict which path it will take to give the right return register
      for (const register of label.returnRegisters)
        codegen.closestFreeRegister = register + 1;
    }
  }
}