import type ts from "typescript";

import type { Codegen } from "@/codegen";

export function visitFunctionDeclaration(codegen: Codegen, node: ts.FunctionDeclaration): void {
  // TODO: scoping

  codegen.createFunctionLabel(node);
}