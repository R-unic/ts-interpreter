import ts, { isIdentifier } from "typescript";

import { loadNull } from "@/bytecode/utility";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitVariableDeclaration(codegen: Codegen, node: ts.VariableDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  let register: number;
  if (node.initializer) {
    const instruction = codegen.visit(node.initializer);
    register = codegen.getTargetRegister(instruction);
  } else {
    register = codegen.allocRegister();
    codegen.pushInstruction(loadNull(register));
  }

  codegen.pushInstruction(STORE(register, node.name.text));
  codegen.freeRegister(register);
  // TODO: more guidelines for freeing
}