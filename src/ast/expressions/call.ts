import ts from "typescript";
import assert from "assert";

import { getCallMacro } from "../macros/call";
import { InstructionOp } from "@/bytecode/structs";
import { CALL } from "@/bytecode/instructions/call";
import type { Codegen } from "@/codegen";

export function visitCallExpression(codegen: Codegen, node: ts.CallExpression): void {
  const macro = getCallMacro(node, codegen);
  if (macro)
    return macro();

  const functionSymbol = codegen.getSymbol(node.expression);
  const label = codegen.getFunctionLabel(functionSymbol);
  if (label !== undefined) {
    // TODO: blah blah scoping blah blah

    const fn = label.declaration;
    let i = 0;
    for (const parameter of fn.parameters) {
      const symbol = codegen.getSymbol(parameter.name);
      assert(symbol, "no parameter symbol");

      const value = node.arguments[i++] ?? parameter.initializer;
      if (value === undefined) return;

      codegen.parameterValues.set(symbol, value);
    }

    codegen.visitList(fn.parameters);
    if (label.inlined && fn.body) {
      codegen.visitList(fn.body.statements);

      const end = codegen.currentIndex();
      for (const instruction of codegen.toPatch.inlineReturns)
        instruction.address = end;

      return;
    }

    const instruction = CALL(-1);
    codegen.addCallToPatch(functionSymbol!, instruction);
    codegen.pushInstruction(instruction);
  } else {
    throw new Error("Failed to find function label for function: " + functionSymbol?.name);
  }
}