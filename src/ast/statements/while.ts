import type ts from "typescript";

import { isTruthyConstant } from "../utility";
import { getTargetRegister } from "@/bytecode/utility";
import { type InstructionJZ, JZ } from "@/bytecode/instructions/jz";
import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

// TODO: DCE
export function visitWhileStatement(codegen: Codegen, node: ts.WhileStatement): void {
  const start = codegen.currentIndex();
  const infiniteLoop = isTruthyConstant(node.expression, codegen);
  let jz: Writable<InstructionJZ> | undefined;
  if (!infiniteLoop) {
    const condition = codegen.visit(node.expression);
    const conditionRegister = getTargetRegister(condition);
    codegen.freeRegister(conditionRegister);
    jz = codegen.pushInstruction(JZ(conditionRegister, -1));
  }

  codegen.visit(node.statement);
  codegen.pushInstruction(JMP(start));

  const end = codegen.currentIndex();
  codegen.backpatchLoopConstructs(start, end);
  if (jz)
    jz.address = end;
}