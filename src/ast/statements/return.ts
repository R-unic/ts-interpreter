import type ts from "typescript";

import { loadNull } from "@/bytecode/utility";
import { RETURN } from "@/bytecode/instructions/return";
import type { Codegen } from "@/codegen";

export function visitReturnStatement(codegen: Codegen, node: ts.ReturnStatement): void {
  let register: number;
  if (node.expression) {
    const instruction = codegen.visit(node.expression);
    register = codegen.getTargetRegister(instruction);
  } else {
    register = codegen.allocRegister();
    codegen.pushInstruction(loadNull(register));
  }

  codegen.pushInstruction(RETURN);
  codegen.freeRegister(register);
}