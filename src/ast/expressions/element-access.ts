import type ts from "typescript";

import { isElementOrPropertyAssignment, pushEnumConstant } from "../utility";
import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { INDEX } from "@/bytecode/instructions";
import { INDEXK } from "@/bytecode/instructions/indexk";
import { isLOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

function emitAccess(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const objectInstruction = codegen.visit(node.expression);
  const indexInstruction = codegen.visit(node.argumentExpression);
  const objectRegister = codegen.getTargetRegister(objectInstruction);
  const value = codegen.getConstantValue(node.argumentExpression);
  const isLoad = isLOADV(indexInstruction);
  if (value !== undefined || isLoad) {
    const indexValue = isLoad ? indexInstruction.value : constantVmValue(value!);
    if (indexValue.kind === VmValueKind.Int) {
      const register = isLoad ? indexInstruction.target : codegen.allocRegister();
      codegen.undoLastAddition();
      return void codegen.pushInstruction(INDEXK(register, objectRegister, indexValue.value as number));
    }
  }

  const register = codegen.allocRegister();
  const indexRegister = codegen.getTargetRegister(indexInstruction);
  codegen.pushInstruction(INDEX(register, objectRegister, indexRegister));
}

export function visitElementAccessExpression(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return pushEnumConstant(codegen, constantValue as never);

  if (isElementOrPropertyAssignment(node)) return;
  emitAccess(codegen, node);
}