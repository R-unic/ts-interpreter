import ts from "typescript";

import { pushEnumConstant } from "../utility";
import type { Codegen } from "@/codegen";

export function visitPropertyAccessExpression(codegen: Codegen, node: ts.PropertyAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return pushEnumConstant(codegen, constantValue as never);

  // TODO:
}