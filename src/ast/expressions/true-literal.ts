import type ts from "typescript";

import { isStandaloneExpression } from "../utility";
import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

export function visitTrueLiteral(codegen: Codegen, node: ts.TrueLiteral): void {
  const register = codegen.allocRegister();
  const value = vmValue(VmValueKind.Boolean, true);

  codegen.pushInstruction(LOADV(register, value));
  // if (isStandaloneExpression(node.parent))
  //   codegen.freeRegister(register);
}