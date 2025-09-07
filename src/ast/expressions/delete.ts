import ts, { isPropertyAccessExpression } from "typescript";
import assert from "assert";

import { getPropertyAccessMacro } from "../macros/property-access";
import { constantVmValue } from "@/bytecode/vm-value";
import { DELETE_INDEX } from "@/bytecode/instructions/delete-index";
import { DELETE_INDEXK } from "@/bytecode/instructions/delete-indexk";
import { type InstructionLOADV, isLOADV } from "@/bytecode/instructions/loadv";
import type { Instruction } from "@/bytecode/structs";
import type { Codegen } from "@/codegen";

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
    assert(typeof indexValue.value === "number", "DELETE_INDEXK value is not a number");
    codegen.undoLastAddition();
    codegen.pushInstruction(DELETE_INDEXK(objectRegister, constantValue as number));
  } else {
    const indexRegister = codegen.getTargetRegister(indexInstruction);
    codegen.pushInstruction(DELETE_INDEX(objectRegister, indexRegister));
    codegen.freeRegister(indexRegister);
  }
}