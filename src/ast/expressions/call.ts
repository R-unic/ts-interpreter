import type ts from "typescript";

import { CALL } from "@/bytecode/instructions/call";
import type { Codegen } from "@/codegen";

export function visitCallExpression(codegen: Codegen, node: ts.CallExpression): void {
  const symbol = codegen.getSymbol(node.expression);
  const label = codegen.getFunctionLabel(symbol);
  if (label !== undefined) {
    const instruction = CALL(-1);
    codegen.addCallToPatch(symbol!, instruction);
    codegen.pushInstruction(instruction);
  } else {
    // regular call
    throw new Error("Regular function calls (not inlined) are not yet implemented");
  }
}