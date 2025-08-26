import type ts from "typescript";

import { LOAD } from "@/bytecode/instructions/load";
import type { Codegen } from "@/codegen";

export function visitIdentifier(codegen: Codegen, node: ts.Identifier): void {
  const register = codegen.allocRegister();
  codegen.pushInstruction(LOAD(register, node.text));
}