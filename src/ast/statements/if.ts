import type ts from "typescript";

import { JZ } from "@/bytecode/instructions/jz";
import { InstructionJMP, JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitIfStatement(codegen: Codegen, node: ts.IfStatement): void {
  const condition = codegen.visit(node.expression);
  const conditionRegister = codegen.getTargetRegister(condition);
  codegen.freeRegister(conditionRegister);

  const jz = codegen.pushInstruction(JZ(conditionRegister, -1));
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
  const jzIndex = hasElseStatement ? elseBranchIndex : end;

  // backpatch addresses
  jz.address = jzIndex;
  if (jmp)
    jmp.address = end;
}