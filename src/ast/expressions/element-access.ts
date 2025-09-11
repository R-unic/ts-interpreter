import type ts from "typescript";

import { emitAccess, isElementOrPropertyAssignment } from "../utility";
import { loadConstant } from "@/bytecode/utility";
import type { Codegen } from "@/codegen";

export function visitElementAccessExpression(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

  if (isElementOrPropertyAssignment(node)) return;
  emitAccess(codegen, node.expression, node.argumentExpression, false);
}