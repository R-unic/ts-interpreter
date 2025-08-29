import type ts from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { JZ } from "@/bytecode/instructions/jz";
import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitIfStatement(codegen: Codegen, node: ts.IfStatement): void {
  const condition = codegen.visit(node.expression);
  const conditionRegister = getTargetRegister(condition);
  codegen.freeRegister(conditionRegister);

  const jzIndex = codegen.currentIndex();
  codegen.registerScope(() => codegen.visit(node.thenStatement));

  const elseBranchIndex = codegen.currentIndex() + 2 + (node.elseStatement ? 1 : 0);
  codegen.insertInstruction(jzIndex, JZ(conditionRegister, elseBranchIndex));

  const afterIfStatementIndex = codegen.currentIndex();
  codegen.registerScope(() => {
    if (!node.elseStatement) return;
    codegen.visit(node.elseStatement);
  });

  if (node.elseStatement)
    codegen.insertInstruction(afterIfStatementIndex, JMP(codegen.currentIndex() + 2));
}