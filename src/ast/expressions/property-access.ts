import ts, { isIdentifier } from "typescript";

import { pushEnumConstant } from "../utility";
import type { Codegen } from "@/codegen";
import { ARRAY_LEN } from "@/bytecode/instructions/array-len";

export function visitPropertyAccessExpression(codegen: Codegen, node: ts.PropertyAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return pushEnumConstant(codegen, constantValue as never);

  if (
    codegen.isArrayType(node.expression)
    && isIdentifier(node.name)
    && node.name.text === "length"
  ) {
    const sourceRegister = codegen.getTargetRegister(codegen.visit(node.expression));
    const register = codegen.allocRegister();
    codegen.pushInstruction(ARRAY_LEN(register, sourceRegister));
    return codegen.freeRegister(sourceRegister);
  }
  // TODO:
}