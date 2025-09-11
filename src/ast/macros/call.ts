import ts, { isIdentifier, isPropertyAccessExpression } from "typescript";

import { constantVmValue } from "@/bytecode/vm-value";
import { isLOADV } from "@/bytecode/instructions/loadv";
import { PRINT } from "@/bytecode/instructions/print";
import { ARRAY_PUSHK } from "@/bytecode/instructions/array-pushk";
import { ARRAY_PUSH } from "@/bytecode/instructions/array-push";
import type { Codegen } from "@/codegen";
import { PRINTK } from "@/bytecode/instructions/printk";
import { isCALL } from "@/bytecode/instructions/call";

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
      const item = node.arguments[0]!;
      const instruction = codegen.visit(item);
      const constantValue = codegen.getConstantValue(item);
      const isLoad = isLOADV(instruction);
      if (constantValue !== undefined || isLoad) {
        codegen.undoLastAddition();
        codegen.pushInstruction(PRINTK(isLoad ? instruction.value : constantVmValue(constantValue!)));
      } else {
        const register = codegen.getTargetRegister(instruction);
        codegen.pushInstruction(PRINT(register));
        codegen.freeRegister(register);
      }
    };
  } else if (isMethodCall(node, node => codegen.isArrayLikeType(node), "push")) {
    // TODO: load the index it was pushed to if return value was used
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
          const register = "object" in instruction && typeof instruction.object === "number"
            ? instruction.object
            : codegen.getTargetRegister(instruction);

          codegen.pushInstruction(ARRAY_PUSH(arrayRegister, register));
          codegen.freeRegister(register);
        }
      }

      codegen.freeRegister(arrayRegister);
    };
  }

  return undefined;
}