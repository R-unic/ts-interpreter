import ts from "typescript";

import { emitAccess, isElementOrPropertyAssignment } from "../utility";
import { getPropertyAccessMacro } from "@/ast/macros/property-access";
import { loadConstant } from "@/bytecode/utility";
import type { Codegen } from "@/codegen";

export function visitPropertyAccessExpression(codegen: Codegen, node: ts.PropertyAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

  const macro = getPropertyAccessMacro(node, codegen);
  if (macro)
    return macro();

  if (isElementOrPropertyAssignment(node)) return;
  emitAccess(codegen, node.expression, node.name, true);
}