import type ts from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { JZ } from "@/bytecode/instructions/jz";
import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitWhileStatement(codegen: Codegen, node: ts.WhileStatement): void {
  const start = codegen.currentIndex();
  const condition = codegen.visit(node.expression);
  const conditionRegister = getTargetRegister(condition);
  codegen.freeRegister(conditionRegister);

  const jzIndex = codegen.currentIndex();
  codegen.visit(node.statement);
  codegen.insertInstruction(jzIndex, JZ(conditionRegister, codegen.currentIndex() + 3));
  codegen.pushInstruction(JMP(start + 1));
}