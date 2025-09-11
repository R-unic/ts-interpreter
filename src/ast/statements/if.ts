import type ts from "typescript";

import { InstructionJMP, JMP } from "@/bytecode/instructions/jmp";
import type { ConditionJumpInstruction } from "@/bytecode/structs";
import type { Codegen } from "@/codegen";

export function visitIfStatement(codegen: Codegen, node: ts.IfStatement): void {
  const conditionJump: Writable<ConditionJumpInstruction> = codegen.visitCondition(node.expression);
  codegen.registerScope(() => codegen.visit(node.thenStatement));

  let jmp: Writable<InstructionJMP> | undefined;
  const hasElseStatement = node.elseStatement !== undefined;
  if (hasElseStatement)
    jmp = codegen.pushInstruction(JMP(-1));

  const elseBranchIndex = codegen.currentIndex();
  codegen.registerScope(() => {
    if (!hasElseStatement) return;
    codegen.visit(node.elseStatement);
  });

  const end = codegen.currentIndex();
  const conditionJumpIndex = hasElseStatement ? elseBranchIndex : end;

  // backpatch addresses
  conditionJump.address = conditionJumpIndex;
  if (jmp)
    jmp.address = end;
}