import ts, { isPropertyAccessExpression } from "typescript";
import assert from "assert";

import { getPropertyAccessMacro } from "../macros/property-access";
import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { DELETE_INDEX } from "@/bytecode/instructions/delete-index";
import { DELETE_INDEXN } from "@/bytecode/instructions/delete-indexn";
import { type InstructionLOADV, isLOADV } from "@/bytecode/instructions/loadv";
import type { Instruction } from "@/bytecode/structs";
import type { Codegen } from "@/codegen";
import { DELETE_INDEXK } from "@/bytecode/instructions/delete-indexk";

export function visitDeleteExpression(codegen: Codegen, node: ts.DeleteExpression): void {
  const access = node.expression as ts.AccessExpression;
  const isPropAccess = isPropertyAccessExpression(access);
  if (isPropAccess && getPropertyAccessMacro(access, codegen))
    throw new Error("Cannot delete macro property");

  const object = access.expression;
  const objectInstruction = codegen.visit(object);
  const objectRegister = codegen.getTargetRegister(objectInstruction);
  let indexInstruction: Instruction;
  let constantValue: string | number | boolean | undefined;

  if (isPropAccess) {
    throw new Error("Deleting via property access is not yet supported");
  } else {
    indexInstruction = codegen.visit(access.argumentExpression);
    constantValue = codegen.getConstantValue(access.argumentExpression);
  }

  const isLoad = isLOADV(indexInstruction);
  if (constantValue !== undefined || isLoad) {
    const indexValue = isLoad ? (indexInstruction as InstructionLOADV).value : constantVmValue(constantValue!);
    codegen.undoLastAddition();
    if (indexValue.kind === VmValueKind.Int)
      codegen.pushInstruction(DELETE_INDEXN(objectRegister, indexValue.value as number));
    else
      codegen.pushInstruction(DELETE_INDEXK(objectRegister, indexValue));
  } else {
    const indexRegister = codegen.getTargetRegister(indexInstruction);
    codegen.pushInstruction(DELETE_INDEX(objectRegister, indexRegister));
    codegen.freeRegister(indexRegister);
  }
}