import type ts from "typescript";

import { isStandaloneExpression } from "../utility";
import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

export function visitStringLiteral(codegen: Codegen, node: ts.StringLiteral): void {
  const register = codegen.allocRegister();
  const value = vmValue(VmValueKind.String, node.text);

  codegen.pushInstruction(LOADV(register, value));
  // if (isStandaloneExpression(node.parent))
  //   codegen.freeRegister(register);
}