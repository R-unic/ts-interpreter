import ts, { isIdentifier } from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitVariableDeclaration(codegen: Codegen, node: ts.VariableDeclaration): void {
  let sourceRegister: number;
  if (node.initializer) {
    const instruction = codegen.visit(node.initializer);
    sourceRegister = getTargetRegister(instruction);
  } else {
    sourceRegister = codegen.allocRegister();
    codegen.pushInstruction(LOADV(sourceRegister, vmValue(VmValueKind.Null, undefined)));
  }

  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  codegen.pushInstruction(STORE(sourceRegister, node.name.text));
  codegen.freeRegister(sourceRegister);
}