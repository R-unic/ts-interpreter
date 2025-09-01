import type ts from "typescript";

import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitContinueStatement(codegen: Codegen, node: ts.ContinueStatement): void {
  codegen.toPatch.continues.add(codegen.pushInstruction(JMP(-1)));
}