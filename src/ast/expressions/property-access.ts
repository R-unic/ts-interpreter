import ts from "typescript";

import { loadConstant } from "@/bytecode/utility";
import { getPropertyAccessMacro } from "../macros/property-access";
import type { Codegen } from "@/codegen";

export function visitPropertyAccessExpression(codegen: Codegen, node: ts.PropertyAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

  const macro = getPropertyAccessMacro(node, codegen);
  if (macro)
    return macro();

  // TODO:
}