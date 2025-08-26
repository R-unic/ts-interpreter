import type ts from "typescript";

import { vmValue, VmValueKind } from "@/bytecode/vm-value";
import { LOADV } from "@/bytecode/instructions/loadv";
import type { Codegen } from "@/codegen";

export function visitNumericLiteral(codegen: Codegen, node: ts.NumericLiteral): void {
  const { text } = node;
  const register = codegen.allocRegister();
  const kind = text.includes(".") ? VmValueKind.Float : VmValueKind.Int;
  const value = vmValue(kind, parseFloat(text));

  codegen.pushInstruction(LOADV(register, value));
}