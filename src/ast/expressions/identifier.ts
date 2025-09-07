import type ts from "typescript";

import { constantVmValue } from "@/bytecode/vm-value";
import { LOAD } from "@/bytecode/instructions/load";
import { LOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

export function visitIdentifier(codegen: Codegen, node: ts.Identifier): void {
  const register = codegen.allocRegister();
  const value = codegen.getConstantValue(node);
  const instruction = value !== undefined
    ? LOADV(register, constantVmValue(value))
    : LOAD(register, node.text);

  codegen.pushInstruction(instruction);
}