import ts, { isIdentifier, isPropertyAccessExpression } from "typescript";

import { constantVmValue } from "@/bytecode/vm-value";
import { isLOADV } from "@/bytecode/instructions/loadv";
import { PRINT } from "@/bytecode/instructions/print";
import { ARRAY_PUSHK } from "@/bytecode/instructions/array-pushk";
import { ARRAY_PUSH } from "@/bytecode/instructions/array-push";
import type { Codegen } from "@/codegen";

function isStaticPropertyCall(node: ts.CallExpression, leftName: string, rightName: string): boolean {
  const callee = node.expression;
  return isPropertyAccessExpression(callee)
    && isIdentifier(callee.expression)
    && isIdentifier(callee.name)
    && callee.expression.text === leftName
    && callee.name.text === rightName
}

function isMethodCall(
  node: ts.CallExpression,
  isType: (node: ts.Node) => boolean,
  methodName: string
): node is ts.CallExpression & { expression: ts.PropertyAccessExpression, name: ts.Identifier } {
  const callee = node.expression;
  return isPropertyAccessExpression(callee)
    && isType(callee.expression)
    && isIdentifier(callee.name)
    && callee.name.text === methodName
}

export function getCallMacro(node: ts.CallExpression, codegen: Codegen): (() => void) | undefined {
  if (isStaticPropertyCall(node, "console", "log")) {
    return () => {
      const instruction = codegen.visit(node.arguments[0]!);
      const register = codegen.getTargetRegister(instruction);
      codegen.pushInstruction(PRINT(register));
      codegen.freeRegister(register);
    };
  } else if (isMethodCall(node, node => codegen.isArrayType(node), "push")) {
    return () => {
      const callee = node.expression;
      const arrayInstruction = codegen.visit(callee.expression);
      const arrayRegister = codegen.getTargetRegister(arrayInstruction);

      for (const item of node.arguments) {
        const instruction = codegen.visit(item);
        const constantValue = codegen.getConstantValue(item);
        const isLoad = isLOADV(instruction);
        if (constantValue !== undefined || isLoad) {
          codegen.undoLastAddition();
          codegen.pushInstruction(ARRAY_PUSHK(arrayRegister, isLoad ? instruction.value : constantVmValue(constantValue!)));
        } else {
          const register = codegen.getTargetRegister(instruction);
          codegen.pushInstruction(ARRAY_PUSH(arrayRegister, register));
          codegen.freeRegister(register);
        }
      }

      codegen.freeRegister(arrayRegister);
    };
  }

  return undefined;
}