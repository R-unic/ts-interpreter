import ts, { isIdentifier } from "typescript";

import { canInlineVariable } from "../utility";
import { loadNull } from "@/bytecode/utility";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitVariableDeclaration(codegen: Codegen, node: ts.VariableDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  if (canInlineVariable(node, codegen)) return; // don't emit variables for constants, they will be inlined

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
