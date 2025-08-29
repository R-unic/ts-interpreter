import type ts from "typescript";

import type { Codegen } from "@/codegen";

export function visitBlock(codegen: Codegen, node: ts.Block): void {
  codegen.visitList(node.statements);
}