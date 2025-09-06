import type ts from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { isLOADV, LOADV } from "@/bytecode/instructions/loadv";
import { NEW_ARRAY } from "@/bytecode/instructions/new-array";
import { ARRAY_PUSH } from "@/bytecode/instructions/array-push";
import { ARRAY_PUSHK } from "@/bytecode/instructions/array-pushk";
import { type VmValue, VmValueKind, vmValue, constantVmValue } from "@/bytecode/vm-value";
import type { Codegen } from "@/codegen";

export function visitArrayLiteralExpression(codegen: Codegen, node: ts.ArrayLiteralExpression): void {
  const register = codegen.allocRegister();
  const constants = node.elements.map(element => codegen.getConstantValue(element));
  const isConstantArray = constants.every(element => element !== undefined);
  if (isConstantArray) {
    const array: VmValue[] = [];
    for (const constant of constants)
      array.push(constantVmValue(constant));

    const value = vmValue(VmValueKind.Array, array);
    return void codegen.pushInstruction(LOADV(register, value));
  }

  codegen.pushInstruction(NEW_ARRAY(register));
  for (const element of node.elements) {
    const elementInstruction = codegen.visit(element);
    const elementRegister = getTargetRegister(elementInstruction);
    const value = codegen.getConstantValue(element);
    const isLoad = isLOADV(elementInstruction);
    if (value !== undefined || isLoad) {
      codegen.undoLastAddition(); // could easily cause bugs
      codegen.pushInstruction(ARRAY_PUSHK(register, isLoad ? elementInstruction.value : constantVmValue(value!)));
      continue;
    }

    codegen.pushInstruction(ARRAY_PUSH(register, elementRegister));
    codegen.freeRegister(elementRegister);
  }
}