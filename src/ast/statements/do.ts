import type ts from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { JNZ } from "@/bytecode/instructions/jnz";
import type { Codegen } from "@/codegen";

export function visitDoStatement(codegen: Codegen, node: ts.DoStatement): void {
  const start = codegen.currentIndex();
  codegen.visit(node.statement);

  const condition = codegen.visit(node.expression);
  const conditionRegister = getTargetRegister(condition);
  codegen.freeRegister(conditionRegister);
  codegen.pushInstruction(JNZ(conditionRegister, start + 1));
}