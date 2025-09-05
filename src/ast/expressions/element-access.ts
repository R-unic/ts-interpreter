import ts from "typescript";

import { pushEnumConstant } from "../utility";
import type { Codegen } from "@/codegen";

export function visitElementAccessExpression(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return pushEnumConstant(codegen, constantValue as never);

  // TODO:
}