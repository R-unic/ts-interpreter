import ts from "typescript";

import { pushEnumConstant } from "../utility";
import { getPropertyAccessMacro } from "../macros/property-access";
import type { Codegen } from "@/codegen";

export function visitPropertyAccessExpression(codegen: Codegen, node: ts.PropertyAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return pushEnumConstant(codegen, constantValue as never);

  const macro = getPropertyAccessMacro(node, codegen);
  if (macro)
    return macro();

  // TODO:
}