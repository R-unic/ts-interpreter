import ts, { isIdentifier } from "typescript";

import { isLOADV, LOADV } from "@/bytecode/instructions/loadv";
import { LEN } from "@/bytecode/instructions/array-len";
import type { Codegen } from "@/codegen";
import { constantVmValue } from "@/bytecode/vm-value";

function isTypeProperty(node: ts.PropertyAccessExpression, isType: (node: ts.Node) => boolean, propertyName: string): boolean {
  return isType(node.expression)
    && isIdentifier(node.name)
    && node.name.text === propertyName
}

export function getPropertyAccessMacro(node: ts.PropertyAccessExpression, codegen: Codegen): (() => void) | undefined {
  if (isTypeProperty(node, node => codegen.isArrayLikeType(node) || codegen.isStringLikeType(node), "length")) {
    return () => {
      const instruction = codegen.visit(node.expression);
      const sourceRegister = codegen.getTargetRegister(instruction);
      const constantValue = codegen.getConstantValue(node.expression);
      const isLoad = isLOADV(instruction);
      const { value } = isLoad ? instruction.value : constantVmValue(constantValue!);
      if (typeof value === "string" && (constantValue !== undefined || isLoad)) {
        codegen.undoLastAddition();
        codegen.pushInstruction(LOADV(sourceRegister, constantVmValue(value.length)));
      } else {
        codegen.freeRegister(sourceRegister);
        codegen.pushInstruction(LEN(sourceRegister, sourceRegister));
      }
    };
  }

  return undefined;
}