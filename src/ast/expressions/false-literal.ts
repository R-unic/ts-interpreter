import type ts from "typescript";

import { isStandaloneExpression } from "../utility";
import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

export function visitFalseLiteral(codegen: Codegen, node: ts.FalseLiteral): void {
  const register = codegen.allocRegister();
  const value = vmValue(VmValueKind.Boolean, false);

  codegen.pushInstruction(LOADV(register, value));
  if (isStandaloneExpression(node))
    codegen.freeRegister(register);
}