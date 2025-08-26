import type ts from "typescript";

import { LOADV } from "../../bytecode/loadv";
import { vmValue, VmValueKind } from "../../bytecode/vm-value";
import type { Codegen } from "../../codegen";

export function visitNumericLiteral(codegen: Codegen, node: ts.NumericLiteral): void {
  const { text } = node;
  const register = codegen.allocRegister();
  const kind = text.includes(".") ? VmValueKind.Float : VmValueKind.Int;
  const value = vmValue(kind, parseFloat(text));

  codegen.pushInstruction(LOADV(register, value));
}