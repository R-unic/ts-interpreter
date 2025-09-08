import ts, { isIdentifier } from "typescript";

import { LEN } from "@/bytecode/instructions/array-len";
import type { Codegen } from "@/codegen";

function isTypeProperty(node: ts.PropertyAccessExpression, isType: (node: ts.Node) => boolean, propertyName: string): boolean {
  return isType(node.expression)
    && isIdentifier(node.name)
    && node.name.text === propertyName
}

export function getPropertyAccessMacro(node: ts.PropertyAccessExpression, codegen: Codegen): (() => void) | undefined {
  if (isTypeProperty(node, node => codegen.isArrayLikeType(node) || codegen.isStringLikeType(node), "length")) {
    return () => {
      const sourceRegister = codegen.getTargetRegister(codegen.visit(node.expression));
      const register = codegen.allocRegister();
      codegen.pushInstruction(LEN(register, sourceRegister));
      codegen.freeRegister(sourceRegister);
    };
  }

  return undefined;
}