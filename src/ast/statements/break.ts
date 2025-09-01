import type ts from "typescript";

import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitBreakStatement(codegen: Codegen, node: ts.BreakStatement): void {
  codegen.toPatch.breaks.add(codegen.pushInstruction(JMP(-1)));
}