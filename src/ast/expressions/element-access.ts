import type ts from "typescript";

import { isElementOrPropertyAssignment } from "../utility";
import { loadConstant } from "@/bytecode/utility";
import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { INDEX } from "@/bytecode/instructions";
import { INDEXN } from "@/bytecode/instructions/indexn";
import { INDEXK } from "@/bytecode/instructions/indexk";
import { isLOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

function emitAccess(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const objectInstruction = codegen.visit(node.expression);
  const indexInstruction = codegen.visit(node.argumentExpression);
  const objectRegister = codegen.getTargetRegister(objectInstruction);
  const indexRegister = codegen.getTargetRegister(indexInstruction);
  const value = codegen.getConstantValue(node.argumentExpression);
  const isLoad = isLOADV(indexInstruction);
  if (value !== undefined || isLoad) {
    const indexValue = isLoad ? indexInstruction.value : constantVmValue(value!);
    const register = isLoad ? indexInstruction.target : codegen.allocRegister();
    codegen.undoLastAddition();

    if (indexValue.kind === VmValueKind.Int)
      codegen.pushInstruction(INDEXN(register, objectRegister, indexValue.value as number));
    else
      codegen.pushInstruction(INDEXK(register, objectRegister, indexValue));
  } else {
    const register = codegen.allocRegister();
    codegen.pushInstruction(INDEX(register, objectRegister, indexRegister));
  }

  codegen.freeRegister(indexRegister);
}

export function visitElementAccessExpression(codegen: Codegen, node: ts.ElementAccessExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

  if (isElementOrPropertyAssignment(node)) return;
  emitAccess(codegen, node);
}