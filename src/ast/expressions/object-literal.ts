import ts, { isComputedPropertyName, isIdentifier, isPropertyAssignment, isShorthandPropertyAssignment } from "typescript";

import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { isLOADV } from "@/bytecode/instructions/loadv";
import { NEW_OBJECT } from "@/bytecode/instructions/new-object";
import { STORE_INDEX } from "@/bytecode/instructions/store-index";
import { STORE_INDEXK } from "@/bytecode/instructions/store-indexk";
import { STORE_INDEXN } from "@/bytecode/instructions/store-indexn";
import type { Codegen } from "@/codegen";

export function visitObjectLiteralExpression(codegen: Codegen, node: ts.ObjectLiteralExpression): void {
  const register = codegen.allocRegister();
  // TODO: constant object shit

  codegen.pushInstruction(NEW_OBJECT(register));
  for (const property of node.properties) {
    if (isPropertyAssignment(property)) {
      const valueInstruction = codegen.visit(property.initializer);
      const valueRegister = codegen.getTargetRegister(valueInstruction);
      if (isIdentifier(property.name))
        codegen.pushInstruction(STORE_INDEXK(valueRegister, register, constantVmValue(property.name.text)));
      else if (isComputedPropertyName(property.name)) {
        const index = property.name.expression;
        const indexInstruction = codegen.visit(index);
        const constantValue = codegen.getConstantValue(index);
        const indexRegister = codegen.getTargetRegister(indexInstruction);
        codegen.freeRegister(indexRegister);

        const isLoad = isLOADV(indexInstruction);
        if (constantValue !== undefined || isLoad) {
          const value = isLoad ? indexInstruction.value : constantVmValue(constantValue!);
          codegen.undoLastAddition();

          if (value.kind === VmValueKind.Int)
            codegen.pushInstruction(STORE_INDEXN(valueRegister, register, value.value as number));
          else
            codegen.pushInstruction(STORE_INDEXK(valueRegister, register, value));
        } else
          codegen.pushInstruction(STORE_INDEX(valueRegister, register, indexRegister));
      }

      codegen.freeRegister(valueRegister);
    } else if (isShorthandPropertyAssignment(property)) {
      const valueInstruction = codegen.visit(property.name);
      const valueRegister = codegen.getTargetRegister(valueInstruction);
      codegen.pushInstruction(STORE_INDEXK(valueRegister, register, constantVmValue(property.name.text)));
      codegen.freeRegister(valueRegister);
    } else {
      throw new Error("Not yet supported object element literal: " + ts.SyntaxKind[property.kind]);
    }
  }
}